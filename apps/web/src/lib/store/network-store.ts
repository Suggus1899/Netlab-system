import { create } from 'zustand';
import type {
  NetworkDevice,
  NetworkLink,
  NetworkInterface,
  DeviceConfig,
  DeviceType,
  PacketEvent,
} from '@si-learning/shared';

const STORAGE_KEY = 'si-learning-topology';

function saveToStorage(devices: NetworkDevice[], links: NetworkLink[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ devices, links })); } catch { /* noop */ }
}

function loadFromStorage(): { devices: NetworkDevice[]; links: NetworkLink[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

const saved = typeof window !== 'undefined' ? loadFromStorage() : null;

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function generateMac(): string {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase();
  return `${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;
}

function defaultInterfaces(type: DeviceType): NetworkInterface[] {
  const count = type === 'ROUTER' ? 4 : type === 'SWITCH' ? 8 : type === 'FIREWALL' ? 3 : 1;
  return Array.from({ length: count }, (_, i) => ({
    id: generateId(),
    name: type === 'SWITCH' ? `fa0/${i}` : `eth${i}`,
    mac: generateMac(),
    isUp: true,
  }));
}

export interface SimulationPacket {
  id: string;
  events: PacketEvent[];
  currentEventIndex: number;
  isPlaying: boolean;
}

interface NetworkState {
  devices: NetworkDevice[];
  links: NetworkLink[];
  selectedDeviceId: string | null;
  selectedLinkId: string | null;
  simulationPackets: SimulationPacket[];
  isSimulating: boolean;
  packetLog: PacketEvent[];

  // Device actions
  addDevice: (type: DeviceType, x: number, y: number) => string;
  removeDevice: (id: string) => void;
  updateDevicePosition: (id: string, x: number, y: number) => void;
  updateDeviceLabel: (id: string, label: string) => void;
  updateInterfaceConfig: (
    deviceId: string,
    interfaceId: string,
    config: Partial<NetworkInterface>,
  ) => void;
  updateDeviceConfig: (deviceId: string, config: Partial<DeviceConfig>) => void;

  // Link actions
  addLink: (
    sourceDeviceId: string,
    sourceInterfaceId: string,
    targetDeviceId: string,
    targetInterfaceId: string,
  ) => string | null;
  removeLink: (id: string) => void;

  // Selection
  selectDevice: (id: string | null) => void;
  selectLink: (id: string | null) => void;

  // Simulation
  startSimulation: (packets: SimulationPacket[]) => void;
  advancePacket: (packetId: string) => void;
  stopSimulation: () => void;
  addPacketLog: (event: PacketEvent) => void;
  clearPacketLog: () => void;
  playbackSpeed: number;
  isPaused: boolean;
  setPlaybackSpeed: (speed: number) => void;
  togglePause: () => void;

  // Topology
  loadTopology: (devices: NetworkDevice[], links: NetworkLink[]) => void;
  clearTopology: () => void;
  exportTopology: () => string;
  importTopology: (json: string) => boolean;
  getDevice: (id: string) => NetworkDevice | undefined;
  getDeviceByIp: (ip: string) => NetworkDevice | undefined;
  getConnectedDevices: (deviceId: string) => { device: NetworkDevice; link: NetworkLink; viaInterface: NetworkInterface }[];
  findPath: (sourceId: string, targetIp: string) => string[];
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  devices: saved?.devices || [],
  links: saved?.links || [],
  selectedDeviceId: null,
  selectedLinkId: null,
  simulationPackets: [],
  isSimulating: false,
  packetLog: [],
  playbackSpeed: 1,
  isPaused: false,

  addDevice: (type, x, y) => {
    const id = generateId();
    const count = get().devices.filter((d) => d.type === type).length + 1;
    const labels: Record<string, string> = {
      PC: `PC${count}`,
      ROUTER: `Router${count}`,
      SWITCH: `Switch${count}`,
      SERVER: `Server${count}`,
      FIREWALL: `Firewall${count}`,
    };
    const device: NetworkDevice = {
      id,
      type,
      label: labels[type] || type,
      x,
      y,
      interfaces: defaultInterfaces(type),
      config: {},
    };
    const newDevices = [...get().devices, device];
    set({ devices: newDevices });
    saveToStorage(newDevices, get().links);
    return id;
  },

  removeDevice: (id) => {
    set((state) => {
      const devices = state.devices.filter((d) => d.id !== id);
      const links = state.links.filter((l) => l.sourceDeviceId !== id && l.targetDeviceId !== id);
      saveToStorage(devices, links);
      return { devices, links, selectedDeviceId: state.selectedDeviceId === id ? null : state.selectedDeviceId };
    });
  },

  updateDevicePosition: (id, x, y) => {
    set((state) => {
      const devices = state.devices.map((d) => (d.id === id ? { ...d, x, y } : d));
      saveToStorage(devices, state.links);
      return { devices };
    });
  },

  updateDeviceLabel: (id, label) => {
    set((state) => {
      const devices = state.devices.map((d) => (d.id === id ? { ...d, label } : d));
      saveToStorage(devices, state.links);
      return { devices };
    });
  },

  updateInterfaceConfig: (deviceId, interfaceId, config) => {
    set((state) => {
      const devices = state.devices.map((d) =>
        d.id === deviceId
          ? { ...d, interfaces: d.interfaces.map((iface) => iface.id === interfaceId ? { ...iface, ...config } : iface) }
          : d,
      );
      saveToStorage(devices, state.links);
      return { devices };
    });
  },

  updateDeviceConfig: (deviceId, config) => {
    set((state) => {
      const devices = state.devices.map((d) =>
        d.id === deviceId ? { ...d, config: { ...d.config, ...config } } : d,
      );
      saveToStorage(devices, state.links);
      return { devices };
    });
  },

  addLink: (sourceDeviceId, sourceInterfaceId, targetDeviceId, targetInterfaceId) => {
    const existing = get().links.find(
      (l) =>
        (l.sourceInterfaceId === sourceInterfaceId ||
          l.targetInterfaceId === sourceInterfaceId ||
          l.sourceInterfaceId === targetInterfaceId ||
          l.targetInterfaceId === targetInterfaceId),
    );
    if (existing) return null;
    if (sourceDeviceId === targetDeviceId) return null;

    const id = generateId();
    const link: NetworkLink = {
      id,
      sourceDeviceId,
      sourceInterfaceId,
      targetDeviceId,
      targetInterfaceId,
    };
    const newLinks = [...get().links, link];
    set({ links: newLinks });
    saveToStorage(get().devices, newLinks);
    return id;
  },

  removeLink: (id) => {
    set((state) => {
      const links = state.links.filter((l) => l.id !== id);
      saveToStorage(state.devices, links);
      return { links, selectedLinkId: state.selectedLinkId === id ? null : state.selectedLinkId };
    });
  },

  selectDevice: (id) => set({ selectedDeviceId: id, selectedLinkId: null }),
  selectLink: (id) => set({ selectedLinkId: id, selectedDeviceId: null }),

  startSimulation: (packets) => {
    set({ simulationPackets: packets, isSimulating: true });
  },

  advancePacket: (packetId) => {
    set((state) => ({
      simulationPackets: state.simulationPackets.map((p) =>
        p.id === packetId
          ? { ...p, currentEventIndex: p.currentEventIndex + 1 }
          : p,
      ),
    }));
  },

  stopSimulation: () => {
    set({ simulationPackets: [], isSimulating: false });
  },

  addPacketLog: (event) => {
    set((state) => ({ packetLog: [...state.packetLog, event] }));
  },

  clearPacketLog: () => set({ packetLog: [] }),

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),

  exportTopology: () => {
    const { devices, links } = get();
    return JSON.stringify({ devices, links }, null, 2);
  },

  importTopology: (json) => {
    try {
      const { devices, links } = JSON.parse(json);
      if (!Array.isArray(devices) || !Array.isArray(links)) return false;
      saveToStorage(devices, links);
      set({ devices, links, selectedDeviceId: null, selectedLinkId: null, packetLog: [], isSimulating: false });
      return true;
    } catch { return false; }
  },

  loadTopology: (devices, links) => {
    saveToStorage(devices, links);
    set({ devices, links, selectedDeviceId: null, selectedLinkId: null });
  },

  clearTopology: () => {
    saveToStorage([], []);
    set({
      devices: [],
      links: [],
      selectedDeviceId: null,
      selectedLinkId: null,
      simulationPackets: [],
      isSimulating: false,
      packetLog: [],
    });
  },

  getDevice: (id) => get().devices.find((d) => d.id === id),

  getDeviceByIp: (ip) =>
    get().devices.find((d) => d.interfaces.some((iface) => iface.ip === ip)),

  getConnectedDevices: (deviceId) => {
    const { devices, links } = get();
    const results: { device: NetworkDevice; link: NetworkLink; viaInterface: NetworkInterface }[] = [];

    for (const link of links) {
      let peerId: string | null = null;
      let viaInterfaceId: string | null = null;

      if (link.sourceDeviceId === deviceId) {
        peerId = link.targetDeviceId;
        viaInterfaceId = link.sourceInterfaceId;
      } else if (link.targetDeviceId === deviceId) {
        peerId = link.sourceDeviceId;
        viaInterfaceId = link.targetInterfaceId;
      }

      if (peerId && viaInterfaceId) {
        const peerDevice = devices.find((d) => d.id === peerId);
        const sourceDevice = devices.find((d) => d.id === deviceId);
        const viaInterface = sourceDevice?.interfaces.find((i) => i.id === viaInterfaceId);
        if (peerDevice && viaInterface) {
          results.push({ device: peerDevice, link, viaInterface });
        }
      }
    }
    return results;
  },

  findPath: (sourceId, targetIp) => {
    const { devices, links } = get();
    const targetDevice = devices.find((d) =>
      d.interfaces.some((iface) => iface.ip === targetIp),
    );
    if (!targetDevice) return [];

    const visited = new Set<string>();
    const queue: string[][] = [[sourceId]];

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (current === targetDevice.id) return path;
      if (visited.has(current)) continue;
      visited.add(current);

      for (const link of links) {
        let neighbor: string | null = null;
        if (link.sourceDeviceId === current) neighbor = link.targetDeviceId;
        else if (link.targetDeviceId === current) neighbor = link.sourceDeviceId;

        if (neighbor && !visited.has(neighbor)) {
          queue.push([...path, neighbor]);
        }
      }
    }
    return [];
  },
}));
