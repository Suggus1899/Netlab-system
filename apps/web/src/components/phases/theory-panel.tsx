'use client';

import React, { useState } from 'react';
import { BookOpen, ChevronRight, ChevronLeft, Lightbulb, Terminal, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Phase } from '@/types/phase';

interface TheoryPanelProps {
  phase: Phase | null;
  isOpen: boolean;
  onToggle: () => void;
  onRequestHint: () => void;
  hintsRemaining: number;
}

type Tab = 'concepts' | 'commands' | 'hints';

export function TheoryPanel({ phase, isOpen, onToggle, onRequestHint, hintsRemaining }: TheoryPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('concepts');

  if (!phase) {
    return (
      <div
        className={cn(
          'fixed right-0 top-20 h-[calc(100vh-5rem)] bg-background border-l border-border transition-all duration-300 z-40',
          isOpen ? 'w-80' : 'w-0 overflow-hidden'
        )}
      >
        <div className="p-4 text-center text-muted-foreground">
          Selecciona una fase para ver la teoría
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'concepts', label: 'Conceptos', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'commands', label: 'Comandos', icon: <Terminal className="w-4 h-4" /> },
    { id: 'hints', label: 'Pistas', icon: <Lightbulb className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Toggle button */}
      <Button
        variant="secondary"
        size="sm"
        onClick={onToggle}
        className={cn(
          'fixed right-0 top-24 z-50 rounded-r-none shadow-lg transition-all duration-300',
          isOpen && 'right-80'
        )}
      >
        {isOpen ? (
          <>
            <ChevronRight className="w-4 h-4 mr-1" />
            Cerrar
          </>
        ) : (
          <>
            <BookOpen className="w-4 h-4 mr-1" />
            Teoría
          </>
        )}
      </Button>

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-20 h-[calc(100vh-5rem)] bg-background border-l border-border transition-all duration-300 z-40 flex flex-col',
          isOpen ? 'w-80 translate-x-0' : 'w-80 translate-x-full'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Teoría y Ayuda</h3>
          </div>
          <p className="text-sm text-muted-foreground">{phase.title}</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-medium transition-colors',
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'concepts' && (
            <div className="space-y-4">
              {phase.theoryContent ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {/* Render markdown content - simplified version */}
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {phase.theoryContent}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay contenido teórico disponible para esta fase.</p>
                </div>
              )}

              <Card className="p-3 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4" />
                  Instrucciones
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {phase.instructions}
                </p>
              </Card>
            </div>
          )}

          {activeTab === 'commands' && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Comandos útiles</h4>
              
              <div className="space-y-2">
                <CodeExample
                  title="Ver configuración de interfaces"
                  command="show ip interface brief"
                />
                <CodeExample
                  title="Ver tabla de enrutamiento"
                  command="show ip route"
                />
                <CodeExample
                  title="Hacer ping"
                  command="ping [dirección-ip]"
                />
                <CodeExample
                  title="Ver tabla ARP"
                  command="show arp"
                />
              </div>

              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  <strong>Tip:</strong> Usa estos comandos en el simulador para verificar tu configuración antes de validar.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'hints' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Pistas disponibles</h4>
                <span className="text-xs text-muted-foreground">
                  {hintsRemaining} restantes
                </span>
              </div>

              {phase.hints.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {phase.hints.map((hint, index) => (
                      <Card
                        key={index}
                        className={cn(
                          'p-3 transition-all',
                          index < phase.hintsUsed
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200'
                            : index === phase.hintsUsed
                            ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200'
                            : 'opacity-50'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-muted-foreground shrink-0">
                            #{index + 1}
                          </span>
                          <p className={cn(
                            'text-sm',
                            index < phase.hintsUsed
                              ? 'text-green-800 dark:text-green-200'
                              : index === phase.hintsUsed
                              ? 'text-amber-800 dark:text-amber-200'
                              : 'text-muted-foreground'
                          )}>
                            {index < phase.hintsUsed || index === phase.hintsUsed
                              ? hint
                              : 'Disponible al solicitar pista...'}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {hintsRemaining > 0 && (
                    <Button
                      onClick={onRequestHint}
                      variant="outline"
                      className="w-full"
                      size="sm"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      Solicitar pista
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No hay pistas configuradas para esta fase.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CodeExample({ title, command }: { title: string; command: string }) {
  return (
    <div className="bg-muted rounded-lg p-3">
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <code className="text-sm font-mono text-primary bg-background px-2 py-1 rounded block">
        {command}
      </code>
    </div>
  );
}
