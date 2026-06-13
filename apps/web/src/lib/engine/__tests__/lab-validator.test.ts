import { describe, it, expect } from 'vitest';
import { validateStep, getTopologyChecklist, validateAllSteps } from '../lab-validator';
import { DeviceType } from '@si-learning/shared';
import type { NetworkDevice, NetworkLink, LabStep } from '@si-learning/shared';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeDevice(overrides: Partial<NetworkDevice> & { id: string; type: DeviceType }): NetworkDevice {
  return {
    label: overrides.type + '-' + overrides.id,
    x: 0,
    y: 0,
    interfaces: [],
    config: {},
    ...overrides,
  } as NetworkDevice;
}

function makeLink(src: string, srcIface: string, tgt: string, tgtIface: string): NetworkLink {
  return {
    id: `link-${src}-${tgt}`,
    sourceDeviceId: src,
    sourceInterfaceId: srcIface,
    targetDeviceId: tgt,
    targetInterfaceId: tgtIface,
  };
}

function twoPC() {
  const pc1 = makeDevice({
    id: 'pc1',
    type: DeviceType.PC,
    label: 'PC1',
    interfaces: [{ id: 'pc1-eth0', name: 'eth0', mac: 'AA:00:00:00:00:01', ip: '192.168.1.10', mask: '255.255.255.0', isUp: true }],
    config: { gateway: '192.168.1.1' },
  });
  const pc2 = makeDevice({
    id: 'pc2',
    type: DeviceType.PC,
    label: 'PC2',
    interfaces: [{ id: 'pc2-eth0', name: 'eth0', mac: 'AA:00:00:00:00:02', ip: '192.168.1.20', mask: '255.255.255.0', isUp: true }],
    config: { gateway: '192.168.1.1' },
  });
  return {
    devices: [pc1, pc2],
    links: [makeLink('pc1', 'pc1-eth0', 'pc2', 'pc2-eth0')],
  };
}

// ─── validateStep: config ────────────────────────────────────────────────────

describe('validateStep — config', () => {
  it('passes when IP matches expected', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Config IP', instructions: '',
      validation: { type: 'config', expected: { deviceId: 'pc1', interfaceId: 'pc1-eth0', ip: '192.168.1.10' } },
    };
    const result = validateStep(ctx, step);
    expect(result.passed).toBe(true);
  });

  it('fails when IP does not match', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Config IP', instructions: '',
      validation: { type: 'config', expected: { deviceId: 'pc1', interfaceId: 'pc1-eth0', ip: '10.0.0.1' } },
    };
    const result = validateStep(ctx, step);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('10.0.0.1');
  });

  it('fails when mask does not match', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Config Mask', instructions: '',
      validation: { type: 'config', expected: { deviceId: 'pc1', interfaceId: 'pc1-eth0', mask: '255.255.0.0' } },
    };
    const result = validateStep(ctx, step);
    expect(result.passed).toBe(false);
  });

  it('fails when device not found', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Config', instructions: '',
      validation: { type: 'config', expected: { deviceId: 'nonexistent', interfaceId: 'x' } },
    };
    const result = validateStep(ctx, step);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('no encontrado');
  });

  it('fails when interface not found', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Config', instructions: '',
      validation: { type: 'config', expected: { deviceId: 'pc1', interfaceId: 'bad-iface' } },
    };
    const result = validateStep(ctx, step);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('no encontrada');
  });
});

// ─── validateStep: ping ──────────────────────────────────────────────────────

describe('validateStep — ping', () => {
  it('passes when ping succeeds as expected', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Ping', instructions: '',
      validation: { type: 'ping', expected: { sourceDeviceId: 'pc1', destinationIp: '192.168.1.20', success: true } },
    };
    const result = validateStep(ctx, step);
    expect(result.passed).toBe(true);
  });

  it('fails when ping was expected to succeed but fails', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Ping', instructions: '',
      validation: { type: 'ping', expected: { sourceDeviceId: 'pc1', destinationIp: '10.0.0.99', success: true } },
    };
    const result = validateStep(ctx, step);
    expect(result.passed).toBe(false);
  });

  it('passes when ping fails as expected', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'No Ping', instructions: '',
      validation: { type: 'ping', expected: { sourceDeviceId: 'pc1', destinationIp: '10.0.0.99', success: false } },
    };
    const result = validateStep(ctx, step);
    expect(result.passed).toBe(true);
  });
});

