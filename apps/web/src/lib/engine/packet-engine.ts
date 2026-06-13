import type { NetworkDevice, NetworkLink, PacketEvent, OSILayer, RoutingEntry } from '@si-learning/shared';
import { evaluateFirewallVerdict } from './firewall';

// ─── Shared utilities ─────────────────────────────────────────────────────────

export function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

export interface SimContext {
  devices: NetworkDevice[];
  links: NetworkLink[];
}

function toNum(ip: string): number {
  return ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>> 0;
}

export function sameSubnet(ip1: string, mask: string, ip2: string): boolean {
  const m = toNum(mask);
  return (toNum(ip1) & m) === (toNum(ip2) & m);
}

function findLink(ctx: SimContext, a: string, b: string): NetworkLink | undefined {
  return ctx.links.find(
    (l) => (l.sourceDeviceId === a && l.targetDeviceId === b) ||
           (l.sourceDeviceId === b && l.targetDeviceId === a),
  );
}

// ─── Routing: BFS + static routing table ─────────────────────────────────────

/**
 * Find path from sourceId to targetId.
 * For ROUTER devices that have a routing table, static routes are used to
 * determine which next-hop to follow instead of pure physical topology BFS.
 */
export function findPath(ctx: SimContext, sourceId: string, targetId: string): string[] {
  const visited = new Set<string>();
  const queue: string[][] = [[sourceId]];
  while (queue.length > 0) {
    const path = queue.shift()!;
    const cur = path[path.length - 1];
    if (cur === targetId) return path;
    if (visited.has(cur)) continue;
    visited.add(cur);

    const curDevice = ctx.devices.find((d) => d.id === cur);
    const routes: RoutingEntry[] = curDevice?.config?.routingTable || [];
    const targetDevice = ctx.devices.find((d) => d.id === targetId);
    const targetIp = targetDevice?.interfaces.find((i) => i.ip)?.ip || '';

    // Check if a static route applies for the target IP
    if (routes.length > 0 && targetIp) {
      const matchedRoute = routes
        .filter((r) => r.destination && r.mask && r.nextHop)
        .sort((a, b) => {
          // longest prefix match
          const aBits = toNum(a.mask).toString(2).split('0')[0].length;
          const bBits = toNum(b.mask).toString(2).split('0')[0].length;
          return bBits - aBits;
        })
        .find((r) => sameSubnet(targetIp, r.mask, r.destination));

      if (matchedRoute) {
        // Find the device that has the next-hop IP
        const nextHopDevice = ctx.devices.find((d) =>
          d.interfaces.some((i) => i.ip === matchedRoute.nextHop),
        );
        if (nextHopDevice && !visited.has(nextHopDevice.id)) {
          const link = findLink(ctx, cur, nextHopDevice.id);
          if (link) {
            queue.push([...path, nextHopDevice.id]);
            continue;
          }
        }
      }
    }

    // Default: explore physical neighbors
    for (const l of ctx.links) {
      const n = l.sourceDeviceId === cur ? l.targetDeviceId
              : l.targetDeviceId === cur ? l.sourceDeviceId : null;
      if (n && !visited.has(n)) queue.push([...path, n]);
    }
  }
  return [];
}

// ─── Hop event builder ────────────────────────────────────────────────────────

