'use client';

import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';

export function DemoBadge() {
  return (
    <Badge 
      variant="outline" 
      className="bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 gap-1"
    >
      <Sparkles className="w-3 h-3" />
      Demo
    </Badge>
  );
}

export function DemoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-sm hover:bg-amber-200 dark:hover:bg-amber-800/50 transition-colors"
    >
      <Sparkles className="w-4 h-4" />
      <span>Demo</span>
    </button>
  );
}