// ─── validateStep: routing ───────────────────────────────────────────────────

describe('validateStep — routing', () => {
  it('passes when route exists', () => {
    const ctx = twoPC();
    ctx.devices[0].config.routingTable = [
      { destination: '10.0.0.0', mask: '255.255.255.0', nextHop: '192.168.1.1', interface: 'eth0', metric: 1 },
    ];
    const step: LabStep = {
      id: 's1', order: 1, title: 'Route', instructions: '',
      validation: { type: 'routing', expected: { deviceId: 'pc1', destination: '10.0.0.0', nextHop: '192.168.1.1' } },
    };
    const result = validateStep(ctx, step);
    expect(result.passed).toBe(true);
  });

  it('fails when route does not exist', () => {
    const ctx = twoPC();
    ctx.devices[0].config.routingTable = [];
    const step: LabStep = {
      id: 's1', order: 1, title: 'Route', instructions: '',
      validation: { type: 'routing', expected: { deviceId: 'pc1', destination: '10.0.0.0', nextHop: '192.168.1.1' } },
    };
    const result = validateStep(ctx, step);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('no encontrada');
  });
});

// ─── validateStep: firewall ──────────────────────────────────────────────────

describe('validateStep — firewall', () => {
  function fwCtx() {
    return {
      devices: [
        makeDevice({
          id: 'fw1',
          type: DeviceType.FIREWALL,
          label: 'FW1',
          interfaces: [{ id: 'fw-eth0', name: 'eth0', mac: 'CC:00:00:00:00:01', ip: '10.0.0.1', mask: '255.255.255.0', isUp: true }],
          config: {
            firewallRules: [
              { id: 'r1', action: 'DENY' as const, protocol: 'ICMP' as const, sourceIp: '*', destinationIp: '*', order: 1 },
              { id: 'r2', action: 'ALLOW' as const, protocol: 'TCP' as const, sourceIp: '*', destinationIp: '*', port: 80, order: 2 },
            ],
          },
        }),
      ],
      links: [] as NetworkLink[],
    };
  }

  it('passes with sufficient rules', () => {
    const ctx = fwCtx();
    const step: LabStep = {
      id: 's1', order: 1, title: 'FW', instructions: '',
      validation: { type: 'firewall', expected: { deviceId: 'fw1', minRules: 2 } },
    };
    expect(validateStep(ctx, step).passed).toBe(true);
  });

  it('fails with insufficient rules', () => {
    const ctx = fwCtx();
    const step: LabStep = {
      id: 's1', order: 1, title: 'FW', instructions: '',
      validation: { type: 'firewall', expected: { deviceId: 'fw1', minRules: 5 } },
    };
    expect(validateStep(ctx, step).passed).toBe(false);
  });

  it('passes when specific rule exists', () => {
    const ctx = fwCtx();
    const step: LabStep = {
      id: 's1', order: 1, title: 'FW', instructions: '',
      validation: { type: 'firewall', expected: { deviceId: 'fw1', hasRule: { action: 'DENY', protocol: 'ICMP' } } },
    };
    expect(validateStep(ctx, step).passed).toBe(true);
  });

  it('fails when specific rule does not exist', () => {
    const ctx = fwCtx();
    const step: LabStep = {
      id: 's1', order: 1, title: 'FW', instructions: '',
      validation: { type: 'firewall', expected: { deviceId: 'fw1', hasRule: { action: 'ALLOW', protocol: 'UDP' } } },
    };
    expect(validateStep(ctx, step).passed).toBe(false);
  });

  it('fails when device is not a FIREWALL', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'FW', instructions: '',
      validation: { type: 'firewall', expected: { deviceId: 'pc1' } },
    };
    expect(validateStep(ctx, step).passed).toBe(false);
    expect(validateStep(ctx, step).message).toContain('no es un Firewall');
  });
});

// ─── validateStep: connectivity ──────────────────────────────────────────────

