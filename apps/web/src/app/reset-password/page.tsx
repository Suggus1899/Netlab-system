'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Network, ArrowLeft, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Token inválido o expirado');
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-8 shadow-xl dark:bg-gray-900">
      {done ? (
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">¡Contraseña actualizada!</h2>
          <p className="mb-4 text-sm text-muted-foreground">Redirigiendo al inicio de sesión...</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="text-center text-xl font-semibold">Nueva contraseña</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Elige una contraseña segura de al menos 8 caracteres.
            </p>
          </div>

          {!token && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Token de recuperación no encontrado. Solicita un nuevo enlace.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Nueva contraseña</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres" required disabled={!token}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div>
              <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium">Confirmar contraseña</label>
              <input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repite la contraseña" required disabled={!token}
                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
            </div>

            <button type="submit" disabled={isLoading || !token}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Actualizando...</> : 'Restablecer contraseña'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/login" className="flex items-center justify-center gap-1.5 font-medium text-primary-600 hover:text-primary-500">
              <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg">
            <KeyRound className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SI Learning Red</h1>
          <p className="mt-1 text-sm text-muted-foreground">Restablece tu contraseña</p>
        </div>
        <Suspense fallback={<div className="rounded-2xl border border-border bg-white p-8 text-center dark:bg-gray-900">Cargando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