function hopEvents(
  ctx: SimContext,
  path: string[],
  srcIp: string,
  dstIp: string,
  appProtocol: string,
  appHeaders: Record<string, string>,
  ts: number,
  checkFirewall = true,
): { events: PacketEvent[]; ts: number; blocked: boolean; blockedBy?: string } {
  const events: PacketEvent[] = [];
  let blocked = false;
  let blockedBy: string | undefined;

  for (let i = 0; i < path.length - 1; i++) {
    const link = findLink(ctx, path[i], path[i + 1]);
    if (!link) continue;
    const fd = ctx.devices.find((d) => d.id === path[i])!;
    const td = ctx.devices.find((d) => d.id === path[i + 1])!;

    // Firewall check: if the NEXT device is a FIREWALL, evaluate before sending
    if (checkFirewall && td.type === 'FIREWALL') {
      const verdict = evaluateFirewallVerdict(td, srcIp, dstIp, appProtocol);
      events.push({
        id: uid(), timestamp: ts++,
        fromDeviceId: path[i], toDeviceId: td.id, linkId: link.id,
        layer: 3 as OSILayer, protocol: 'FIREWALL',
        headers: { device: td.label, src: srcIp, dst: dstIp, protocol: appProtocol, verdict },
        status: verdict === 'DENY' ? 'dropped' : 'transit',
      });
      if (verdict === 'DENY') {
        blocked = true;
        blockedBy = td.label;
        break;
      }
    }

    // App layer on first hop
    if (i === 0) {
      events.push({
        id: uid(), timestamp: ts++,
        fromDeviceId: path[i], toDeviceId: path[i], linkId: link.id,
        layer: 7 as OSILayer, protocol: appProtocol, headers: appHeaders, status: 'transit',
      });
    }

    // L3
    events.push({
      id: uid(), timestamp: ts++,
      fromDeviceId: path[i], toDeviceId: path[i + 1], linkId: link.id,
      layer: 3 as OSILayer, protocol: 'IP',
      headers: { src: srcIp, dst: dstIp, ttl: String(64 - i), protocol: appProtocol },
      status: 'transit',
    });

    // L2
    events.push({
      id: uid(), timestamp: ts++,
      fromDeviceId: path[i], toDeviceId: path[i + 1], linkId: link.id,
      layer: 2 as OSILayer, protocol: 'Ethernet',
      headers: { srcMAC: fd.interfaces[0]?.mac || '??', dstMAC: td.interfaces[0]?.mac || '??', type: '0x0800' },
      status: 'transit',
    });

    // L1
    events.push({
      id: uid(), timestamp: ts++,
      fromDeviceId: path[i], toDeviceId: path[i + 1], linkId: link.id,
      layer: 1 as OSILayer, protocol: 'Bits',
      headers: { medium: 'Ethernet', encoding: '8b/10b' },
      status: 'transit',
    });
  }

  return { events, ts, blocked, blockedBy };
}

// ─── Public simulation result type ───────────────────────────────────────────

export interface SimResult {
  success: boolean;
  events: PacketEvent[];
  error?: string;
  blocked?: boolean;
  resolvedIp?: string;
  assignedIp?: string;
}

// ─── ICMP Ping ────────────────────────────────────────────────────────────────

export function simulatePing(ctx: SimContext, sourceDeviceId: string, targetIp: string): SimResult {
  const source = ctx.devices.find((d) => d.id === sourceDeviceId);
  if (!source) return { success: false, events: [], error: 'Dispositivo origen no encontrado' };

  const sourceIface = source.interfaces.find((i) => i.ip && i.isUp);
  if (!sourceIface?.ip || !sourceIface.mask)
    return { success: false, events: [], error: `${source.label}: sin IP configurada` };

  const target = ctx.devices.find((d) => d.interfaces.some((i) => i.ip === targetIp));
  if (!target) return { success: false, events: [], error: `Sin dispositivo con IP ${targetIp}` };

  if (!target.interfaces.find((i) => i.ip === targetIp)?.isUp)
    return { success: false, events: [], error: 'Interfaz destino apagada' };

  const path = findPath(ctx, sourceDeviceId, target.id);
  if (!path.length) return { success: false, events: [], error: 'Sin ruta al destino' };

  let ts = 0;
  const fwd = hopEvents(ctx, path, sourceIface.ip, targetIp, 'ICMP',
    { type: 'Echo Request', code: '0', id: uid().slice(0, 4), seq: '1' }, ts);
  const events: PacketEvent[] = [...fwd.events];
  ts = fwd.ts;

  if (fwd.blocked) {
    return { success: false, events, error: `Bloqueado por firewall: ${fwd.blockedBy}`, blocked: true };
  }

  events.push({
    id: uid(), timestamp: ts++,
    fromDeviceId: path[path.length - 1], toDeviceId: path[path.length - 1], linkId: '',
    layer: 7 as OSILayer, protocol: 'ICMP',
    headers: { type: 'Echo Request received', src: sourceIface.ip, dst: targetIp },
    status: 'delivered',
  });

  const rev = [...path].reverse();
  const bwd = hopEvents(ctx, rev, targetIp, sourceIface.ip, 'ICMP',
    { type: 'Echo Reply', code: '0', id: uid().slice(0, 4), seq: '1' }, ts);
  events.push(...bwd.events);
  ts = bwd.ts;

  if (bwd.blocked) {
    return { success: false, events, error: `Reply bloqueado por firewall: ${bwd.blockedBy}`, blocked: true };
  }

  events.push({
    id: uid(), timestamp: ts++,
    fromDeviceId: sourceDeviceId, toDeviceId: sourceDeviceId, linkId: '',
    layer: 7 as OSILayer, protocol: 'ICMP',
    headers: { type: 'Echo Reply', src: targetIp, dst: sourceIface.ip, rtt: `${ts * 2}ms` },
    status: 'delivered',
  });

  return { success: true, events };
}

