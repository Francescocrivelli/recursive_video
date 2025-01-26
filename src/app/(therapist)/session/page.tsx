'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { Navigation } from '@/components/Navigation';
import { SentimentAnalysis, WordCloud, SpeakingTimeChart } from '@/app/api/insights/route';

interface SessionState {
  transcription: string;
  summary: string;
  isProcessing: boolean;
  error: string | null;
  sentiment: string;
  wordCloudData: string[];
  speakingTime: { [participant: string]: number };
}

export default function SessionPage() {
  const [sessionState, setSessionState] = useState<SessionState>({
    transcription: '',
    summary: '',
    isProcessing: false,
    error: null,
    sentiment: '',
    wordCloudData: [],
    speakingTime: {},
  });
  
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

      setSessionState(prev => ({
        ...prev,
        transcription,
        isProcessing: true,
      }));

      const insightsResponse = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcription }),
      });

      if (!insightsResponse.ok) {
        const errorData = await insightsResponse.json();
        throw new Error(errorData.error || 'Insights generation failed');
      }

      const { summary, sentiment, wordCloudData, speakingTime } = await insightsResponse.json();

      setSessionState(prev => ({
        ...prev,
        summary,
        sentiment,
        wordCloudData,
        speakingTime,
        isProcessing: false,
      }));

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
        error: error instanceof Error 
          ? `Processing failed: ${error.message}`
          : 'Failed to process session recording'
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

      router.push('/select-therapy');
    } catch (error) {
      console.error('Error saving session:', error);
      setSessionState(prev => ({
        ...prev,
        error: 'Failed to save session',
      }));
    }
  };

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

            <SentimentAnalysis sentiment={sessionState.sentiment} />
            <WordCloud data={sessionState.wordCloudData} />
            <SpeakingTimeChart data={sessionState.speakingTime} />

            <Button
              onClick={handleFinishSession}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
              size="lg"
            >
              Finish Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}