import { describe, it, expect } from 'vitest';
import {
  sameSubnet,
  findPath,
  simulatePing,
  simulateARP,
  simulateDNS,
  simulateDHCP,
  simulateHTTP,
  type SimContext,
} from '../packet-engine';
import { DeviceType } from '@si-learning/shared';
import type { NetworkDevice, NetworkLink } from '@si-learning/shared';

// ─── Test Fixtures ───────────────────────────────────────────────────────────

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

/** Two PCs directly connected */
function twoPC(): SimContext {
  const pc1: NetworkDevice = makeDevice({
    id: 'pc1',
    type: DeviceType.PC,
    label: 'PC1',
    interfaces: [{ id: 'pc1-eth0', name: 'eth0', mac: 'AA:AA:AA:00:00:01', ip: '192.168.1.10', mask: '255.255.255.0', isUp: true }],
    config: { gateway: '192.168.1.1' },
  });
  const pc2: NetworkDevice = makeDevice({
    id: 'pc2',
    type: DeviceType.PC,
    label: 'PC2',
    interfaces: [{ id: 'pc2-eth0', name: 'eth0', mac: 'AA:AA:AA:00:00:02', ip: '192.168.1.20', mask: '255.255.255.0', isUp: true }],
    config: { gateway: '192.168.1.1' },
  });
  return {
    devices: [pc1, pc2],
    links: [makeLink('pc1', 'pc1-eth0', 'pc2', 'pc2-eth0')],
  };
}

/** PC → Router → PC (two subnets) */
function routerTopology(): SimContext {
  const router: NetworkDevice = makeDevice({
    id: 'r1',
    type: DeviceType.ROUTER,
    label: 'Router1',
    interfaces: [
      { id: 'r1-eth0', name: 'eth0', mac: 'BB:BB:BB:00:00:01', ip: '192.168.1.1', mask: '255.255.255.0', isUp: true },
      { id: 'r1-eth1', name: 'eth1', mac: 'BB:BB:BB:00:00:02', ip: '10.0.0.1', mask: '255.255.255.0', isUp: true },
    ],
    config: { routingTable: [] },
  });
  const pc1: NetworkDevice = makeDevice({
    id: 'pc1',
    type: DeviceType.PC,
    label: 'PC1',
    interfaces: [{ id: 'pc1-eth0', name: 'eth0', mac: 'AA:AA:AA:00:00:01', ip: '192.168.1.10', mask: '255.255.255.0', isUp: true }],
    config: { gateway: '192.168.1.1' },
  });
  const pc2: NetworkDevice = makeDevice({
    id: 'pc2',
    type: DeviceType.PC,
    label: 'PC2',
    interfaces: [{ id: 'pc2-eth0', name: 'eth0', mac: 'AA:AA:AA:00:00:02', ip: '10.0.0.10', mask: '255.255.255.0', isUp: true }],
    config: { gateway: '10.0.0.1' },
  });
  return {
    devices: [pc1, router, pc2],
    links: [
      makeLink('pc1', 'pc1-eth0', 'r1', 'r1-eth0'),
      makeLink('r1', 'r1-eth1', 'pc2', 'pc2-eth0'),
    ],
  };
}

/** PC → Firewall → Server (with DENY ICMP rule) */
function firewallTopology(): SimContext {
  const pc: NetworkDevice = makeDevice({
    id: 'pc1',
    type: DeviceType.PC,
    label: 'PC-LAN',
    interfaces: [{ id: 'pc1-eth0', name: 'eth0', mac: 'AA:00:00:00:00:01', ip: '192.168.1.10', mask: '255.255.255.0', isUp: true }],
    config: { gateway: '192.168.1.1' },
  });
  const fw: NetworkDevice = makeDevice({
    id: 'fw1',
    type: DeviceType.FIREWALL,
    label: 'Firewall1',
    interfaces: [
      { id: 'fw1-eth0', name: 'eth0', mac: 'CC:00:00:00:00:01', ip: '192.168.1.1', mask: '255.255.255.0', isUp: true },
      { id: 'fw1-eth1', name: 'eth1', mac: 'CC:00:00:00:00:02', ip: '10.0.0.1', mask: '255.255.255.0', isUp: true },
    ],
    config: {
      firewallRules: [
        { id: 'rule1', action: 'DENY', protocol: 'ICMP', sourceIp: '*', destinationIp: '*', order: 1 },
        { id: 'rule2', action: 'ALLOW', protocol: 'TCP', sourceIp: '*', destinationIp: '*', port: 80, order: 2 },
      ],
    },
  });
  const srv: NetworkDevice = makeDevice({
    id: 'srv1',
    type: DeviceType.SERVER,
    label: 'WebServer',
    interfaces: [{ id: 'srv1-eth0', name: 'eth0', mac: 'DD:00:00:00:00:01', ip: '10.0.0.10', mask: '255.255.255.0', isUp: true }],
    config: {},
  });
  return {
    devices: [pc, fw, srv],
    links: [
      makeLink('pc1', 'pc1-eth0', 'fw1', 'fw1-eth0'),
      makeLink('fw1', 'fw1-eth1', 'srv1', 'srv1-eth0'),
    ],
  };
}

