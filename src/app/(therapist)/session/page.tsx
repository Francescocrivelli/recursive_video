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
  isRecording: boolean;
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
    isRecording: false,
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
    setSessionState(prev => ({ ...prev, isProcessing: true, error: null, isRecording: false }));
    
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

      const transcribeData = await transcribeResponse.json();
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
      console.error('Session processing error:', error);
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
        sessionId, // Unique identifier for the session
        patientId, // Reference to the patient
        doctorId: 'therapistId', // Replace with actual therapist ID
        therapyType, // Type of therapy conducted
        date: new Date().toISOString(), // Session date & time
        transcription: sessionState.transcription, // Full transcription of the session
        summary: sessionState.summary, // AI-generated summary of the session
        sentiment: sessionState.sentiment, // Sentiment analysis result
        wordCloudData: sessionState.wordCloudData, // List of frequently used words
        speakingTime: sessionState.speakingTime, // Speaking time breakdown
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
    <div className="min-h-screen p-8 bg-gradient-to-r from-purple-200 to-blue-200">
      <Navigation onBack={() => router.push('/select-therapy')} />
      <div className="max-w-4xl mx-auto space-y-8 bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Therapy Session</h1>
          <div className="text-sm text-gray-600">
            <p>Therapy: {therapyType}</p>
            <p>Patient ID: {patientId}</p>
          </div>
        </div>

        <AudioRecorder
          onAudioReady={handleAudioReady}
          isProcessing={sessionState.isProcessing}
          onStartRecording={() => setSessionState(prev => ({ ...prev, isRecording: true }))}
          onStopRecording={() => setSessionState(prev => ({ ...prev, isRecording: false }))}
        />

        {sessionState.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {sessionState.error}
          </div>
        )}

        {sessionState.isProcessing && (
          <div className="text-center py-4">
            <div className="animate-pulse text-gray-600">
              <svg className="w-6 h-6 mx-auto animate-spin" viewBox="0 0 24 24">
                <circle className="text-gray-300" cx="12" cy="12" r="10" fill="none" strokeWidth="4" />
                <path className="text-blue-500" fill="none" d="M4 12a8 8 0 1 1 16 0 8 8 0 0 1-16 0" />
              </svg>
              Processing audio...
            </div>
          </div>
        )}

        {sessionState.transcription && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Transcription</h2>
            <div className="bg-gray-50 p-4 rounded-lg shadow-md whitespace-pre-wrap">
              {sessionState.transcription}
            </div>
          </div>
        )}

        {sessionState.summary && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Session Summary</h2>
            <div className="bg-gray-50 p-4 rounded-lg shadow-md">
              {sessionState.summary}
            </div>

            <SentimentAnalysis sentiment={sessionState.sentiment} />
            <WordCloud data={sessionState.wordCloudData} />
            <SpeakingTimeChart data={sessionState.speakingTime} />

            <Button
              onClick={handleFinishSession}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 transition duration-300 ease-in-out shadow-lg"
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