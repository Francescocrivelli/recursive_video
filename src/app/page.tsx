'use client';

import { useState, useEffect } from 'react';
import { AudioRecorder } from '@/components/AudioRecorder';
import { Button } from '@/components/ui/button';
import { signIn } from "next-auth/react";
import { useRouter } from 'next/router';

export default function TherapyPage() {
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const router = useRouter();

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("email", { email, password, redirect: false });

    if (result?.error) {
      setError(result.error);
    } else {
      console.log("Login successful!");

      // If the user is newly registered, call the verification endpoint
      if (verificationToken) {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: verificationToken }),
        });

        const data = await response.json();
        if (response.ok) {
          console.log(data.message); // User registered successfully
        } else {
          console.error(data.error); // Handle error
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const { token } = router.query; // Extract token from URL
    if (token) {
      setVerificationToken(token as string); // Set the verification token
    }
  }, [router.query]);

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-4xl font-bold">Recursive Video</h1>
        <div className="flex gap-4">
          <form onSubmit={handleLogin} className="flex flex-col">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="border p-2 rounded"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="border p-2 rounded"
            />
            {error && <p className="text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className={`bg-blue-500 text-white rounded p-2 w-full ${loading ? "opacity-50" : ""}`}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
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
        </div>
      </div>
    </main>
  );
}