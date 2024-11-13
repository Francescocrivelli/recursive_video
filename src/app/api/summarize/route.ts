import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are another doctor summarizing the key points of the therapy session in a different way but with the same formats. Here is the dialogue:',
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

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json({ error: 'Summarization failed' }, { status: 500 });
  }
}
