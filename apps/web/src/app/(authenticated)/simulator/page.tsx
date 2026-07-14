'use client';

import dynamic from 'next/dynamic';

// Dynamic import for heavy NetworkCanvas component
const NetworkCanvas = dynamic(
  () => import('@/components/simulator/network-canvas').then((mod) => mod.NetworkCanvas),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando simulador...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);

export default function SimulatorPage() {
  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8">
      <div className="relative h-[calc(100vh-64px)] w-full">
        <NetworkCanvas />
      </div>
    </div>
  );
}
