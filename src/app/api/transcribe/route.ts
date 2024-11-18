import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Map MIME type to file extension
 * @param mimeType The MIME type of the audio file
 * @returns Corresponding file extension
 */
function getFileExtension(mimeType: string): string {
  switch (mimeType) {
    case 'audio/mpeg':
      return '.mp3';
    case 'audio/wav':
      return '.wav';
    case 'audio/mp4':
      return '.mp4';
    case 'audio/x-m4a':
      return '.m4a';
    case 'audio/mp3':
      return '.mp3';
    default:
      throw new Error(`Unsupported audio type: ${mimeType}`);
  }
}

/**
 * Split the audio file into chunks of a specified duration.
 * @param filePath Path to the audio file
 * @param mimeType MIME type of the audio file
 * @param chunkDuration Duration of each chunk in seconds
 * @returns Array of paths to the chunk files
 */
async function splitAudio(filePath: string, mimeType: string, chunkDuration: number = 600): Promise<string[]> {
  const outputDir = path.join(path.dirname(filePath), 'chunks');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  const fileExtension = getFileExtension(mimeType);
  const outputPattern = path.join(outputDir, `chunk_%03d${fileExtension}`);

  // Properly escape the file paths
  const command = `ffmpeg -i "${filePath}" -f segment -segment_time ${chunkDuration} -c copy "${outputPattern}"`;
  await execPromise(command);

  // Return paths to the generated chunks
  const chunks = fs.readdirSync(outputDir)
    .filter((file) => file.startsWith('chunk_'))
    .map((file) => path.join(outputDir, file));

  return chunks;
}


export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file type
    const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/mp3'];
    if (!validAudioTypes.includes(file.type)) {
      return NextResponse.json({
        error: `Invalid file type: ${file.type}. Supported types are: ${validAudioTypes.join(', ')}`,
      }, { status: 400 });
    }

    // Convert the File to a local file path
    const tempFilePath = path.join('/tmp', file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempFilePath, buffer);

    // Split the file into chunks
    const chunks = await splitAudio(tempFilePath, file.type);

    let finalTranscript = '';
    for (const chunk of chunks) {
      // Send each chunk to Whisper API
      const chunkBuffer = fs.readFileSync(chunk);
      const response = await openai.audio.transcriptions.create({
        file: new File([chunkBuffer], path.basename(chunk), { type: file.type }),
        model: 'whisper-1',
        prompt: 'Transcribe the following audio segment accurately, focusing on clarity and context.',
      });

      finalTranscript += response.text + ' ';
    }

    // Clean up temporary files
    fs.unlinkSync(tempFilePath);
    for (const chunk of chunks) {
      fs.unlinkSync(chunk);
    }

    return NextResponse.json({ text: finalTranscript.trim() });
  } catch (error: unknown) {
    console.error('Transcription error:', error);
  
    if (typeof error === 'object' && error !== null) {
      if ('status' in error && typeof (error as any).status === 'number') {
        // Safely access error.status
        return NextResponse.json(
          { error: `Unexpected API error`, status: (error as any).status },
          { status: (error as any).status }
        );
      }
  
      if ('message' in error) {
        return NextResponse.json(
          { error: `Invalid request: ${(error as { message: string }).message}` },
          { status: 400 }
        );
      }
    }
  
    // Fallback for unknown error types
    return NextResponse.json(
      { error: 'An unknown error occurred' },
      { status: 500 }
    );
  }
}