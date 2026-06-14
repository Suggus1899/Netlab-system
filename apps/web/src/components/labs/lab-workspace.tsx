'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/components/ui/toast';
import { PhaseTimeline, PhaseCard, TheoryPanel } from '@/components/phases';
import { usePhaseStore } from '@/lib/store/phase-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Star, Trophy, RotateCcw } from 'lucide-react';
import type { Phase } from '@/types/phase';

export function LabWorkspace() {
  const params = useParams();
  const labId = params.id as string;
  
  const [theoryPanelOpen, setTheoryPanelOpen] = useState(false);
  
  const {
    phases,
    stats,
    currentPhase,
    loading,
    error,
    loadPhases,
    startPhase,
    validateAttempt,
    getHint,
    resetPhase,
    setCurrentPhase,
  } = usePhaseStore();

  // Load phases on mount
  useEffect(() => {
    if (labId) {
      loadPhases(labId);
    }
  }, [labId, loadPhases]);

  const { toast } = useToast();

  // Handle errors
  useEffect(() => {
    if (error) {
      toast(error, 'error');
    }
  }, [error, toast]);

  // Handle phase selection
  const handlePhaseClick = (phase: Phase) => {
    setCurrentPhase(phase);
    setTheoryPanelOpen(true);
  };

  // Handle start phase
  const handleStartPhase = async () => {
    if (!currentPhase) return;
    await startPhase(currentPhase.id);
    toast('Fase iniciada', 'success');
  };

  // Handle validate attempt
  const handleValidateAttempt = async () => {
    if (!currentPhase) return;
    
    // TODO: Get actual topology state from simulator
    const attemptData = {
      topologyState: {},
      actions: [],
    };
    
    const result = await validateAttempt(currentPhase.id, attemptData);
    
    if (result) {
      if (result.success) {
        toast(`¡Fase completada! Puntuación: ${result.score} pts`, 'success');
        if (result.unlockedPhases && result.unlockedPhases.length > 0) {
          toast(`Has desbloqueado ${result.unlockedPhases.length} nueva(s) fase(s)`, 'info');
        }
      } else if (result.status === 'FAILED') {
        toast(result.feedback, 'error');
      } else {
        toast(result.feedback, 'info');
      }
    }
  };

  // Handle request hint
  const handleRequestHint = async () => {
    if (!currentPhase) return;
    const result = await getHint(currentPhase.id);
    if (result) {
      toast(`Pista: ${result.hint}`, 'info');
    }
  };

  // Handle reset phase
  const handleResetPhase = async () => {
    if (!currentPhase) return;
    if (confirm('¿Estás seguro de reiniciar esta fase? Perderás todo el progreso.')) {
      await resetPhase(currentPhase.id);
      toast('Fase reiniciada. Puedes comenzar de nuevo', 'success');
    }
  };

  if (loading && phases.length === 0) {
    return <LabWorkspaceSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                Laboratorio con Fases
                {stats && (
                  <Badge variant="outline" className="font-normal">
                    {stats.mandatoryCompleted}/{stats.mandatoryTotal} fases
                  </Badge>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Completa las fases obligatorias para terminar el lab. Las fases bonus te dan puntos extra.
              </p>
            </div>
            
            {stats && (
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <div className="font-semibold text-lg">{stats.totalScore}</div>
                  <div className="text-muted-foreground">pts totales</div>
                </div>
                {stats.bonusScore > 0 && (
                  <>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-right">
                      <div className="font-semibold text-lg text-yellow-600 flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {stats.bonusScore}
                      </div>
                      <div className="text-muted-foreground">bonus</div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Progress summary */}
          {stats && (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>{stats.mandatoryCompleted} obligatorias completadas</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500" />
                <span>{stats.optionalCompleted}/{stats.optionalTotal} bonus completadas</span>
              </div>
              {stats.totalScore >= stats.maxPossibleScore * 0.8 && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Trophy className="w-3 h-3" />
                  <span>¡Excelente desempeño!</span>
                </div>
              )}
            </div>
          )}

          {/* Phase Timeline */}
          <PhaseTimeline
            phases={phases}
            currentPhaseId={currentPhase?.id}
            onPhaseClick={handlePhaseClick}
          />
        </CardContent>
      </Card>

      {/* Current Phase Detail */}
      {currentPhase ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PhaseCard
              phase={currentPhase}
              onStart={handleStartPhase}
              onValidate={handleValidateAttempt}
              onReset={handleResetPhase}
              isCurrent
            />
          </div>

          {/* Simulator placeholder */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Simulador</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Simulador integrado aquí</p>
                  <p className="text-xs">Configura la red según las instrucciones</p>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={handleValidateAttempt}
                disabled={currentPhase.status === 'LOCKED' || currentPhase.status === 'COMPLETED'}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Validar configuración
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Selecciona una fase</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Haz clic en una fase del timeline de arriba para ver los detalles, 
              instrucciones y comenzar a trabajar en ella.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Theory Panel */}
      <TheoryPanel
        phase={currentPhase}
        isOpen={theoryPanelOpen}
        onToggle={() => setTheoryPanelOpen(!theoryPanelOpen)}
        onRequestHint={handleRequestHint}
        hintsRemaining={currentPhase ? currentPhase.hints.length - currentPhase.hintsUsed : 0}
      />
    </div>
  );
}

function LabWorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-full max-w-md" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-32" />
            ))}
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}
