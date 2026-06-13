'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Network, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 px-4 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg">
            <Network className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">SI Learning Red</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Simulación interactiva para la enseñanza de redes
          </p>
        </div>

        {/* Card */}
        <Card className="shadow-xl">
          <CardContent className="pt-6">
            <div className="text-center space-y-1 pb-6">
              <h2 className="text-2xl font-semibold tracking-tight">Iniciar Sesión</h2>
              <p className="text-sm text-muted-foreground">
                Ingresa tus credenciales para acceder
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              autoComplete="email"
              error={error}
            />

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium leading-none">
                Contraseña
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
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500 hover:underline transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={isLoading}
              >
                {!isLoading && <ArrowRight className="h-4 w-4 mr-2" aria-hidden="true" />}
                {isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500 hover:underline transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
