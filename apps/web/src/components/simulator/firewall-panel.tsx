'use client';

import { Plus, Trash2, Shield } from 'lucide-react';
import { useNetworkStore } from '@/lib/store/network-store';
import type { FirewallRule } from '@si-learning/shared';

function uid() { return Math.random().toString(36).substring(2, 10); }

export function FirewallPanel() {
  const { devices, selectedDeviceId, updateDeviceConfig } = useNetworkStore();
  const device = devices.find((d) => d.id === selectedDeviceId);

  if (!device || device.type !== 'FIREWALL') return null;

  const rules: FirewallRule[] = device.config.firewallRules || [];

  const addRule = () => {
    const newRule: FirewallRule = { id: uid(), action: 'DENY', protocol: 'ANY', sourceIp: '*', destinationIp: '*', order: rules.length + 1 };
    updateDeviceConfig(device.id, { firewallRules: [...rules, newRule] });
  };

  const updateRule = (id: string, field: keyof FirewallRule, value: string | number) => {
    const updated = rules.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    updateDeviceConfig(device.id, { firewallRules: updated });
  };

  const removeRule = (id: string) => {
    updateDeviceConfig(device.id, { firewallRules: rules.filter((r) => r.id !== id) });
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-red-500" />
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Reglas de Firewall</h4>
        </div>
        <button onClick={addRule} className="rounded p-1 hover:bg-muted" title="Agregar regla">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {rules.length === 0 && <p className="text-[10px] text-muted-foreground">Sin reglas (todo denegado)</p>}
      <div className="space-y-2">
        {rules.map((rule) => (
          <div key={rule.id} className={`rounded-lg border p-2 text-[11px] ${rule.action === 'ALLOW' ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20' : 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20'}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <select value={rule.action} onChange={(e) => updateRule(rule.id, 'action', e.target.value)}
                className="rounded border border-input bg-background px-1.5 py-0.5 text-[10px] font-bold outline-none">
                <option value="ALLOW">ALLOW</option>
                <option value="DENY">DENY</option>
              </select>
              <select value={rule.protocol} onChange={(e) => updateRule(rule.id, 'protocol', e.target.value)}
                className="rounded border border-input bg-background px-1.5 py-0.5 text-[10px] outline-none">
                <option value="ANY">ANY</option>
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
              </select>
              <button onClick={() => removeRule(rule.id)} className="ml-auto rounded p-0.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/30">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <div>
                <label className="text-[9px] text-muted-foreground">Src IP</label>
                <input value={rule.sourceIp} onChange={(e) => updateRule(rule.id, 'sourceIp', e.target.value)}
                  className="w-full rounded border border-input bg-background px-1 py-0.5 font-mono text-[10px] outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">Dst IP</label>
                <input value={rule.destinationIp} onChange={(e) => updateRule(rule.id, 'destinationIp', e.target.value)}
                  className="w-full rounded border border-input bg-background px-1 py-0.5 font-mono text-[10px] outline-none" />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">Puerto</label>
                <input type="number" value={rule.port || ''} onChange={(e) => updateRule(rule.id, 'port', parseInt(e.target.value) || 0)}
                  placeholder="any" className="w-full rounded border border-input bg-background px-1 py-0.5 font-mono text-[10px] outline-none" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
