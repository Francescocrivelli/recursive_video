'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { Navigation } from '@/components/Navigation';
import { Mic, Clock, AlertCircle, FileText, Brain, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SessionInsights {
  sentiment: string;
  wordCloudData: string[];
  speakingTime: { [participant: string]: number };
}

interface SessionState {
  transcription: string;
  summary: string;
  isProcessing: boolean;
  isRecording: boolean;
  error: string | null;
  insights: SessionInsights | null;
}

export default function SessionPage() {
  const [sessionState, setSessionState] = useState<SessionState>({
    transcription: '',
    summary: '',
    isProcessing: false,
    isRecording: false,
    error: null,
    insights: null
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState<'recording' | 'processing' | 'review'>('recording');

  const searchParams = useSearchParams();
  const router = useRouter();

  const therapyType = searchParams.get('therapy');
  const patientId = searchParams.get('patient');

  useEffect(() => {
    if (!therapyType || !patientId) {
      router.push('/select-therapy');
    }
  }, [therapyType, patientId, router]);

  const handleAudioReady = async (audioBlob: Blob) => {
    setSessionState(prev => ({ ...prev, isProcessing: true, error: null }));
    let retryCount = 0;
    const maxRetries = 3;

    const attemptTranscription = async () => {
      try {
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('patientId', patientId || 'unknown');
        formData.append('therapyType', therapyType || 'unknown');

        const transcribeResponse = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (!transcribeResponse.ok) {
          const errorData = await transcribeResponse.json();
          throw new Error(errorData.error || 'Transcription failed');
        }

        return await transcribeResponse.json();
      } catch (error) {
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
          return attemptTranscription();
        }
        throw error;
      }
    };

    try {
      const transcribeData = await attemptTranscription();
      const transcription = transcribeData.text;
      
      const [summaryResponse, insightsResponse] = await Promise.all([
        fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcription }),
        }),
        fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcription }),
        })
      ]);

      const { summary } = await summaryResponse.json();
      let insights = null;

      if (insightsResponse.ok) {
        insights = await insightsResponse.json();
      }

      setSessionState(prev => ({
        ...prev,
        transcription,
        summary,
        insights,
        isProcessing: false,
      }));
      
      setCurrentStep('review');
    } catch (error) {
      console.error('Session processing error:', {
        context: 'SessionPage - handleAudioReady',
        error,
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? {
          message: error.message,
          stack: error.stack
        } : 'Unknown error'
      });

      setSessionState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Failed to process session'
      }));
    }
  };

  const handleFinishSession = async () => {
    if (!sessionState.summary || !therapyType || !patientId) return;

    try {
      const sessionId = uuidv4();
      await setDoc(doc(db, 'sessions', sessionId), {
        patientId,
        therapyType,
        date: new Date().toISOString(),
        transcription: sessionState.transcription,
        summary: sessionState.summary,
        sentiment: sessionState.sentiment,
        wordCloudData: sessionState.wordCloudData,
        speakingTime: sessionState.speakingTime,
      });

      await setDoc(doc(db, 'sessions', sessionId), sessionData);
      router.push('/select-therapy');
    } catch (error) {
      setSessionState(prev => ({
        ...prev,
        error: 'Failed to save session',
      }));
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-4">
        <StepBadge
          icon={<Mic className="w-4 h-4" />}
          label="Recording"
          active={currentStep === 'recording'}
          completed={currentStep === 'processing' || currentStep === 'review'}
        />
        <div className="h-px w-8 bg-gray-200" />
        <StepBadge
          icon={<Brain className="w-4 h-4" />}
          label="Processing"
          active={currentStep === 'processing'}
          completed={currentStep === 'review'}
        />
        <div className="h-px w-8 bg-gray-200" />
        <StepBadge
          icon={<FileText className="w-4 h-4" />}
          label="Review"
          active={currentStep === 'review'}
          completed={false}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8 bg-gradient-to-r from-gray-100 to-gray-200">
      <Navigation onBack={() => router.push('/select-therapy')}/>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Therapy Session</h1>
          <div className="text-sm">
            <p>Therapy: {therapyType}</p>
            <p>Patient ID: {patientId}</p>
          </div>
          
          {renderStepIndicator()}
        </div>

        <AudioRecorder
          onAudioReady={handleAudioReady}
          isProcessing={sessionState.isProcessing}
        />

        {sessionState.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {sessionState.error}
          </div>
        )}

        {sessionState.isProcessing && (
          <div className="text-center py-4">
            <div className="animate-pulse text-gray-600">
              Processing audio...
            </div>
          </div>
        )}

        {sessionState.transcription && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Transcription</h2>
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
              {sessionState.transcription}
            </div>
          </div>
        )}

        {sessionState.summary && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Session Summary</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              {sessionState.summary}
            </div>
          )}
        </div>
      </main>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Session?</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to leave? Any unsaved progress will be lost.
          </p>
          <div className="flex justify-end space-x-4 mt-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFinishSession}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
              size="lg"
            >
              Leave Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StepBadgeProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  completed: boolean;
}

function StepBadge({ icon, label, active, completed }: StepBadgeProps) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`
          w-10 h-10 rounded-full flex items-center justify-center mb-2
          ${active ? 'bg-blue-500 text-white' : 
            completed ? 'bg-green-500 text-white' : 
            'bg-gray-100 text-gray-400'}
        `}
      >
        {icon}
      </div>
      <span className={`text-sm ${active ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}