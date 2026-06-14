'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Network,
  FlaskConical,
  LayoutDashboard,
  BookOpen,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Keyboard,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { useDemoStore } from '@/lib/store/demo-store';
import { useToast } from '@/components/ui/toast';
import { DemoBadge } from '@/components/demo/demo-badge';
import { cn } from '@/lib/utils';
import { Role } from '@si-learning/shared';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT] },
  { href: '/labs', label: 'Laboratorios', icon: FlaskConical, roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT] },
  { href: '/simulator', label: 'Simulador', icon: Network, roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT] },
  { href: '/courses', label: 'Cursos', icon: BookOpen, roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT] },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { isDemoMode, exitDemoMode } = useDemoStore();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Keyboard shortcut for theme toggle (Ctrl/Cmd+Shift+L)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [theme, setTheme]);

  const handleLogout = () => {
    // Exit demo mode if active
    if (isDemoMode) {
      exitDemoMode();
    }
    logout();
    toast('Sesión cerrada correctamente', 'success');
  };

  const filteredNav = navItems.filter(
    (item) => user && item.roles.includes(user.role as Role),
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Network className="h-7 w-7 text-primary-500" />
          <span className="text-lg font-bold tracking-tight">SI Learning Red</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Demo Badge */}
          {isDemoMode && <DemoBadge />}
          
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'} (Ctrl+Shift+L)`}
            title="Cambiar tema (Ctrl+Shift+L)"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
            <Moon className="absolute left-2 top-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true" />
          </button>

          {user && (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <User className="h-4 w-4" />
                <span>{user.name}</span>
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  {user.role === 'ADMIN' ? 'Admin' : user.role === 'TEACHER' ? 'Profesor' : 'Alumno'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          className="border-t border-border px-4 pb-4 pt-2 md:hidden animate-slide-down"
        >
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          {user && (
            <div className="mt-2 border-t border-border pt-2">
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-muted"
              >
                <User className="h-5 w-5" />
                {user.name}
              </Link>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