// ─── ARP ──────────────────────────────────────────────────────────────────────

export function simulateARP(ctx: SimContext, sourceId: string, targetIp: string): SimResult {
  const src = ctx.devices.find((d) => d.id === sourceId);
  if (!src) return { success: false, events: [], error: 'Origen no encontrado' };
  const srcIface = src.interfaces.find((i) => i.ip && i.isUp);
  if (!srcIface?.ip) return { success: false, events: [], error: `${src.label}: sin IP` };

  const target = ctx.devices.find((d) => d.interfaces.some((i) => i.ip === targetIp));
  if (!target) return { success: false, events: [], error: `IP ${targetIp} no encontrada` };

  const path = findPath(ctx, sourceId, target.id);
  if (!path.length) return { success: false, events: [], error: 'Sin ruta' };

  const events: PacketEvent[] = [];
  let ts = 0;
  const tIface = target.interfaces.find((i) => i.ip === targetIp);

  // ARP Request (broadcast)
  for (let i = 0; i < path.length - 1; i++) {
    const link = findLink(ctx, path[i], path[i + 1]);
    if (!link) continue;
    events.push({
      id: uid(), timestamp: ts++,
      fromDeviceId: path[i], toDeviceId: path[i + 1], linkId: link.id,
      layer: 2 as OSILayer, protocol: 'ARP',
      headers: { op: 'Request', senderIP: srcIface.ip!, senderMAC: srcIface.mac, targetIP: targetIp, targetMAC: 'FF:FF:FF:FF:FF:FF' },
      status: 'transit',
    });
  }

  events.push({
    id: uid(), timestamp: ts++,
    fromDeviceId: target.id, toDeviceId: target.id, linkId: '',
    layer: 2 as OSILayer, protocol: 'ARP',
    headers: { op: 'Request received', resolved: tIface?.mac || '??' },
    status: 'delivered',
  });

  // ARP Reply (unicast back)
  const rev = [...path].reverse();
  for (let i = 0; i < rev.length - 1; i++) {
    const link = findLink(ctx, rev[i], rev[i + 1]);
    if (!link) continue;
    events.push({
      id: uid(), timestamp: ts++,
      fromDeviceId: rev[i], toDeviceId: rev[i + 1], linkId: link.id,
      layer: 2 as OSILayer, protocol: 'ARP',
      headers: { op: 'Reply', senderIP: targetIp, senderMAC: tIface?.mac || '??', targetIP: srcIface.ip!, targetMAC: srcIface.mac },
      status: 'transit',
    });
  }

  events.push({
    id: uid(), timestamp: ts++,
    fromDeviceId: sourceId, toDeviceId: sourceId, linkId: '',
    layer: 2 as OSILayer, protocol: 'ARP',
    headers: { result: `${targetIp} is at ${tIface?.mac}`, cached: 'true' },
    status: 'delivered',
  });

  return { success: true, events };
}

// ─── DNS ──────────────────────────────────────────────────────────────────────