/** PC → Switch → Server (for DHCP / DNS) */
function dhcpDnsTopology(): SimContext {
  const sw: NetworkDevice = makeDevice({
    id: 'sw1',
    type: DeviceType.SWITCH,
    label: 'Switch1',
    interfaces: [
      { id: 'sw1-fa0', name: 'fa0/0', mac: 'EE:00:00:00:00:01', isUp: true },
      { id: 'sw1-fa1', name: 'fa0/1', mac: 'EE:00:00:00:00:02', isUp: true },
    ],
    config: {},
  });
  const srv: NetworkDevice = makeDevice({
    id: 'srv1',
    type: DeviceType.SERVER,
    label: 'DHCP-DNS',
    interfaces: [{ id: 'srv1-eth0', name: 'eth0', mac: 'DD:00:00:00:00:01', ip: '192.168.1.1', mask: '255.255.255.0', isUp: true }],
    config: { dhcpEnabled: true, dnsServer: '192.168.1.1' },
  });
  const pc: NetworkDevice = makeDevice({
    id: 'pc1',
    type: DeviceType.PC,
    label: 'PC1',
    interfaces: [{ id: 'pc1-eth0', name: 'eth0', mac: 'AA:00:00:00:00:01', ip: '192.168.1.10', mask: '255.255.255.0', isUp: true }],
    config: { gateway: '192.168.1.1', dnsServer: '192.168.1.1' },
  });
  return {
    devices: [sw, srv, pc],
    links: [
      makeLink('sw1', 'sw1-fa0', 'srv1', 'srv1-eth0'),
      makeLink('sw1', 'sw1-fa1', 'pc1', 'pc1-eth0'),
    ],
  };
}

// ─── Utility Tests ───────────────────────────────────────────────────────────

describe('sameSubnet', () => {
  it('returns true for IPs in the same /24', () => {
    expect(sameSubnet('192.168.1.10', '255.255.255.0', '192.168.1.20')).toBe(true);
  });

  it('returns false for IPs in different /24', () => {
    expect(sameSubnet('192.168.1.10', '255.255.255.0', '10.0.0.1')).toBe(false);
  });

  it('works with /16 mask', () => {
    expect(sameSubnet('172.16.0.1', '255.255.0.0', '172.16.255.254')).toBe(true);
    expect(sameSubnet('172.16.0.1', '255.255.0.0', '172.17.0.1')).toBe(false);
  });
});

// ─── findPath Tests ──────────────────────────────────────────────────────────

describe('findPath', () => {
  it('finds direct path between two connected PCs', () => {
    const ctx = twoPC();
    const path = findPath(ctx, 'pc1', 'pc2');
    expect(path).toEqual(['pc1', 'pc2']);
  });

  it('finds path through a router', () => {
    const ctx = routerTopology();
    const path = findPath(ctx, 'pc1', 'pc2');
    expect(path).toEqual(['pc1', 'r1', 'pc2']);
  });

  it('returns empty array when no path exists', () => {
    const ctx = twoPC();
    const isolated = makeDevice({
      id: 'pc3',
      type: DeviceType.PC,
      label: 'PC3',
      interfaces: [{ id: 'pc3-eth0', name: 'eth0', mac: 'FF:00:00:00:00:01', ip: '10.0.0.1', mask: '255.255.255.0', isUp: true }],
      config: {},
    });
    ctx.devices.push(isolated);
    expect(findPath(ctx, 'pc1', 'pc3')).toEqual([]);
  });

  it('returns path to self', () => {
    const ctx = twoPC();
    expect(findPath(ctx, 'pc1', 'pc1')).toEqual(['pc1']);
  });
});

// ─── ICMP Ping Tests ─────────────────────────────────────────────────────────

