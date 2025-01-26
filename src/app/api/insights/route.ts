// import type { NextApiRequest, NextApiResponse } from 'next';
// import { NextResponse } from 'next/server';
// import { OpenAI } from 'openai';

// // Check if the API key is set
// if (!process.env.OPENAI_API_KEY) {
//   throw new Error('OPENAI_API_KEY is not set');
// }

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// console.log('Summarize API Key present:', !!process.env.OPENAI_API_KEY);

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   try {
//     const { text } = req.body;

//     if (!text) {
//       return res.status(400).json({ error: 'Text is required' });
//     }

//     // Perform sentiment analysis
//     const sentiment = await analyzeSentiment(text);

//     // Generate word cloud data
//     const wordCloudData = generateWordCloud(text);

//     // Calculate speaking time breakdown
//     const speakingTime = calculateSpeakingTime(text);

//     // Return the insights
//     res.status(200).json({ summary: 'Sample summary', sentiment, wordCloudData, speakingTime });
//   } catch (error) {
//     console.error('Error generating insights:', error);
//     res.status(500).json({ error: 'Failed to generate insights' });
//   }
// }

// async function analyzeSentiment(text: string): Promise<string> {
//   const response = await openai.completions.create({
//     model: 'text-davinci-003',
//     prompt: `Analyze the sentiment of the following text: ${text}`,
//     max_tokens: 60,
//   });

//   return response.choices[0].text.trim();
// }

// function generateWordCloud(text: string): string[] {
//   const words = text.split(/\s+/);
//   const frequencyMap: { [word: string]: number } = {};

//   words.forEach(word => {
//     word = word.toLowerCase();
//     frequencyMap[word] = (frequencyMap[word] || 0) + 1;
//   });

//   return Object.entries(frequencyMap)
//     .sort(([, a], [, b]) => b - a)
//     .slice(0, 20)
//     .map(([word]) => word);
// }

// function calculateSpeakingTime(text: string): { [participant: string]: number } {
//   // Mock implementation for speaking time breakdown
//   return {
//     'Therapist': 60,
//     'Patient': 40,
//   };
// }