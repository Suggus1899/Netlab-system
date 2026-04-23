'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import DeviceNode from './nodes/device-node';
import NetworkEdge from './edges/network-edge';
import { SimulatorToolbar, type SimProtocol } from './toolbar';
import { DeviceConfigPanel } from './device-config-panel';
import { PacketInspector } from './packet-inspector';
import { useNetworkStore } from '@/lib/store/network-store';
import {
  simulatePing, simulateARP, simulateDNS, simulateDHCP, simulateHTTP,
  type SimResult,
} from '@/lib/engine/packet-engine';
import type { DeviceType } from '@si-learning/shared';

const nodeTypes = { device: DeviceNode };
const edgeTypes = { network: NetworkEdge };

export function NetworkCanvas() {
  const store = useNetworkStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Protocol selector
  const [selectedProtocol, setSelectedProtocol] = useState<SimProtocol>('PING');

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dialogError, setDialogError] = useState('');

  // Per-protocol dialog fields
  const [targetIp, setTargetIp] = useState('');
  const [dnsDomain, setDnsDomain] = useState('example.com');
  const [dnsSrvIp, setDnsSrvIp] = useState('');
  const [httpMethod, setHttpMethod] = useState('GET');
  const [httpPath, setHttpPath] = useState('/');

  // Validation warnings
  const devicesWithoutIp = store.devices.filter(
    (d) => d.type !== 'SWITCH' && !d.interfaces.some((i) => i.ip && i.isUp),
  );

  // React Flow nodes
  const nodes: Node[] = useMemo(
    () =>
      store.devices.map((device) => ({
        id: device.id,
        type: 'device',
        position: { x: device.x, y: device.y },
        data: {
          label: device.label,
          type: device.type,
          interfaces: device.interfaces,
          isSelected: store.selectedDeviceId === device.id,
          hasError: devicesWithoutIp.some((d) => d.id === device.id),
        },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store.devices, store.selectedDeviceId, devicesWithoutIp.length],
  );

  // React Flow edges
  const edges: Edge[] = useMemo(
    () =>
      store.links.map((link) => {
        const hasPacket = store.packetLog.some((e) => e.linkId === link.id && e.status === 'transit');
        return {
          id: link.id,
          source: link.sourceDeviceId,
          target: link.targetDeviceId,
          type: 'network',
          animated: store.isSimulating && hasPacket,
          data: { isActive: true, hasPacket: store.isSimulating && hasPacket, packetProgress: 0, packetColor: '#3b82f6' },
          selected: store.selectedLinkId === link.id,
        };
      }),
    [store.links, store.selectedLinkId, store.isSimulating, store.packetLog],
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          store.updateDevicePosition(change.id, change.position.x, change.position.y);
        }
      }
    },
    [store],
  );

  const onEdgesChange: OnEdgesChange = useCallback(() => {}, []);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const src = store.devices.find((d) => d.id === connection.source);
      const tgt = store.devices.find((d) => d.id === connection.target);
      if (!src || !tgt) return;
      const freeS = src.interfaces.find((i) => i.isUp && !store.links.some((l) => l.sourceInterfaceId === i.id || l.targetInterfaceId === i.id));
      const freeT = tgt.interfaces.find((i) => i.isUp && !store.links.some((l) => l.sourceInterfaceId === i.id || l.targetInterfaceId === i.id));
      if (freeS && freeT) store.addLink(src.id, freeS.id, tgt.id, freeT.id);
    },
    [store],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => store.selectDevice(node.id), [store]);
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => store.selectLink(edge.id), [store]);
  const onPaneClick = useCallback(() => { store.selectDevice(null); store.selectLink(null); }, [store]);

  const handleAddDevice = useCallback((type: DeviceType) => {
    const x = 100 + Math.random() * 400;
    const y = 100 + Math.random() * 300;
    store.selectDevice(store.addDevice(type, x, y));
  }, [store]);

  const handleDelete = useCallback(() => {
    if (store.selectedDeviceId) store.removeDevice(store.selectedDeviceId);
    if (store.selectedLinkId) store.removeLink(store.selectedLinkId);
  }, [store]);

  // ── Simulation runner ────────────────────────────────────────────────────────
  const runSimulation = useCallback((result: SimResult) => {
    if (!result.success) {
      setDialogError(result.error || 'Error en la simulación');
      return;
    }
    setShowDialog(false);
    store.clearPacketLog();
    store.startSimulation([]);

    const speed = store.playbackSpeed;
    const delay = Math.max(50, 400 / speed);
    let i = 0;
    const tick = () => {
      if (store.isPaused) { setTimeout(tick, 200); return; }
      store.addPacketLog(result.events[i]);
      i++;
      if (i < result.events.length) {
        setTimeout(tick, delay);
      } else {
        setTimeout(() => store.stopSimulation(), 600);
      }
    };
    setTimeout(tick, delay);
  }, [store]);

  const handleSimulate = useCallback((protocol: SimProtocol) => {
    setDialogError('');
    setShowDialog(true);
  }, []);

  const executeSimulation = useCallback(() => {
    const ctx = { devices: store.devices, links: store.links };
    const srcId = store.selectedDeviceId;

    if (!srcId) { setDialogError('Selecciona un dispositivo origen en el canvas'); return; }

    let result: SimResult;
    switch (selectedProtocol) {
      case 'PING':
        if (!targetIp) { setDialogError('Escribe una IP destino'); return; }
        result = simulatePing(ctx, srcId, targetIp);
        break;
      case 'ARP':
        if (!targetIp) { setDialogError('Escribe una IP destino'); return; }
        result = simulateARP(ctx, srcId, targetIp);
        break;
      case 'DNS':
        if (!dnsSrvIp) { setDialogError('Escribe la IP del servidor DNS'); return; }
        result = simulateDNS(ctx, srcId, dnsDomain, dnsSrvIp);
        break;
      case 'DHCP':
        result = simulateDHCP(ctx, srcId);
        break;
      case 'HTTP':
        if (!targetIp) { setDialogError('Escribe la IP del servidor HTTP'); return; }
        result = simulateHTTP(ctx, srcId, targetIp, httpMethod, httpPath);
        break;
      default:
        return;
    }
    runSimulation(result);
  }, [store, selectedProtocol, targetIp, dnsDomain, dnsSrvIp, httpMethod, httpPath, runSimulation]);

  // ── Export / Import ──────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const json = store.exportTopology();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'topologia.json'; a.click();
    URL.revokeObjectURL(url);
  }, [store]);

  const handleImport = useCallback((json: string) => {
    const ok = store.importTopology(json);
    if (!ok) alert('JSON inválido o estructura incorrecta');
  }, [store]);

  const srcDevice = store.devices.find((d) => d.id === store.selectedDeviceId);

  return (
    <div className="relative h-full w-full" ref={reactFlowWrapper}>
      {/* Toolbar */}
      <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2">
        <SimulatorToolbar
          onAddDevice={handleAddDevice}
          onDelete={handleDelete}
          onSimulate={handleSimulate}
          onStopSimulation={() => { store.stopSimulation(); store.clearPacketLog(); }}
          onClear={store.clearTopology}
          onExport={handleExport}
          onImport={handleImport}
          isSimulating={store.isSimulating}
          hasSelection={!!(store.selectedDeviceId || store.selectedLinkId)}
          selectedProtocol={selectedProtocol}
          onProtocolChange={setSelectedProtocol}
        />
      </div>

      {/* IP validation warning */}
      {devicesWithoutIp.length > 0 && !store.isSimulating && (
        <div className="absolute left-4 top-4 z-10 max-w-xs rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 shadow dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          ⚠️ {devicesWithoutIp.length} dispositivo{devicesWithoutIp.length > 1 ? 's' : ''} sin IP:{' '}
          {devicesWithoutIp.map((d) => d.label).join(', ')}
        </div>
      )}

      {/* Playback controls */}
      {store.isSimulating && (
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-xl border border-border bg-white/95 px-3 py-2 shadow-lg backdrop-blur dark:bg-gray-900/95">
          <span className="text-xs font-medium text-muted-foreground">Velocidad:</span>
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => store.setPlaybackSpeed(s)}
              className={`rounded-md px-2 py-0.5 text-xs font-semibold transition-colors ${store.playbackSpeed === s ? 'bg-primary-600 text-white' : 'bg-muted hover:bg-muted/80'}`}
            >
              {s}×
            </button>
          ))}
          <div className="mx-1 h-5 w-px bg-border" />
          <button
            onClick={store.togglePause}
            className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold hover:bg-muted/80"
          >
            {store.isPaused ? '▶ Reanudar' : '⏸ Pausar'}
          </button>
        </div>
      )}

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        className="bg-gray-50 dark:bg-gray-950"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="!text-gray-200 dark:!text-gray-800" />
        <Controls className="!rounded-xl !border !border-border !shadow-lg" />
        <MiniMap nodeStrokeWidth={3} className="!rounded-xl !border !border-border !shadow-lg" maskColor="rgba(0,0,0,0.1)" />
      </ReactFlow>

      {/* Config panel */}
      <DeviceConfigPanel />

      {/* Packet inspector */}
      <PacketInspector />

      {/* ── Simulation dialog ─────────────────────────────────────────────── */}
      {showDialog && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="w-[420px] rounded-2xl border border-border bg-white p-6 shadow-2xl dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold">
              Simular {selectedProtocol === 'PING' ? 'ICMP Ping' : selectedProtocol}
            </h3>

            <div className="space-y-3">
              {/* Source device */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Dispositivo origen</label>
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                  {srcDevice?.label || 'Ninguno seleccionado'}
                  {srcDevice && (
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      ({srcDevice.interfaces.find((i) => i.ip)?.ip || 'sin IP'})
                    </span>
                  )}
                </p>
                {!store.selectedDeviceId && (
                  <p className="mt-1 text-xs text-amber-600">Selecciona un dispositivo en el canvas primero</p>
                )}
              </div>

              {/* PING / ARP / HTTP: target IP */}
              {(selectedProtocol === 'PING' || selectedProtocol === 'ARP' || selectedProtocol === 'HTTP') && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {selectedProtocol === 'HTTP' ? 'IP del servidor HTTP' : 'IP destino'}
                  </label>
                  <input value={targetIp} onChange={(e) => setTargetIp(e.target.value)}
                    placeholder="ej. 192.168.1.20"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                  {/* Hint: show IPs of known devices */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {store.devices.filter((d) => d.id !== store.selectedDeviceId).flatMap((d) =>
                      d.interfaces.filter((i) => i.ip).map((i) => (
                        <button key={i.id} onClick={() => setTargetIp(i.ip!)}
                          className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] hover:bg-primary-100 dark:bg-gray-800 dark:hover:bg-primary-900/40">
                          {d.label}: {i.ip}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* HTTP extra fields */}
              {selectedProtocol === 'HTTP' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Método</label>
                    <select value={httpMethod} onChange={(e) => setHttpMethod(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:border-primary-500">
                      {['GET','POST','PUT','DELETE'].map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Ruta</label>
                    <input value={httpPath} onChange={(e) => setHttpPath(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-2 py-2 font-mono text-sm outline-none focus:border-primary-500" />
                  </div>
                </div>
              )}

              {/* DNS fields */}
              {selectedProtocol === 'DNS' && (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Dominio a resolver</label>
                    <input value={dnsDomain} onChange={(e) => setDnsDomain(e.target.value)}
                      placeholder="ej. example.com"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">IP del servidor DNS</label>
                    <input value={dnsSrvIp} onChange={(e) => setDnsSrvIp(e.target.value)}
                      placeholder="ej. 192.168.1.53"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
                    <div className="mt-1 flex flex-wrap gap-1">
                      {store.devices.filter((d) => d.type === 'SERVER').flatMap((d) =>
                        d.interfaces.filter((i) => i.ip).map((i) => (
                          <button key={i.id} onClick={() => setDnsSrvIp(i.ip!)}
                            className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] hover:bg-primary-100 dark:bg-gray-800">
                            {d.label}: {i.ip}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* DHCP info */}
              {selectedProtocol === 'DHCP' && (
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  El cliente enviará DISCOVER. Se necesita un Server o Router con IP configurada en la red.
                </p>
              )}

              {dialogError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/20">{dialogError}</p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDialog(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
                Cancelar
              </button>
              <button onClick={executeSimulation}
                className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
                Ejecutar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
