import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a translator. Translate the following text to English. Maintain the original meaning and tone. If the text is already in English, simply return it unchanged."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
    });

    const translatedText = response.choices[0]?.message?.content;

    if (!translatedText) {
      throw new Error('No translation generated');
    }

    return NextResponse.json({ translatedText });
  } catch (error: unknown) {
    console.error('Translation error:', error);
    
    if (error && typeof error === 'object') {
      if ('status' in error) {
        if (error.status === 401) {
          return NextResponse.json(
            { error: 'Authentication failed. Check API key configuration.' },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(
        { 
          error: 'Translation failed',
          details: (error as { message?: string }).message || 'Unknown error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unknown error occurred' },
      { status: 500 }
    );
  }
}