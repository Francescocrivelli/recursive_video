'use client';

import { useState } from 'react';
import { Button } from './ui/button';

interface AudioRecorderProps {
  onAudioReady: (audioBlob: Blob) => void;
  isProcessing: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}

export function AudioRecorder({ 
  onAudioReady, 
  isProcessing, 
  onStartRecording, 
  onStopRecording 
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const checkMicrophoneSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Your browser does not support audio recording.');
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    if (!checkMicrophoneSupport()) return;
    
    try {
      onStartRecording?.();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      });
      
      setRecordingTime(0);
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);

      setMediaRecorder(recorder);
      setAudioChunks([]);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((current) => [...current, event.data]);
        }
      };

      // Request data every 250ms to ensure we capture everything
      recorder.start(250);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.error('Microphone access was denied. Please allow microphone access in your browser settings.');
      } else {
        console.error('An error occurred while trying to access the microphone.');
      }
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorder) return;

    onStopRecording?.();
    mediaRecorder.stop();
    setIsRecording(false);

    const tracks = mediaRecorder.stream.getTracks();
    tracks.forEach((track) => track.stop());

    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);
    
    // Log audio size information
    const sizeInBytes = audioBlob.size;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    console.log(`Audio size: ${sizeInBytes} bytes (${sizeInMB} MB)`);
    
    onAudioReady(audioBlob);
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = 'recording.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
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
      <div className="recording-timer">
        {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
      </div>
      {audioUrl && (
        <div className="space-y-2">
          <audio controls src={audioUrl} className="w-full" />
          <Button onClick={handleDownload} variant="outline" className="w-full">
            Download Recording
          </Button>
        </div>
      )}
    </div>
  );
}