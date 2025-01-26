import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface InsightsResponse {
  sentiment: string;
  wordCloudData: string[];
  speakingTime: { [participant: string]: number };
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Parallel processing of insights
    const [sentiment, wordCloudData, speakingTime] = await Promise.all([
      analyzeSentiment(text),
      generateWordCloud(text),
      analyzeSpeakingTime(text)
    ]);

    const response: InsightsResponse = {
      sentiment,
      wordCloudData,
      speakingTime
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

async function analyzeSentiment(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at analyzing therapy sessions. Provide a brief assessment of the emotional tone and therapeutic progress in the following session transcript. Keep your response to 1-2 sentences.'
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || 'Unable to analyze sentiment';
}

function generateWordCloud(text: string): string[] {
  // Remove common stop words and punctuation
  const stopWords = new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']);
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => !stopWords.has(word) && word.length > 2);

  // Count word frequencies
  const wordFreq = words.reduce((acc: {[key: string]: number}, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  // Sort by frequency and return top 20 words
  return Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([word]) => word);
}

async function analyzeSpeakingTime(text: string): Promise<{ [participant: string]: number }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'Analyze the following therapy session transcript and estimate the speaking time distribution between therapist and patient as percentages. Return only the percentages in format: {"Therapist": X, "Patient": Y}'
      },
      {
        role: 'user',
        content: text
      }
    ],
    temperature: 0.1,
  });

  try {
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in response');
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Error parsing speaking time analysis:', error);
    return { "Therapist": 50, "Patient": 50 }; // Fallback to equal distribution
  }
}