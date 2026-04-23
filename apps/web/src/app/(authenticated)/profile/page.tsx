'use client';

import { useState } from 'react';
import { User, Mail, Shield, Calendar, Pencil, Loader2, Check, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

const roleLabel: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Administrador', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  TEACHER: { label: 'Profesor', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  STUDENT: { label: 'Alumno', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);

  if (!user) return null;

  const role = roleLabel[user.role] ?? { label: user.role, color: 'bg-muted text-muted-foreground' };

  const handleSave = async () => {
    if (!name.trim() || name === user.name) { setEditing(false); return; }
    setIsSaving(true);
    try {
      await apiFetch(`/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ name: name.trim() }) });
      await fetchMe();
      toast('Nombre actualizado correctamente', 'success');
      setEditing(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al actualizar el nombre', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user.name);
    setEditing(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="mt-1 text-muted-foreground">Información de tu cuenta</p>
      </div>

      {/* Avatar + name */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-gray-900">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            <span className="text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-lg font-semibold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
                <button onClick={handleSave} disabled={isSaving}
                  className="rounded-lg p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button onClick={handleCancel}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="truncate text-xl font-semibold">{user.name}</h2>
                <button onClick={() => { setName(user.name); setEditing(true); }}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
            <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${role.color}`}>
              {role.label}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Detalles de la cuenta</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nombre completo</p>
              <p className="text-sm font-medium">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Correo electrónico</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rol</p>
              <p className="text-sm font-medium">{role.label}</p>
            </div>
          </div>
          {(user as any).createdAt && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Miembro desde</p>
                <p className="text-sm font-medium">
                  {new Date((user as any).createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