describe('validateStep — connectivity', () => {
  it('passes when two devices are connected', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Connect', instructions: '',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.1.10', targetIp: '192.168.1.20', connected: true } },
    };
    expect(validateStep(ctx, step).passed).toBe(true);
  });

  it('fails when devices are not connected but expected to be', () => {
    const ctx = twoPC();
    ctx.links = []; // remove links
    const step: LabStep = {
      id: 's1', order: 1, title: 'Connect', instructions: '',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.1.10', targetIp: '192.168.1.20', connected: true } },
    };
    expect(validateStep(ctx, step).passed).toBe(false);
  });

  it('passes when expecting no connectivity and there is none', () => {
    const ctx = twoPC();
    ctx.links = [];
    const step: LabStep = {
      id: 's1', order: 1, title: 'No Connect', instructions: '',
      validation: { type: 'connectivity', expected: { sourceIp: '192.168.1.10', targetIp: '192.168.1.20', connected: false } },
    };
    expect(validateStep(ctx, step).passed).toBe(true);
  });
});

// ─── validateStep: device_count ──────────────────────────────────────────────

describe('validateStep — device_count', () => {
  it('passes with enough devices', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Count', instructions: '',
      validation: { type: 'device_count', expected: { minCount: 2 } },
    };
    expect(validateStep(ctx, step).passed).toBe(true);
  });

  it('fails with not enough devices', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Count', instructions: '',
      validation: { type: 'device_count', expected: { minCount: 5 } },
    };
    expect(validateStep(ctx, step).passed).toBe(false);
  });

  it('filters by device type', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Count', instructions: '',
      validation: { type: 'device_count', expected: { deviceType: 'PC', minCount: 2 } },
    };
    expect(validateStep(ctx, step).passed).toBe(true);

    const step2: LabStep = {
      id: 's2', order: 2, title: 'Count Router', instructions: '',
      validation: { type: 'device_count', expected: { deviceType: 'ROUTER', minCount: 1 } },
    };
    expect(validateStep(ctx, step2).passed).toBe(false);
  });
});

// ─── validateStep: observation ───────────────────────────────────────────────

describe('validateStep — observation', () => {
  it('always passes', () => {
    const ctx = twoPC();
    const step: LabStep = {
      id: 's1', order: 1, title: 'Observe', instructions: 'Look at the network',
      validation: { type: 'observation', expected: {} },
    };
    expect(validateStep(ctx, step).passed).toBe(true);
  });
});

// ─── getTopologyChecklist ────────────────────────────────────────────────────

describe('getTopologyChecklist', () => {
  it('returns all passing for a valid topology', () => {
    const ctx = twoPC();
    const checklist = getTopologyChecklist(ctx);
    expect(checklist.every((c) => c.passed)).toBe(true);
  });

  it('fails min devices check with empty topology', () => {
    const checklist = getTopologyChecklist({ devices: [], links: [] });
    expect(checklist[0].passed).toBe(false);
  });

  it('fails link check with no links', () => {
    const ctx = twoPC();
    ctx.links = [];
    const checklist = getTopologyChecklist(ctx);
    const linkCheck = checklist.find((c) => c.label.includes('enlace'));
    expect(linkCheck?.passed).toBe(false);
  });
});

// ─── validateAllSteps ────────────────────────────────────────────────────────

describe('validateAllSteps', () => {
  it('returns 100% score when all pass', () => {
    const ctx = twoPC();
    const steps: LabStep[] = [
      { id: 's1', order: 1, title: 'Observe', instructions: '', validation: { type: 'observation', expected: {} } },
      { id: 's2', order: 2, title: 'Count', instructions: '', validation: { type: 'device_count', expected: { minCount: 2 } } },
    ];
    const { allPassed, score } = validateAllSteps(ctx, steps);
    expect(allPassed).toBe(true);
    expect(score).toBe(100);
  });

  it('returns partial score when some fail', () => {
    const ctx = twoPC();
    const steps: LabStep[] = [
      { id: 's1', order: 1, title: 'Observe', instructions: '', validation: { type: 'observation', expected: {} } },
      { id: 's2', order: 2, title: 'Count', instructions: '', validation: { type: 'device_count', expected: { minCount: 10 } } },
    ];
    const { allPassed, score } = validateAllSteps(ctx, steps);
    expect(allPassed).toBe(false);
    expect(score).toBe(50);
  });

  it('returns 0 for empty steps', () => {
    const { score } = validateAllSteps({ devices: [], links: [] }, []);
    expect(score).toBe(0);
  });
});
