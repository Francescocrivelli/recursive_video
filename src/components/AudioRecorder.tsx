'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { useReactMediaRecorder } from 'react-media-recorder';

interface AudioRecorderProps {
  onTranscriptionComplete: (transcript: string) => void;
}

export function AudioRecorder({ onTranscriptionComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);

      recorder.ondataavailable = (event) => {
        setAudioChunks(current => [...current, event.data]);
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorder) return;
    
    mediaRecorder.stop();
    setIsRecording(false);
    
    const tracks = mediaRecorder.stream.getTracks();
    tracks.forEach(track => track.stop());

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      await handleAudioUpload(audioBlob);
    };
  };

  const handleAudioUpload = async (blob: Blob) => {
    setIsProcessing(true);
    const formData = new FormData();
    formData.append('audio', blob);

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      onTranscriptionComplete(data.transcript);
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleAudioUpload(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center justify-center">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          variant={isRecording ? "destructive" : "default"}
          disabled={isProcessing}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>

      </div>

      {isProcessing && (
        <div className="text-center text-blue-500">
          Processing audio...
        </div>
      )}
    </div>
  );
}