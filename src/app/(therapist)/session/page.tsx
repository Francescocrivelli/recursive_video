'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Mic, 
  Brain, 
  FileText, 
  AlertCircle, 
  Save,
  ArrowLeft 
} from 'lucide-react';

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

// Component that uses useSearchParams
function SessionContent() {
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

  const StepBadge = ({ icon, label, active, completed }: {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    completed: boolean;
  }) => (
    <div className="flex flex-col items-center">
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center mb-2
        ${active ? 'bg-blue-500 text-white' : 
          completed ? 'bg-green-500 text-white' : 
          'bg-gray-100 text-gray-400'}
      `}>
        {icon}
      </div>
      <span className={`text-sm ${active ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button 
                onClick={() => setShowConfirmDialog(true)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Therapy Session</h1>
            <div className="bg-white shadow-sm rounded-lg px-4 py-2">
              <p className="font-medium text-gray-900">{therapyType}</p>
              <p className="text-sm text-gray-500">Patient ID: {patientId}</p>
            </div>
          </div>

          <div className="flex justify-center space-x-8">
            <StepBadge
              icon={<Mic className="w-5 h-5" />}
              label="Recording"
              active={currentStep === 'recording'}
              completed={currentStep === 'processing' || currentStep === 'review'}
            />
            <StepBadge
              icon={<Brain className="w-5 h-5" />}
              label="Processing"
              active={currentStep === 'processing'}
              completed={currentStep === 'review'}
            />
            <StepBadge
              icon={<FileText className="w-5 h-5" />}
              label="Review"
              active={currentStep === 'review'}
              completed={false}
            />
          </div>
        </div>

        <div className="space-y-6">
          {currentStep === 'recording' && (
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Record Session</h2>
              <AudioRecorder
                onAudioReady={handleAudioReady}
                isProcessing={sessionState.isProcessing}
              />
            </div>
          )}

          {sessionState.isProcessing && (
            <div className="bg-white shadow-sm rounded-lg p-8 text-center">
              <div className="animate-pulse space-y-4">
                <Brain className="w-12 h-12 mx-auto text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900">Processing Session</h2>
                <p className="text-gray-500">
                  Analyzing audio and generating insights...
                </p>
              </div>
            </div>
          )}

          {sessionState.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{sessionState.error}</p>
              </div>
            </div>
          )}

          {currentStep === 'review' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-white shadow-sm rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
                    <div className="prose max-w-none">
                      {sessionState.summary}
                    </div>
                  </div>

                  {sessionState.insights && (
                    <div className="bg-white shadow-sm rounded-lg p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Insights</h2>
                      <div className="space-y-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h3 className="font-medium text-blue-900">Sentiment</h3>
                          <p className="mt-1 text-blue-800">{sessionState.insights.sentiment}</p>
                        </div>
                        
                        <div className="p-4 bg-purple-50 rounded-lg">
                          <h3 className="font-medium text-purple-900">Key Themes</h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {sessionState.insights.wordCloudData.map((word) => (
                              <span 
                                key={word}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Transcription</h2>
                  <div className="prose max-w-none">
                    {sessionState.transcription}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('recording')}
                >
                  Record Again
                </Button>
                <Button
                  onClick={handleFinishSession}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Session
                </Button>
              </div>
            </>
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
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
            >
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

// Main page component wrapped in Suspense
export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse space-y-4 text-center">
          <Brain className="w-12 h-12 mx-auto text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Loading Session...</h2>
        </div>
      </div>
    }>
      <SessionContent />
    </Suspense>
  );
}