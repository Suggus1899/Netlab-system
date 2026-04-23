export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export enum Difficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum LabStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: UserPublic;
  tokens: AuthTokens;
}

export interface Lab {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  topic: string;
  status: LabStatus;
  steps: LabStep[];
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface LabStep {
  id: string;
  order: number;
  title: string;
  instructions: string;
  hint?: string;
  validation: StepValidation;
}

export interface StepValidation {
  type: 'ping' | 'config' | 'routing' | 'packet' | 'custom' | 'firewall' | 'connectivity' | 'device_count' | 'observation';
  expected: Record<string, unknown>;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  createdAt: string;
}

export interface StudentProgress {
  id: string;
  userId: string;
  labId: string;
  status: ProgressStatus;
  currentStep: number;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
}

// Network simulation types
export enum DeviceType {
  PC = 'PC',
  ROUTER = 'ROUTER',
  SWITCH = 'SWITCH',
  SERVER = 'SERVER',
  FIREWALL = 'FIREWALL',
}

export interface NetworkDevice {
  id: string;
  type: DeviceType;
  label: string;
  x: number;
  y: number;
  interfaces: NetworkInterface[];
  config: DeviceConfig;
}

export interface NetworkInterface {
  id: string;
  name: string;
  ip?: string;
  mask?: string;
  mac: string;
  vlan?: number;
  isUp: boolean;
}

export interface DeviceConfig {
  gateway?: string;
  routingTable?: RoutingEntry[];
  dnsServer?: string;
  dhcpEnabled?: boolean;
  firewallRules?: FirewallRule[];
}

export interface RoutingEntry {
  destination: string;
  mask: string;
  nextHop: string;
  interface: string;
  metric: number;
}

export interface FirewallRule {
  id: string;
  action: 'ALLOW' | 'DENY';
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ANY';
  sourceIp: string;
  destinationIp: string;
  port?: number;
  order: number;
}

export interface NetworkLink {
  id: string;
  sourceDeviceId: string;
  sourceInterfaceId: string;
  targetDeviceId: string;
  targetInterfaceId: string;
}

export interface NetworkTopology {
  devices: NetworkDevice[];
  links: NetworkLink[];
}

// Packet visualization types
export enum OSILayer {
  PHYSICAL = 1,
  DATA_LINK = 2,
  NETWORK = 3,
  TRANSPORT = 4,
  APPLICATION = 7,
}

export interface PacketEvent {
  id: string;
  timestamp: number;
  fromDeviceId: string;
  toDeviceId: string;
  linkId: string;
  layer: OSILayer;
  protocol: string;
  headers: Record<string, string>;
  payload?: string;
  status: 'transit' | 'delivered' | 'dropped';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
