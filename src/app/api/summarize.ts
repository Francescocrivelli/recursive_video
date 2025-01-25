import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/firebase'; // Import Firestore database
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid'; // Import UUID library

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text, patientId, therapyType } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a therapist summarizing a therapy session such that when you or the client can read it anytime and understood what happened and further steps. Here is the dialogue:',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      throw new Error('No summary generated');
    }

    // Store the summary in Firestore
    const sessionId = uuidv4(); // Generate a unique session ID
    await setDoc(doc(db, 'sessions', sessionId), {
      patientId,
      therapyType,
      date: new Date().toISOString(),
      summary,
    });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json({ error: 'Summarization failed' }, { status: 500 });
  }
}