describe('simulatePing', () => {
  it('succeeds between two directly connected PCs', () => {
    const ctx = twoPC();
    const result = simulatePing(ctx, 'pc1', '192.168.1.20');
    expect(result.success).toBe(true);
    expect(result.events.length).toBeGreaterThan(0);

    // Should have both request and reply events
    const icmpEvents = result.events.filter((e) => e.protocol === 'ICMP');
    expect(icmpEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('succeeds through a router', () => {
    const ctx = routerTopology();
    const result = simulatePing(ctx, 'pc1', '10.0.0.10');
    expect(result.success).toBe(true);
  });

  it('fails when source device not found', () => {
    const ctx = twoPC();
    const result = simulatePing(ctx, 'nonexistent', '192.168.1.20');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('fails when target IP not found', () => {
    const ctx = twoPC();
    const result = simulatePing(ctx, 'pc1', '10.0.0.99');
    expect(result.success).toBe(false);
  });

  it('fails when source has no IP', () => {
    const ctx = twoPC();
    ctx.devices[0].interfaces[0].ip = undefined;
    const result = simulatePing(ctx, 'pc1', '192.168.1.20');
    expect(result.success).toBe(false);
    expect(result.error).toContain('sin IP');
  });

  it('fails when target interface is down', () => {
    const ctx = twoPC();
    ctx.devices[1].interfaces[0].isUp = false;
    const result = simulatePing(ctx, 'pc1', '192.168.1.20');
    expect(result.success).toBe(false);
    expect(result.error).toContain('apagada');
  });

  it('is blocked by firewall DENY ICMP rule', () => {
    const ctx = firewallTopology();
    const result = simulatePing(ctx, 'pc1', '10.0.0.10');
    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);
    expect(result.error).toContain('firewall');
  });

  it('generates events with correct OSI layers', () => {
    const ctx = twoPC();
    const result = simulatePing(ctx, 'pc1', '192.168.1.20');
    const layers = new Set(result.events.map((e) => e.layer));
    // Should include L1, L2, L3, L7
    expect(layers.has(1)).toBe(true);
    expect(layers.has(2)).toBe(true);
    expect(layers.has(3)).toBe(true);
    expect(layers.has(7)).toBe(true);
  });

  it('last event has status delivered', () => {
    const ctx = twoPC();
    const result = simulatePing(ctx, 'pc1', '192.168.1.20');
    const lastEvent = result.events[result.events.length - 1];
    expect(lastEvent.status).toBe('delivered');
  });
});

// ─── ARP Tests ───────────────────────────────────────────────────────────────

describe('simulateARP', () => {
  it('resolves MAC for a directly connected device', () => {
    const ctx = twoPC();
    const result = simulateARP(ctx, 'pc1', '192.168.1.20');
    expect(result.success).toBe(true);

    // Should have ARP protocol events
    const arpEvents = result.events.filter((e) => e.protocol === 'ARP');
    expect(arpEvents.length).toBeGreaterThanOrEqual(2);

    // Request broadcast
    const request = arpEvents.find((e) => e.headers.op === 'Request');
    expect(request).toBeDefined();
    expect(request!.headers.targetMAC).toBe('FF:FF:FF:FF:FF:FF');

    // Reply with resolved MAC
    const delivered = arpEvents.find((e) => e.status === 'delivered' && e.headers.result);
    expect(delivered).toBeDefined();
    expect(delivered!.headers.result).toContain('AA:AA:AA:00:00:02');
  });

  it('fails for nonexistent source', () => {
    const ctx = twoPC();
    const result = simulateARP(ctx, 'bad', '192.168.1.20');
    expect(result.success).toBe(false);
  });

  it('fails for nonexistent target IP', () => {
    const ctx = twoPC();
    const result = simulateARP(ctx, 'pc1', '10.0.0.99');
    expect(result.success).toBe(false);
  });
});

// ─── DNS Tests ───────────────────────────────────────────────────────────────

describe('simulateDNS', () => {
  it('resolves a domain name successfully', () => {
    const ctx = dhcpDnsTopology();
    const result = simulateDNS(ctx, 'pc1', 'example.com', '192.168.1.1');
    expect(result.success).toBe(true);
    expect(result.resolvedIp).toBeDefined();

    // Should have DNS events with Query and Response
    const dnsEvents = result.events.filter((e) => e.protocol === 'DNS');
    expect(dnsEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('fails when DNS server not found', () => {
    const ctx = dhcpDnsTopology();
    const result = simulateDNS(ctx, 'pc1', 'example.com', '10.10.10.10');
    expect(result.success).toBe(false);
    expect(result.error).toContain('no encontrado');
  });

  it('fails for nonexistent source', () => {
    const ctx = dhcpDnsTopology();
    const result = simulateDNS(ctx, 'bad', 'example.com', '192.168.1.1');
    expect(result.success).toBe(false);
  });
});

// ─── DHCP Tests ──────────────────────────────────────────────────────────────

describe('simulateDHCP', () => {
  it('assigns an IP to a client', () => {
    const ctx = dhcpDnsTopology();
    const result = simulateDHCP(ctx, 'pc1');
    expect(result.success).toBe(true);
    expect(result.assignedIp).toBeDefined();
    expect(result.assignedIp).toMatch(/^192\.168\.1\.\d+$/);

    // Should have all 4 DHCP message types
    const dhcpEvents = result.events.filter((e) => e.protocol === 'DHCP');
    const types = dhcpEvents.map((e) => e.headers.type).filter(Boolean);
    expect(types).toContain('DISCOVER');
    expect(types).toContain('OFFER');
    expect(types).toContain('REQUEST');
    expect(types).toContain('ACK');
  });

  it('fails when no DHCP server exists', () => {
    const ctx: SimContext = {
      devices: [
        makeDevice({
          id: 'pc1',
          type: DeviceType.PC,
          label: 'PC1',
          interfaces: [{ id: 'pc1-eth0', name: 'eth0', mac: 'AA:00:00:00:00:01', isUp: true }],
          config: {},
        }),
      ],
      links: [],
    };
    const result = simulateDHCP(ctx, 'pc1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('DHCP');
  });

  it('fails for nonexistent client', () => {
    const ctx = dhcpDnsTopology();
    const result = simulateDHCP(ctx, 'bad');
    expect(result.success).toBe(false);
  });
});

// ─── HTTP Tests ──────────────────────────────────────────────────────────────

describe('simulateHTTP', () => {
  it('completes a GET request successfully', () => {
    const ctx = dhcpDnsTopology();
    const result = simulateHTTP(ctx, 'pc1', '192.168.1.1');
    expect(result.success).toBe(true);

    // Should include TCP handshake events
    const tcpEvents = result.events.filter((e) => e.protocol === 'TCP');
    expect(tcpEvents.length).toBeGreaterThan(0);
    const flags = tcpEvents.map((e) => e.headers.flags).filter(Boolean);
    expect(flags).toContain('SYN');
    expect(flags).toContain('SYN-ACK');
    expect(flags).toContain('ACK');

    // Should include HTTP events
    const httpEvents = result.events.filter((e) => e.protocol === 'HTTP');
    expect(httpEvents.length).toBeGreaterThanOrEqual(2);
  });

  it('includes correct method and path', () => {
    const ctx = dhcpDnsTopology();
    const result = simulateHTTP(ctx, 'pc1', '192.168.1.1', 'POST', '/api/data');
    expect(result.success).toBe(true);

    const httpReq = result.events.find(
      (e) => e.protocol === 'HTTP' && e.headers.method === 'POST',
    );
    expect(httpReq).toBeDefined();
    expect(httpReq!.headers.url).toBe('/api/data');
  });

  it('fails when server not found', () => {
    const ctx = dhcpDnsTopology();
    const result = simulateHTTP(ctx, 'pc1', '10.10.10.10');
    expect(result.success).toBe(false);
  });

  it('fails when client has no IP', () => {
    const ctx = dhcpDnsTopology();
    ctx.devices.find((d) => d.id === 'pc1')!.interfaces[0].ip = undefined;
    const result = simulateHTTP(ctx, 'pc1', '192.168.1.1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('sin IP');
  });
});

// ─── Firewall Integration Tests ──────────────────────────────────────────────

describe('firewall integration', () => {
  it('DENY ICMP blocks ping but events show dropped status', () => {
    const ctx = firewallTopology();
    const result = simulatePing(ctx, 'pc1', '10.0.0.10');
    expect(result.success).toBe(false);
    expect(result.blocked).toBe(true);

    const fwEvent = result.events.find((e) => e.protocol === 'FIREWALL');
    expect(fwEvent).toBeDefined();
    expect(fwEvent!.status).toBe('dropped');
    expect(fwEvent!.headers.verdict).toBe('DENY');
  });

  it('ALLOW TCP lets HTTP through firewall', () => {
    // Modify firewall to ALLOW ALL (remove DENY ICMP, keep ALLOW TCP)
    const ctx = firewallTopology();
    ctx.devices.find((d) => d.id === 'fw1')!.config.firewallRules = [
      { id: 'rule1', action: 'ALLOW', protocol: 'TCP', sourceIp: '*', destinationIp: '*', port: 80, order: 1 },
    ];
    const result = simulateHTTP(ctx, 'pc1', '10.0.0.10');
    expect(result.success).toBe(true);
  });

  it('no rules means ALLOW by default', () => {
    const ctx = firewallTopology();
    ctx.devices.find((d) => d.id === 'fw1')!.config.firewallRules = [];
    const result = simulatePing(ctx, 'pc1', '10.0.0.10');
    expect(result.success).toBe(true);
  });
});
