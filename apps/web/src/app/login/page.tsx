'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Network, Eye, EyeOff, ArrowRight, FlaskConical, Shield, Cpu, Globe } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useDemoStore } from '@/lib/store/demo-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { enterDemoMode, loading: demoLoading } = useDemoStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    }
  };

  const handleDemoMode = async () => {
    setError('');
    try {
      await enterDemoMode();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar modo demo');
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left panel — branding */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between bg-indigo-50 p-12 overflow-hidden border-r border-indigo-100">
        {/* Subtle dot grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Soft glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -left-20 h-[360px] w-[360px] rounded-full bg-primary-200/60 blur-[100px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-20 h-[280px] w-[280px] rounded-full bg-teal-200/50 blur-[80px]"
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 shadow-md shadow-primary-600/20">
            <Network className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <span className="text-lg font-bold text-gray-800">SI Learning Red</span>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight text-gray-900">
              Aprende redes
              <br />
              <span className="text-primary-600">de forma práctica</span>
            </h2>
            <p className="max-w-sm text-base text-gray-500 leading-relaxed">
              Simulador interactivo con laboratorios guiados, validación automática y progreso en tiempo real.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-3">
            {[
              { icon: Cpu, label: 'Simulador de topologías de red' },
              { icon: Shield, label: 'Laboratorios de firewall y NAT' },
              { icon: Globe, label: 'Protocolos IP, VLAN y enrutamiento' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-indigo-100 shadow-sm">
                  <Icon className="h-4 w-4 text-primary-600" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs text-gray-400">
          © {new Date().getFullYear()} SI Learning Red
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 dark:bg-gray-950 lg:px-16">
        {/* Mobile logo */}
        <div className="mb-8 flex flex-col items-center lg:hidden">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-600/30">
            <Network className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold">SI Learning Red</h1>
        </div>

        <div className="w-full max-w-sm space-y-6">
          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Iniciar sesión</h2>
            <p className="text-sm text-gray-500">Ingresa tus credenciales para acceder</p>
          </div>

          {/* Error banner */}
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoComplete="email"
                className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Contraseña <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 pr-11 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              <div className="flex justify-end pt-0.5">
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary-600 hover:text-primary-500 hover:underline transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full h-11" size="lg" loading={isLoading}>
              {!isLoading && <ArrowRight className="mr-2 h-4 w-4" aria-hidden="true" />}
              {isLoading ? 'Ingresando...' : 'Iniciar sesión'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-gray-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400 dark:bg-gray-950 dark:text-gray-500">o prueba sin cuenta</span>
            </div>
          </div>

          {/* Demo button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDemoMode}
              disabled={demoLoading}
              className="group w-full flex items-center justify-center gap-2.5 rounded-lg border-2 border-dashed border-teal-500/40 bg-transparent px-4 py-3 text-sm font-medium text-teal-600 transition-all duration-200 hover:border-teal-500 hover:bg-teal-500/5 hover:text-teal-700 dark:border-teal-400/25 dark:text-teal-400 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {demoLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" aria-hidden="true" />
              ) : (
                <FlaskConical className="h-4 w-4 transition-transform group-hover:rotate-6" aria-hidden="true" />
              )}
              {demoLoading ? 'Iniciando demo...' : 'Entrar en Modo Demo'}
            </button>
            <p className="text-center text-xs text-gray-400">
              Datos simulados · sin backend real
            </p>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link
              href="/register"
              className="font-semibold text-primary-600 hover:text-primary-500 hover:underline transition-colors"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
