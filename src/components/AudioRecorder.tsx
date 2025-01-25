'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob) => void;
  isProcessing: boolean;
}

export function AudioRecorder({ onAudioReady, isProcessing }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);

      recorder.ondataavailable = (event) => {
        setAudioChunks((current) => [...current, event.data]);
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
    tracks.forEach((track) => track.stop());

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      onAudioReady(audioBlob);
    };
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
    </div>
  );
}
