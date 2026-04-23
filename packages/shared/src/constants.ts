export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '7d';

export const TOPICS = [
  'Modelo OSI',
  'Modelo TCP/IP',
  'Topologías de Red',
  'Direccionamiento IP',
  'Subnetting',
  'ARP',
  'DNS',
  'DHCP',
  'HTTP',
  'ICMP',
  'Routing Estático',
  'Switching',
  'VLANs',
  'Firewalls',
  'NAT',
  'Seguridad de Red',
] as const;

export const OSI_LAYERS = {
  1: { name: 'Física', color: '#8B5CF6', protocols: ['Ethernet', 'Wi-Fi'] },
  2: { name: 'Enlace de Datos', color: '#3B82F6', protocols: ['Ethernet', 'ARP', 'STP'] },
  3: { name: 'Red', color: '#10B981', protocols: ['IP', 'ICMP', 'ARP'] },
  4: { name: 'Transporte', color: '#F59E0B', protocols: ['TCP', 'UDP'] },
  5: { name: 'Sesión', color: '#EF4444', protocols: [] },
  6: { name: 'Presentación', color: '#EC4899', protocols: [] },
  7: { name: 'Aplicación', color: '#6366F1', protocols: ['HTTP', 'DNS', 'DHCP', 'FTP'] },
} as const;

export const DEVICE_ICONS = {
  PC: '💻',
  ROUTER: '🔀',
  SWITCH: '🔌',
  SERVER: '🖥️',
  FIREWALL: '🛡️',
} as const;

export const MAX_DEVICES_PER_TOPOLOGY = 20;
export const MAX_INTERFACES_PER_DEVICE = 8;
export const DEFAULT_SUBNET_MASK = '255.255.255.0';
