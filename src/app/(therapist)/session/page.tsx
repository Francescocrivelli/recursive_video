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
  error: string | null;
  insights: SessionInsights | null;
}

export default function SessionPage() {
  const [sessionState, setSessionState] = useState<SessionState>({
    transcription: '',
    summary: '',
    isProcessing: false,
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
    setCurrentStep('processing');
    setSessionState(prev => ({ ...prev, isProcessing: true, error: null }));
    
    try {
      // Audio processing logic...
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('patientId', patientId || 'unknown');
      formData.append('therapyType', therapyType || 'unknown');

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
      }
      
      const transcribeData = await transcribeResponse.json();
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
      const sessionData = {
        patientId,
        therapyType,
        date: new Date().toISOString(),
        transcription: sessionState.transcription,
        summary: sessionState.summary,
        ...(sessionState.insights && {
          sentiment: sessionState.insights.sentiment,
          wordCloudData: sessionState.insights.wordCloudData,
          speakingTime: sessionState.insights.speakingTime,
        })
      };

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
    <div className="min-h-screen bg-background">
      <Navigation onBack={() => setShowConfirmDialog(true)} />
      
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold">Therapy Session</h1>
            <div className="text-sm bg-gray-100 p-3 rounded-lg">
              <p className="font-medium">{therapyType}</p>
              <p className="text-gray-600">Patient ID: {patientId}</p>
            </div>
          </div>
          
          {renderStepIndicator()}
        </div>

        <div className="space-y-8">
          {currentStep === 'recording' && (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-xl font-semibold mb-4">Record Session</h2>
              <AudioRecorder
                onAudioReady={handleAudioReady}
                isProcessing={sessionState.isProcessing}
              />
            </div>
          )}

          {sessionState.isProcessing && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="animate-pulse space-y-4">
                <Brain className="w-12 h-12 mx-auto text-blue-500" />
                <h2 className="text-xl font-semibold">Processing Session</h2>
                <p className="text-gray-600">
                  Analyzing audio and generating insights...
                </p>
              </div>
            </div>
          )}

          {sessionState.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start space-x-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900">Processing Error</h3>
                <p className="text-red-700">{sessionState.error}</p>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold mb-4">Summary</h2>
                  <div className="prose max-w-none">
                    {sessionState.summary}
                  </div>
                </div>

                {sessionState.insights && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">Session Insights</h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">Overall Sentiment</h3>
                        <p className="text-blue-800">{sessionState.insights.sentiment}</p>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="font-medium text-purple-900 mb-2">Key Themes</h3>
                        <div className="flex flex-wrap gap-2">
                          {sessionState.insights.wordCloudData.slice(0, 5).map((word) => (
                            <span key={word} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                              {word}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-900 mb-2">Speaking Time</h3>
                        <div className="space-y-2">
                          {Object.entries(sessionState.insights.speakingTime).map(([role, time]) => (
                            <div key={role} className="flex items-center">
                              <span className="w-24 text-green-800">{role}:</span>
                              <div className="flex-1 h-2 bg-green-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${time}%` }}
                                />
                              </div>
                              <span className="ml-2 text-green-800 text-sm">{time}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Transcription</h2>
                <div className="prose max-w-none">
                  {sessionState.transcription}
                </div>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep('recording')}
              >
                Record Again
              </Button>
              <Button
                onClick={handleFinishSession}
                className="min-w-[200px]"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Session
              </Button>
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
              variant="destructive"
              onClick={() => router.push('/select-therapy')}
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