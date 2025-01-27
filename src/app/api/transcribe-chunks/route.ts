import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { mkdir } from 'fs/promises';

const execAsync = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Ensure temp directory exists
const ensureTempDir = async () => {
  const tempDir = join(process.cwd(), 'tmp');
  try {
    await mkdir(tempDir, { recursive: true });
    return tempDir;
  } catch (error) {
    console.error('Error creating temp directory:', error);
    throw error;
  }
};

export async function POST(request: Request) {
  let inputPath = '';
  let outputPath = '';

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Create and get temp directory
    const tempDir = await ensureTempDir();
    
    // Create unique filenames
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    inputPath = join(tempDir, `chunk-${timestamp}-${randomSuffix}.webm`);
    outputPath = join(tempDir, `chunk-${timestamp}-${randomSuffix}.wav`);

    // Save the incoming audio chunk
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    await writeFile(inputPath, buffer);

    // Convert WebM to WAV using FFmpeg with error handling
    try {
      await execAsync(`ffmpeg -i "${inputPath}" -acodec pcm_s16le -ar 16000 -ac 1 "${outputPath}"`);
    } catch (error) {
      console.error('FFmpeg conversion error:', error);
      throw new Error('Failed to convert audio format');
    }

    // Read the converted file
    const wavFile = await readFile(outputPath);

    // Create File object for OpenAI API
    const file = new File([wavFile], 'audio.wav', { type: 'audio/wav' });

    // Transcribe using Whisper API with retry logic
    let attempts = 0;
    const maxAttempts = 3;
    let lastError;

    while (attempts < maxAttempts) {
      try {
        const response = await openai.audio.transcriptions.create({
          file,
          model: 'whisper-1',
          language: 'en',
          response_format: 'json',
          temperature: 0.3,
          prompt: 'This is a therapy session transcription.',
        });

        return NextResponse.json({ text: response.text });
      } catch (error) {
        lastError = error;
        attempts++;
        if (attempts < maxAttempts) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio chunk',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  } finally {
    // Clean up files in finally block
    try {
      if (inputPath) await unlink(inputPath).catch(() => {});
      if (outputPath) await unlink(outputPath).catch(() => {});
    } catch (error) {
      console.error('Error cleaning up files:', error);
    }
  }
}