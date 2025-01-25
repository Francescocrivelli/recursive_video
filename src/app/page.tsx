'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return null;
}

/**
 * This is the main page component for a therapy session recording application.
 * It provides functionality to:
 * - Record audio using the AudioRecorder component
 * - Transcribe the recorded audio to text
 * - Translate the transcription
 * - Generate a summary of the therapy session
 * 
 * The component manages various states including:
 * - transcript: The text transcribed from audio
 * - translation: The translated version of the transcript
 * - summary: A therapeutic summary of the session
 * - processing states and error handling
 */

'use client';

import { useState } from 'react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Button } from '@/components/ui/button';

export default function TherapyPage() {
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');

  const handleAudioReady = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      // Handle transcription
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed');
      }

      const transcribeData = await transcribeResponse.json();
      setTranscript(transcribeData.text);
      
      // Handle translation
      const translateResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcribeData.text }),
      });
      
      if (!translateResponse.ok) {
        const errorData = await translateResponse.json();
        throw new Error(errorData.error || 'Translation failed');
      }
      
      const translateData = await translateResponse.json();
      setTranslation(translateData.translatedText);

      // Handle summary
      const summarizeResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: translateData.translatedText }),
      });
      
      if (!summarizeResponse.ok) {
        throw new Error('Summary generation failed');
      }
      
      const summarizeData = await summarizeResponse.json();
      setSummary(summarizeData.summary);

    } catch (error) {
      console.error('Processing failed:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setError('');
      await handleAudioReady(file);
    } catch (error) {
      console.error('File upload failed:', error);
      setError('Failed to process the audio file');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-4xl font-bold">Recursive Video</h1>
        <div className="flex gap-4">
          <Button variant="default">Login</Button>
          <Button variant="outline">Register</Button>
        </div>
      </div>

      <div className="container mx-auto space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <AudioRecorder 
              onAudioReady={handleAudioReady}
              isProcessing={isProcessing}
            />
            
            <div className="text-center">
              <p className="mb-2">Or upload an audio file</p>
              <input
                type="file"
                accept=".mp3,.wav,.m4a"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-violet-700
                  hover:file:bg-violet-100"
              />
              <p className="mt-2 text-sm text-gray-500">
                Accepted formats: MP3, WAV, M4A (max 25MB)
              </p>
            </div>
          </div>
          
          {isProcessing && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-blue-500">Processing audio...</span>
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {transcript && (
              <div className="space-y-2 col-span-full">
                <h2 className="text-xl font-semibold">Transcription</h2>
                <div className="p-4 bg-gray-900 rounded-lg shadow-inner min-h-[200px] whitespace-pre-wrap text-white">
                  {transcript}
                </div>
              </div>
            )}
            
            {translation && (
              <div className="space-y-2 col-span-full">
                <h2 className="text-xl font-semibold">English Translation</h2>
                <div className="p-4 bg-gray-900 rounded-lg shadow-inner min-h-[200px] whitespace-pre-wrap text-white">
                  {translation}
                </div>
              </div>
            )}
            
            {summary && (
              <div className="space-y-2 col-span-full">
                <h2 className="text-xl font-semibold">Summary</h2>
                <div className="p-4 bg-gray-900 rounded-lg shadow-inner min-h-[200px] whitespace-pre-wrap text-white">
                  {summary}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}