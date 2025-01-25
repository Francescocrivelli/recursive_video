import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { db } from '@/lib/firebase'; // Import Firestore database
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const execPromise = promisify(exec);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Map MIME type to file extension
 * @param mimeType The MIME type of the audio file
 * @returns Corresponding file extension
 */
function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/mp4': '.mp4',
    'audio/x-m4a': '.m4a',
    'audio/mp3': '.mp3',
  };

  const extension = mimeToExt[mimeType];
  if (!extension) {
    throw new Error(`Unsupported audio type: ${mimeType}`);
  }

  return extension;
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

  const command = `ffmpeg -i "${filePath}" -f segment -segment_time ${chunkDuration} -c copy "${outputPattern}"`;
  await execPromise(command);

  // Return paths to the generated chunks
  return fs
    .readdirSync(outputDir)
    .filter((file) => file.startsWith('chunk_'))
    .map((file) => path.join(outputDir, file));
}

export async function POST(request: Request) {
  let tempFilePath: string | null = null;
  let chunks: string[] = [];

  try {

    const {patientId, therapyType } = await request.json(); // Expect patientId and therapyType

    const formData = await request.formData();
    const file = formData.get('audio') as File;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validate file type
    const validAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/mp3'];
    if (!validAudioTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type: ${file.type}. Supported types are: ${validAudioTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Convert the File to a local file path
    tempFilePath = path.join('/tmp', file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempFilePath, buffer);

    // Split the file into chunks
    chunks = await splitAudio(tempFilePath, file.type);

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
    
    if (!finalTranscript) {
      return NextResponse.json({ error: 'Transcription failed' }, { status: 400 });
    }

    // Store the transcription in Firestore
    const sessionId = uuidv4(); // Generate a unique session ID
    await setDoc(doc(db, 'sessions', sessionId), {
      patientId,
      therapyType,
      date: new Date().toISOString(),
      finalTranscript,
    });

    // Clean up temporary files
    fs.unlinkSync(tempFilePath);
    chunks.forEach((chunk) => fs.unlinkSync(chunk));

    return NextResponse.json({ text: finalTranscript.trim() });
  } catch (error: unknown) {
    // Clean up on error
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    if (chunks.length) {
      chunks.forEach((chunk) => {
        if (fs.existsSync(chunk)) {
          fs.unlinkSync(chunk);
        }
      });
    }

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('Unknown error:', error);
    return NextResponse.json({ error: 'An unknown error occurred' }, { status: 500 });
  }
}