export function simulateDNS(ctx: SimContext, sourceId: string, domain: string, dnsServerIp: string): SimResult {
  const src = ctx.devices.find((d) => d.id === sourceId);
  if (!src) return { success: false, events: [], error: 'Origen no encontrado' };
  const srcIface = src.interfaces.find((i) => i.ip && i.isUp);
  if (!srcIface?.ip) return { success: false, events: [], error: `${src.label}: sin IP` };

  const dnsServer = ctx.devices.find((d) => d.interfaces.some((i) => i.ip === dnsServerIp));
  if (!dnsServer) return { success: false, events: [], error: `DNS Server ${dnsServerIp} no encontrado` };

  const path = findPath(ctx, sourceId, dnsServer.id);
  if (!path.length) return { success: false, events: [], error: 'Sin ruta al DNS' };

  const serverDevice = ctx.devices.find((d) => d.type === 'SERVER' && d.id !== dnsServer.id);
  const resolvedIp = serverDevice?.interfaces.find((i) => i.ip)?.ip || '93.184.216.34';

  let ts = 0;
  const events: PacketEvent[] = [];
  const queryId = String(Math.floor(Math.random() * 65535));

  const q = hopEvents(ctx, path, srcIface.ip!, dnsServerIp, 'DNS',
    { type: 'Query', question: domain, qtype: 'A', id: queryId }, ts);
  events.push(...q.events); ts = q.ts;
  if (q.blocked) return { success: false, events, error: `Bloqueado: ${q.blockedBy}`, blocked: true };

  events.push({
    id: uid(), timestamp: ts++,
    fromDeviceId: dnsServer.id, toDeviceId: dnsServer.id, linkId: '',
    layer: 7 as OSILayer, protocol: 'DNS',
    headers: { action: 'Lookup', domain, result: resolvedIp, ttl: '300' },
    status: 'delivered',
  });

  const rev = [...path].reverse();
  const r = hopEvents(ctx, rev, dnsServerIp, srcIface.ip!, 'DNS',
    { type: 'Response', id: queryId, answer: `${domain} → ${resolvedIp}`, ttl: '300' }, ts);
  events.push(...r.events); ts = r.ts;

  events.push({
    id: uid(), timestamp: ts++,
    fromDeviceId: sourceId, toDeviceId: sourceId, linkId: '',
    layer: 7 as OSILayer, protocol: 'DNS',
    headers: { resolved: `${domain} = ${resolvedIp}`, cached: 'false' },
    status: 'delivered',
  });

  return { success: true, events, resolvedIp };
}

// ─── DHCP ─────────────────────────────────────────────────────────────────────

export function simulateDHCP(ctx: SimContext, clientId: string): SimResult {
  const client = ctx.devices.find((d) => d.id === clientId);
  if (!client) return { success: false, events: [], error: 'Cliente no encontrado' };

  const dhcpServer = ctx.devices.find((d) =>
    (d.type === 'SERVER' || d.type === 'ROUTER') && d.interfaces.some((i) => i.ip),
  );
  if (!dhcpServer) return { success: false, events: [], error: 'No hay servidor DHCP en la red' };

  const serverIface = dhcpServer.interfaces.find((i) => i.ip)!;
  const path = findPath(ctx, clientId, dhcpServer.id);
  if (!path.length) return { success: false, events: [], error: 'Sin ruta al servidor DHCP' };

  const parts = serverIface.ip!.split('.').map(Number);
  const assignedIp = `${parts[0]}.${parts[1]}.${parts[2]}.${100 + Math.floor(Math.random() * 50)}`;
  const clientMac = client.interfaces[0]?.mac || '??';
  const rev = [...path].reverse();
  const events: PacketEvent[] = [];
  let ts = 0;

  // DISCOVER
  for (let i = 0; i < path.length - 1; i++) {
    const link = findLink(ctx, path[i], path[i + 1]); if (!link) continue;
    events.push({ id: uid(), timestamp: ts++, fromDeviceId: path[i], toDeviceId: path[i + 1], linkId: link.id, layer: 7 as OSILayer, protocol: 'DHCP', headers: { type: 'DISCOVER', clientMAC: clientMac, srcIP: '0.0.0.0', dstIP: '255.255.255.255' }, status: 'transit' });
  }
  // OFFER
  for (let i = 0; i < rev.length - 1; i++) {
    const link = findLink(ctx, rev[i], rev[i + 1]); if (!link) continue;
    events.push({ id: uid(), timestamp: ts++, fromDeviceId: rev[i], toDeviceId: rev[i + 1], linkId: link.id, layer: 7 as OSILayer, protocol: 'DHCP', headers: { type: 'OFFER', offeredIP: assignedIp, serverIP: serverIface.ip!, mask: serverIface.mask || '255.255.255.0', gateway: serverIface.ip!, lease: '86400s' }, status: 'transit' });
  }
  // REQUEST
  for (let i = 0; i < path.length - 1; i++) {
    const link = findLink(ctx, path[i], path[i + 1]); if (!link) continue;
    events.push({ id: uid(), timestamp: ts++, fromDeviceId: path[i], toDeviceId: path[i + 1], linkId: link.id, layer: 7 as OSILayer, protocol: 'DHCP', headers: { type: 'REQUEST', requestedIP: assignedIp, serverIP: serverIface.ip! }, status: 'transit' });
  }
  // ACK
  for (let i = 0; i < rev.length - 1; i++) {
    const link = findLink(ctx, rev[i], rev[i + 1]); if (!link) continue;
    events.push({ id: uid(), timestamp: ts++, fromDeviceId: rev[i], toDeviceId: rev[i + 1], linkId: link.id, layer: 7 as OSILayer, protocol: 'DHCP', headers: { type: 'ACK', assignedIP: assignedIp, mask: serverIface.mask || '255.255.255.0', gateway: serverIface.ip!, dns: serverIface.ip! }, status: 'transit' });
  }

  events.push({ id: uid(), timestamp: ts++, fromDeviceId: clientId, toDeviceId: clientId, linkId: '', layer: 7 as OSILayer, protocol: 'DHCP', headers: { result: `IP asignada: ${assignedIp}`, mask: serverIface.mask || '255.255.255.0', gateway: serverIface.ip! }, status: 'delivered' });

  return { success: true, events, assignedIp };
}

