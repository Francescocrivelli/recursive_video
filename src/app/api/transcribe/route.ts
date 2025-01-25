import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

console.log('API Key present:', !!process.env.OPENAI_API_KEY);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const patientId = formData.get('patientId') as string;
    const therapyType = formData.get('therapyType') as string;

    console.log('Received file type:', file?.type);
    console.log('File size:', file?.size);
    console.log('Patient ID:', patientId);
    console.log('Therapy type:', therapyType);

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert File to Blob and then to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Send to Whisper API
    try {
      const response = await openai.audio.transcriptions.create({
        file: new File([buffer], 'audio.webm', { type: file.type }),
        model: 'whisper-1',
      });

      return NextResponse.json({ text: response.text.trim() });
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError);
      return NextResponse.json({ 
        error: 'OpenAI API Error', 
        details: openaiError instanceof Error ? openaiError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: 'Transcription failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}