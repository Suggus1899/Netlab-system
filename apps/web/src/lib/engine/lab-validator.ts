import type { NetworkDevice, NetworkLink, LabStep, StepValidation } from '@si-learning/shared';
import { simulatePing, findPath } from './packet-engine';

interface ValidationCtx {
  devices: NetworkDevice[];
  links: NetworkLink[];
}

interface ValidationResult {
  passed: boolean;
  message: string;
}

function validateConfig(ctx: ValidationCtx, expected: Record<string, unknown>): ValidationResult {
  const deviceId = expected.deviceId as string;
  const interfaceId = expected.interfaceId as string;
  const device = ctx.devices.find((d) => d.id === deviceId);
  if (!device) return { passed: false, message: `Dispositivo ${deviceId} no encontrado` };

  const iface = device.interfaces.find((i) => i.id === interfaceId);
  if (!iface) return { passed: false, message: `Interfaz ${interfaceId} no encontrada` };

  if (expected.ip && iface.ip !== expected.ip) {
    return { passed: false, message: `IP esperada: ${expected.ip}, actual: ${iface.ip || 'sin configurar'}` };
  }
  if (expected.mask && iface.mask !== expected.mask) {
    return { passed: false, message: `Máscara esperada: ${expected.mask}, actual: ${iface.mask || 'sin configurar'}` };
  }

  return { passed: true, message: 'Configuración correcta' };
}

function validatePing(ctx: ValidationCtx, expected: Record<string, unknown>): ValidationResult {
  const sourceDeviceId = expected.sourceDeviceId as string;
  const destinationIp = expected.destinationIp as string;
  const expectSuccess = expected.success !== false;

  const result = simulatePing(ctx, sourceDeviceId, destinationIp);

  if (expectSuccess && result.success) {
    return { passed: true, message: `Ping exitoso a ${destinationIp}` };
  }
  if (!expectSuccess && !result.success) {
    return { passed: true, message: `Ping falló como se esperaba` };
  }

  return {
    passed: false,
    message: expectSuccess
      ? `Ping a ${destinationIp} falló: ${result.error}`
      : `Se esperaba que el ping fallara, pero fue exitoso`,
  };
}

function validateRouting(ctx: ValidationCtx, expected: Record<string, unknown>): ValidationResult {
  const deviceId = expected.deviceId as string;
  const device = ctx.devices.find((d) => d.id === deviceId);
  if (!device) return { passed: false, message: 'Dispositivo no encontrado' };

  const routes = device.config.routingTable || [];
  const dest = expected.destination as string;
  const nextHop = expected.nextHop as string;

  const found = routes.find((r) => r.destination === dest && r.nextHop === nextHop);
  if (!found) {
    return { passed: false, message: `Ruta ${dest} via ${nextHop} no encontrada` };
  }
  return { passed: true, message: 'Ruta configurada correctamente' };
}

function validateFirewall(ctx: ValidationCtx, expected: Record<string, unknown>): ValidationResult {
  const deviceId = expected.deviceId as string;
  const device = ctx.devices.find((d) => d.id === deviceId);
  if (!device) return { passed: false, message: 'Dispositivo firewall no encontrado' };
  if (device.type !== 'FIREWALL') return { passed: false, message: `${device.label} no es un Firewall` };

  const rules = device.config.firewallRules || [];
  const minRules = (expected.minRules as number) || 1;
  if (rules.length < minRules) {
    return { passed: false, message: `Se requieren al menos ${minRules} reglas de firewall (hay ${rules.length})` };
  }

  if (expected.hasRule) {
    const r = expected.hasRule as { action: string; protocol: string };
    const found = rules.find((rule: { action: string; protocol: string }) =>
      rule.action === r.action && (r.protocol === 'ANY' || rule.protocol === r.protocol),
    );
    if (!found) {
      return { passed: false, message: `Regla ${r.action} ${r.protocol} no encontrada` };
    }
  }
  return { passed: true, message: 'Firewall configurado correctamente' };
}

function validateConnectivity(ctx: ValidationCtx, expected: Record<string, unknown>): ValidationResult {
  const sourceIp = expected.sourceIp as string;
  const targetIp = expected.targetIp as string;
  const sourceDevice = ctx.devices.find((d) => d.interfaces.some((i) => i.ip === sourceIp));
  const targetDevice = ctx.devices.find((d) => d.interfaces.some((i) => i.ip === targetIp));

  if (!sourceDevice) return { passed: false, message: `No hay dispositivo con IP ${sourceIp}` };
  if (!targetDevice) return { passed: false, message: `No hay dispositivo con IP ${targetIp}` };

  const path = findPath(ctx, sourceDevice.id, targetDevice.id);
  const expectConnected = expected.connected !== false;

  if (expectConnected && path.length > 0) return { passed: true, message: `Conectividad verificada: ${sourceIp} → ${targetIp}` };
  if (!expectConnected && path.length === 0) return { passed: true, message: 'Sin conectividad como se esperaba' };

  return {
    passed: false,
    message: expectConnected
      ? `No hay ruta física entre ${sourceIp} y ${targetIp}`
      : `Se esperaba sin conectividad, pero hay ruta`,
  };
}

function validateDeviceCount(ctx: ValidationCtx, expected: Record<string, unknown>): ValidationResult {
  const type = expected.deviceType as string | undefined;
  const minCount = (expected.minCount as number) || 1;
  const devices = type ? ctx.devices.filter((d) => d.type === type) : ctx.devices;
  if (devices.length < minCount) {
    return { passed: false, message: `Se requieren al menos ${minCount} dispositivo(s) ${type ?? ''} (hay ${devices.length})` };
  }
  return { passed: true, message: `${devices.length} dispositivo(s) presentes` };
}

export function validateStep(ctx: ValidationCtx, step: LabStep): ValidationResult {
  const v = step.validation;
  switch (v.type) {
    case 'config':
      return validateConfig(ctx, v.expected);
    case 'ping':
      return validatePing(ctx, v.expected);
    case 'routing':
      return validateRouting(ctx, v.expected);
    case 'firewall':
      return validateFirewall(ctx, v.expected);
    case 'connectivity':
      return validateConnectivity(ctx, v.expected);
    case 'device_count':
      return validateDeviceCount(ctx, v.expected);
    case 'observation':
      return { passed: true, message: step.title };
    default:
      return { passed: false, message: `Tipo de validación '${v.type}' no soportado` };
  }
}

// Pre-lab topology checklist
export interface ChecklistItem {
  label: string;
  passed: boolean;
}

export function getTopologyChecklist(ctx: ValidationCtx, minDevices = 2): ChecklistItem[] {
  const nonSwitch = ctx.devices.filter((d) => d.type !== 'SWITCH');
  const withIp = nonSwitch.filter((d) => d.interfaces.some((i) => i.ip && i.isUp));
  return [
    { label: `Mínimo ${minDevices} dispositivos (${ctx.devices.length})`, passed: ctx.devices.length >= minDevices },
    { label: `Al menos 1 enlace (${ctx.links.length})`, passed: ctx.links.length >= 1 },
    { label: `Dispositivos con IP (${withIp.length}/${nonSwitch.length})`, passed: withIp.length >= Math.min(2, nonSwitch.length) },
  ];
}

export function validateAllSteps(ctx: ValidationCtx, steps: LabStep[]): { results: ValidationResult[]; allPassed: boolean; score: number } {
  const results = steps.map((step) => validateStep(ctx, step));
  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    allPassed: passed === steps.length,
    score: steps.length > 0 ? Math.round((passed / steps.length) * 100) : 0,
  };
}