// ─── HTTP ─────────────────────────────────────────────────────────────────────

export function simulateHTTP(ctx: SimContext, clientId: string, serverIp: string, method = 'GET', urlPath = '/'): SimResult {
  const client = ctx.devices.find((d) => d.id === clientId);
  if (!client) return { success: false, events: [], error: 'Cliente no encontrado' };
  const clientIface = client.interfaces.find((i) => i.ip && i.isUp);
  if (!clientIface?.ip) return { success: false, events: [], error: `${client.label}: sin IP` };

  const server = ctx.devices.find((d) => d.interfaces.some((i) => i.ip === serverIp));
  if (!server) return { success: false, events: [], error: `Servidor ${serverIp} no encontrado` };

  const path = findPath(ctx, clientId, server.id);
  if (!path.length) return { success: false, events: [], error: 'Sin ruta al servidor' };

  const rev = [...path].reverse();
  const events: PacketEvent[] = [];
  let ts = 0;

  const srcPort = String(49152 + Math.floor(Math.random() * 1000));

  // TCP SYN
  const syn = hopEvents(ctx, path, clientIface.ip!, serverIp, 'TCP', { flags: 'SYN', srcPort, dstPort: '80', seq: '0' }, ts);
  events.push(...syn.events); ts = syn.ts;
  if (syn.blocked) return { success: false, events, error: `Bloqueado: ${syn.blockedBy}`, blocked: true };

  // TCP SYN-ACK
  const synack = hopEvents(ctx, rev, serverIp, clientIface.ip!, 'TCP', { flags: 'SYN-ACK', srcPort: '80', dstPort: srcPort, seq: '0', ack: '1' }, ts);
  events.push(...synack.events); ts = synack.ts;

  // TCP ACK
  const ack = hopEvents(ctx, path, clientIface.ip!, serverIp, 'TCP', { flags: 'ACK', srcPort, dstPort: '80', seq: '1', ack: '1' }, ts);
  events.push(...ack.events); ts = ack.ts;

  // HTTP Request
  const req = hopEvents(ctx, path, clientIface.ip!, serverIp, 'HTTP', { method, url: urlPath, host: serverIp, 'User-Agent': 'SI-Learning/1.0' }, ts);
  events.push(...req.events); ts = req.ts;
  if (req.blocked) return { success: false, events, error: `Bloqueado: ${req.blockedBy}`, blocked: true };

  events.push({ id: uid(), timestamp: ts++, fromDeviceId: server.id, toDeviceId: server.id, linkId: '', layer: 7 as OSILayer, protocol: 'HTTP', headers: { action: 'Processing', method, url: urlPath }, status: 'delivered' });

  // HTTP Response
  const resp = hopEvents(ctx, rev, serverIp, clientIface.ip!, 'HTTP', { status: '200 OK', 'Content-Type': 'text/html', 'Content-Length': '1234', server: 'SI-Learning-Server' }, ts);
  events.push(...resp.events); ts = resp.ts;

  events.push({ id: uid(), timestamp: ts++, fromDeviceId: clientId, toDeviceId: clientId, linkId: '', layer: 7 as OSILayer, protocol: 'HTTP', headers: { result: `${method} ${urlPath} → 200 OK` }, status: 'delivered' });

  return { success: true, events };
}

// Keep PingResult alias for backwards compatibility
export interface PingResult extends SimResult {}
