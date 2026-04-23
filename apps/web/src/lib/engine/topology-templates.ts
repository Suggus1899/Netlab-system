import { DeviceType } from '@si-learning/shared';
import type { NetworkDevice, NetworkLink } from '@si-learning/shared';

function uid(): string {
  return Math.random().toString(36).substring(2, 10);
}

function mac(): string {
  const h = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
  return `${h()}:${h()}:${h()}:${h()}:${h()}:${h()}`;
}

export interface TopologyTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  build: () => { devices: NetworkDevice[]; links: NetworkLink[] };
}

export const TOPOLOGY_TEMPLATES: TopologyTemplate[] = [
  {
    id: 'two-pcs',
    name: 'Dos PCs',
    description: 'Red simple: dos PCs conectados directamente',
    icon: '💻',
    build: () => {
      const pc1Id = uid(); const pc2Id = uid();
      const i1Id = uid(); const i2Id = uid();
      const linkId = uid();
      const devices: NetworkDevice[] = [
        { id: pc1Id, type: DeviceType.PC, label: 'PC1', x: 150, y: 200, interfaces: [{ id: i1Id, name: 'eth0', mac: mac(), ip: '192.168.1.10', mask: '255.255.255.0', isUp: true }], config: { gateway: '192.168.1.1' } },
        { id: pc2Id, type: DeviceType.PC, label: 'PC2', x: 450, y: 200, interfaces: [{ id: i2Id, name: 'eth0', mac: mac(), ip: '192.168.1.20', mask: '255.255.255.0', isUp: true }], config: { gateway: '192.168.1.1' } },
      ];
      const links: NetworkLink[] = [{ id: linkId, sourceDeviceId: pc1Id, sourceInterfaceId: i1Id, targetDeviceId: pc2Id, targetInterfaceId: i2Id }];
      return { devices, links };
    },
  },
  {
    id: 'switch-network',
    name: 'Red con Switch',
    description: 'Tres PCs conectados a un switch central',
    icon: '🔀',
    build: () => {
      const sw = uid(); const sw0 = uid(); const sw1 = uid(); const sw2 = uid();
      const p1 = uid(); const p2 = uid(); const p3 = uid();
      const p1i = uid(); const p2i = uid(); const p3i = uid();
      const swI = [uid(), uid(), uid()];
      const lIds = [uid(), uid(), uid()];
      const switchDevice: NetworkDevice = {
        id: sw, type: DeviceType.SWITCH, label: 'Switch1', x: 300, y: 200,
        interfaces: [
          { id: swI[0], name: 'fa0/0', mac: mac(), isUp: true },
          { id: swI[1], name: 'fa0/1', mac: mac(), isUp: true },
          { id: swI[2], name: 'fa0/2', mac: mac(), isUp: true },
        ],
        config: {},
      };
      const devices: NetworkDevice[] = [
        switchDevice,
        { id: p1, type: DeviceType.PC, label: 'PC1', x: 100, y: 80, interfaces: [{ id: p1i, name: 'eth0', mac: mac(), ip: '192.168.1.10', mask: '255.255.255.0', isUp: true }], config: { gateway: '192.168.1.1' } },
        { id: p2, type: DeviceType.PC, label: 'PC2', x: 500, y: 80, interfaces: [{ id: p2i, name: 'eth0', mac: mac(), ip: '192.168.1.20', mask: '255.255.255.0', isUp: true }], config: { gateway: '192.168.1.1' } },
        { id: p3, type: DeviceType.PC, label: 'PC3', x: 300, y: 350, interfaces: [{ id: p3i, name: 'eth0', mac: mac(), ip: '192.168.1.30', mask: '255.255.255.0', isUp: true }], config: { gateway: '192.168.1.1' } },
      ];
      const links: NetworkLink[] = [
        { id: lIds[0], sourceDeviceId: sw, sourceInterfaceId: swI[0], targetDeviceId: p1, targetInterfaceId: p1i },
        { id: lIds[1], sourceDeviceId: sw, sourceInterfaceId: swI[1], targetDeviceId: p2, targetInterfaceId: p2i },
        { id: lIds[2], sourceDeviceId: sw, sourceInterfaceId: swI[2], targetDeviceId: p3, targetInterfaceId: p3i },
      ];
      return { devices, links };
    },
  },
  {
    id: 'router-two-subnets',
    name: 'Router + 2 subredes',
    description: 'Dos redes diferentes conectadas por un router',
    icon: '🌐',
    build: () => {
      const r = uid(); const rI0 = uid(); const rI1 = uid();
      const p1 = uid(); const p1i = uid();
      const p2 = uid(); const p2i = uid();
      const router: NetworkDevice = {
        id: r, type: DeviceType.ROUTER, label: 'Router1', x: 300, y: 200,
        interfaces: [
          { id: rI0, name: 'eth0', mac: mac(), ip: '192.168.1.1', mask: '255.255.255.0', isUp: true },
          { id: rI1, name: 'eth1', mac: mac(), ip: '10.0.0.1', mask: '255.255.255.0', isUp: true },
        ],
        config: { routingTable: [] },
      };
      const devices: NetworkDevice[] = [
        router,
        { id: p1, type: DeviceType.PC, label: 'PC1', x: 100, y: 200, interfaces: [{ id: p1i, name: 'eth0', mac: mac(), ip: '192.168.1.10', mask: '255.255.255.0', isUp: true }], config: { gateway: '192.168.1.1' } },
        { id: p2, type: DeviceType.PC, label: 'PC2', x: 500, y: 200, interfaces: [{ id: p2i, name: 'eth0', mac: mac(), ip: '10.0.0.10', mask: '255.255.255.0', isUp: true }], config: { gateway: '10.0.0.1' } },
      ];
      const links: NetworkLink[] = [
        { id: uid(), sourceDeviceId: r, sourceInterfaceId: rI0, targetDeviceId: p1, targetInterfaceId: p1i },
        { id: uid(), sourceDeviceId: r, sourceInterfaceId: rI1, targetDeviceId: p2, targetInterfaceId: p2i },
      ];
      return { devices, links };
    },
  },
  {
    id: 'firewall-dmz',
    name: 'Firewall + DMZ',
    description: 'Red con firewall, zona DMZ y servidor web',
    icon: '🛡️',
    build: () => {
      const fw = uid(); const fwI0 = uid(); const fwI1 = uid(); const fwI2 = uid();
      const r = uid(); const rI0 = uid(); const rI1 = uid();
      const srv = uid(); const srvI = uid();
      const pc = uid(); const pcI = uid();
      const firewall: NetworkDevice = {
        id: fw, type: DeviceType.FIREWALL, label: 'Firewall1', x: 300, y: 200,
        interfaces: [
          { id: fwI0, name: 'eth0', mac: mac(), ip: '10.0.0.2', mask: '255.255.255.0', isUp: true },
          { id: fwI1, name: 'eth1', mac: mac(), ip: '192.168.1.1', mask: '255.255.255.0', isUp: true },
          { id: fwI2, name: 'eth2', mac: mac(), ip: '172.16.0.1', mask: '255.255.255.0', isUp: true },
        ],
        config: {
          firewallRules: [
            { id: uid(), action: 'ALLOW', protocol: 'TCP', sourceIp: '192.168.1.0/24', destinationIp: '172.16.0.10', port: 80, order: 1 },
            { id: uid(), action: 'DENY', protocol: 'ANY', sourceIp: '*', destinationIp: '192.168.1.0/24', order: 2 },
          ],
        },
      };
      const devices: NetworkDevice[] = [
        { id: r, type: DeviceType.ROUTER, label: 'Router-ISP', x: 100, y: 200, interfaces: [{ id: rI0, name: 'eth0', mac: mac(), ip: '10.0.0.1', mask: '255.255.255.0', isUp: true }, { id: rI1, name: 'eth1', mac: mac(), isUp: true }], config: {} },
        firewall,
        { id: pc, type: DeviceType.PC, label: 'PC-LAN', x: 500, y: 100, interfaces: [{ id: pcI, name: 'eth0', mac: mac(), ip: '192.168.1.10', mask: '255.255.255.0', isUp: true }], config: { gateway: '192.168.1.1' } },
        { id: srv, type: DeviceType.SERVER, label: 'Web-DMZ', x: 500, y: 300, interfaces: [{ id: srvI, name: 'eth0', mac: mac(), ip: '172.16.0.10', mask: '255.255.255.0', isUp: true }], config: { gateway: '172.16.0.1' } },
      ];
      const links: NetworkLink[] = [
        { id: uid(), sourceDeviceId: r, sourceInterfaceId: rI0, targetDeviceId: fw, targetInterfaceId: fwI0 },
        { id: uid(), sourceDeviceId: fw, sourceInterfaceId: fwI1, targetDeviceId: pc, targetInterfaceId: pcI },
        { id: uid(), sourceDeviceId: fw, sourceInterfaceId: fwI2, targetDeviceId: srv, targetInterfaceId: srvI },
      ];
      return { devices, links };
    },
  },
  {
    id: 'dhcp-dns',
    name: 'DHCP + DNS',
    description: 'Red con servidor que provee DHCP y DNS',
    icon: '📡',
    build: () => {
      const sw = uid(); const swI0 = uid(); const swI1 = uid(); const swI2 = uid();
      const srv = uid(); const srvI = uid();
      const pc1 = uid(); const pc1i = uid();
      const pc2 = uid(); const pc2i = uid();
      const switchDev: NetworkDevice = { id: sw, type: DeviceType.SWITCH, label: 'Switch1', x: 300, y: 200, interfaces: [{ id: swI0, name: 'fa0/0', mac: mac(), isUp: true }, { id: swI1, name: 'fa0/1', mac: mac(), isUp: true }, { id: swI2, name: 'fa0/2', mac: mac(), isUp: true }], config: {} };
      const devices: NetworkDevice[] = [
        switchDev,
        { id: srv, type: DeviceType.SERVER, label: 'DHCP/DNS-Server', x: 100, y: 100, interfaces: [{ id: srvI, name: 'eth0', mac: mac(), ip: '192.168.1.1', mask: '255.255.255.0', isUp: true }], config: { dhcpEnabled: true, dnsServer: '192.168.1.1' } },
        { id: pc1, type: DeviceType.PC, label: 'PC1', x: 500, y: 100, interfaces: [{ id: pc1i, name: 'eth0', mac: mac(), isUp: true }], config: { gateway: '192.168.1.1', dnsServer: '192.168.1.1' } },
        { id: pc2, type: DeviceType.PC, label: 'PC2', x: 300, y: 380, interfaces: [{ id: pc2i, name: 'eth0', mac: mac(), isUp: true }], config: { gateway: '192.168.1.1', dnsServer: '192.168.1.1' } },
      ];
      const links: NetworkLink[] = [
        { id: uid(), sourceDeviceId: sw, sourceInterfaceId: swI0, targetDeviceId: srv, targetInterfaceId: srvI },
        { id: uid(), sourceDeviceId: sw, sourceInterfaceId: swI1, targetDeviceId: pc1, targetInterfaceId: pc1i },
        { id: uid(), sourceDeviceId: sw, sourceInterfaceId: swI2, targetDeviceId: pc2, targetInterfaceId: pc2i },
      ];
      return { devices, links };
    },
  },
];
