'use client';

import Link from 'next/link';

interface DemoWatermarkProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right';
}

export function DemoWatermark({ position = 'bottom-right' }: DemoWatermarkProps) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-20 right-4',
  };

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-40 opacity-70 hover:opacity-100 transition-opacity pointer-events-auto`}
    >
      <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-xs">
        <span className="font-medium text-amber-800 dark:text-amber-200">
          🟡 Modo Demo
        </span>
        <span className="block text-[10px] mt-0.5 text-amber-700 dark:text-amber-300">
          <Link 
            href="/register" 
            className="underline hover:no-underline hover:text-amber-900 dark:hover:text-amber-100"
          >
            Regístrate para guardar
          </Link>
        </span>
      </div>
    </div>
  );
}

export function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/10 to-amber-500/10 border-y border-amber-200 dark:border-amber-800 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-4 text-sm text-amber-800 dark:text-amber-200">
        <span className="flex items-center gap-2">
          <span className="text-base">🚀</span>
          Estás probando la versión demo
        </span>
        <span className="text-amber-600 dark:text-amber-400">|</span>
        <Link 
          href="/register"
          className="font-medium underline hover:no-underline hover:text-amber-900 dark:hover:text-amber-100"
        >
          Crea tu cuenta gratis →
        </Link>
      </div>
    </div>
  );
}
