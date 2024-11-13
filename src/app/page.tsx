'use client';

import { useState } from 'react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Button } from '@/components/ui/button';

export default function TherapyPage() {
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const processAudio = async (audioData: File | Blob) => {
    setIsProcessing(true);
    try {
      // Handle transcription
      const formData = new FormData();
      formData.append('audio', audioData);
      
      const transcriptResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      const transcriptData = await transcriptResponse.json();
      setTranscript(transcriptData.transcript);

      // Handle summarization
      const summaryResponse = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcriptData.transcript }),
      });
      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary);
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'audio/mpeg') {
      processAudio(file);
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
            <AudioRecorder onTranscriptionComplete={(blob) => processAudio(blob)} />
            
            <div className="text-center">
              <p className="mb-2">Or upload an MP3 file</p>
              <input
                type="file"
                accept="audio/mpeg"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-violet-50 file:text-violet-700
                  hover:file:bg-violet-100"
              />
            </div>
          </div>
          
          {isProcessing && (
            <div className="text-blue-500">Processing audio...</div>
          )}

          {transcript && (
            <>
              <h2 className="text-xl">Transcription</h2>
              <div className="p-4 bg-gray-100 rounded min-h-[100px]">{transcript}</div>
            </>
          )}
          
          {summary && (
            <>
              <h2 className="text-xl">Summary</h2>
              <div className="p-4 bg-gray-100 rounded min-h-[100px]">{summary}</div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}