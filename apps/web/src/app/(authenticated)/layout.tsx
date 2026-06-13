'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { Navbar } from '@/components/layout/navbar';
import { SkeletonCard } from '@/components/ui/skeleton';

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchMe } = useAuthStore();

  useEffect(() => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken && !isAuthenticated) {
      fetchMe();
    } else if (!refreshToken) {
      router.replace('/login');
    }
  }, [isAuthenticated, fetchMe, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="sticky top-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur" />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
