import { config } from 'dotenv';
import { GoogleGenAI } from '@google/genai';

config({ path: '.env.local' });

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.API_KEY;

if (!apiKey) {
  console.error('Missing Gemini API key (VITE_GEMINI_API_KEY / GEMINI_API_KEY / API_KEY).');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const sample = process.argv[2] || 'Sample text to inspect embedding dimension.';

try {
  const { embeddings } = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: [sample],
  });

  const values = embeddings?.[0]?.values;
  if (!values) {
    console.error('No embedding values returned.');
    process.exit(1);
  }

  console.log('Embedding dimension:', values.length);
  console.log('Array.isArray:', Array.isArray(values));
  console.log('Constructor:', values?.constructor?.name);
  console.log('First 8 values:', values.slice(0, 8));
} catch (error) {
  console.error('Failed to fetch embedding:', error);
  process.exit(1);
}
