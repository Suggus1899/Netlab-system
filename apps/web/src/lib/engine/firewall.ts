import type { FirewallRule, NetworkDevice, PacketEvent, OSILayer } from '@si-learning/shared';

function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

function toNum(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

function matchIp(pattern: string, actual: string): boolean {
  if (pattern === '*' || pattern === 'any' || pattern === '0.0.0.0') return true;
  if (pattern.includes('/')) {
    const [net, bits] = pattern.split('/');
    const mask = ~((1 << (32 - parseInt(bits))) - 1) >>> 0;
    return (toNum(actual) & mask) === (toNum(net) & mask);
  }
  return pattern === actual;
}

export interface FirewallResult {
  allowed: boolean;
  matchedRule: FirewallRule | null;
  events: PacketEvent[];
}

export function evaluateFirewall(
  firewallDevice: NetworkDevice,
  srcIp: string,
  dstIp: string,
  protocol: string,
  port?: number,
): FirewallResult {
  const rules = (firewallDevice.config.firewallRules || []).sort((a, b) => a.order - b.order);
  const events: PacketEvent[] = [];

  // Log packet arrival
  events.push({
    id: uid(),
    timestamp: 0,
    fromDeviceId: firewallDevice.id,
    toDeviceId: firewallDevice.id,
    linkId: '',
    layer: 3 as OSILayer,
    protocol: 'Firewall',
    headers: {
      action: 'Evaluating',
      srcIp,
      dstIp,
      protocol,
      ...(port !== undefined ? { port: String(port) } : {}),
      totalRules: String(rules.length),
    },
    status: 'transit',
  });

  for (const rule of rules) {
    const protocolMatch = rule.protocol === 'ANY' || rule.protocol === protocol.toUpperCase();
    const srcMatch = matchIp(rule.sourceIp, srcIp);
    const dstMatch = matchIp(rule.destinationIp, dstIp);
    const portMatch = rule.port === undefined || rule.port === port;

    if (protocolMatch && srcMatch && dstMatch && portMatch) {
      const allowed = rule.action === 'ALLOW';
      events.push({
        id: uid(),
        timestamp: 1,
        fromDeviceId: firewallDevice.id,
        toDeviceId: firewallDevice.id,
        linkId: '',
        layer: 3 as OSILayer,
        protocol: 'Firewall',
        headers: {
          action: allowed ? 'ALLOW' : 'DENY',
          ruleId: rule.id,
          matchedProtocol: rule.protocol,
          matchedSrc: rule.sourceIp,
          matchedDst: rule.destinationIp,
        },
        status: allowed ? 'delivered' : 'dropped',
      });
      return { allowed, matchedRule: rule, events };
    }
  }

  // Default deny
  events.push({
    id: uid(),
    timestamp: 1,
    fromDeviceId: firewallDevice.id,
    toDeviceId: firewallDevice.id,
    linkId: '',
    layer: 3 as OSILayer,
    protocol: 'Firewall',
    headers: { action: 'DENY (implicit)', reason: 'No matching rule' },
    status: 'dropped',
  });

  return { allowed: false, matchedRule: null, events };
}

/**
 * Simple verdict-only evaluation for use by packet-engine.
 * Returns 'ALLOW' | 'DENY' without generating events.
 */
export function evaluateFirewallVerdict(
  firewallDevice: NetworkDevice,
  srcIp: string,
  dstIp: string,
  protocol: string,
  port?: number,
): 'ALLOW' | 'DENY' {
  const rules = (firewallDevice.config.firewallRules || []).sort((a, b) => a.order - b.order);
  if (rules.length === 0) return 'ALLOW';

  for (const rule of rules) {
    const protocolMatch = rule.protocol === 'ANY' || rule.protocol === protocol.toUpperCase();
    const srcMatch = matchIp(rule.sourceIp, srcIp);
    const dstMatch = matchIp(rule.destinationIp, dstIp);
    const portMatch = rule.port === undefined || rule.port === port;

    if (protocolMatch && srcMatch && dstMatch && portMatch) {
      return rule.action;
    }
  }
  return 'ALLOW';
}

// ─── NAT ───
export interface NATResult {
  translatedSrcIp: string;
  events: PacketEvent[];
}

export function applyNAT(
  routerDevice: NetworkDevice,
  originalSrcIp: string,
  dstIp: string,
): NATResult {
  const publicIface = routerDevice.interfaces.find((i) => i.ip && i.name.includes('eth0'));
  const translatedIp = publicIface?.ip || routerDevice.interfaces[0]?.ip || originalSrcIp;

  const events: PacketEvent[] = [
    {
      id: uid(),
      timestamp: 0,
      fromDeviceId: routerDevice.id,
      toDeviceId: routerDevice.id,
      linkId: '',
      layer: 3 as OSILayer,
      protocol: 'NAT',
      headers: {
        action: 'SNAT',
        originalSrc: originalSrcIp,
        translatedSrc: translatedIp,
        destination: dstIp,
        type: 'Overload (PAT)',
      },
      status: 'delivered',
    },
  ];

  return { translatedSrcIp: translatedIp, events };
}
