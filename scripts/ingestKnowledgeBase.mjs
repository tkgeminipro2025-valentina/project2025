#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { parse as parseCsv } from 'csv-parse/sync';
import xlsx from 'xlsx';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadEnv = () => {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
};

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  process.exit(1);
}

if (!GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY environment variable.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const chunkText = (text, chunkSize = 1200, overlap = 150) => {
  const sanitized = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  if (!sanitized) return [];
  if (sanitized.length <= chunkSize) return [sanitized];

  const chunks = [];
  let start = 0;
  while (start < sanitized.length) {
    const end = Math.min(start + chunkSize, sanitized.length);
    chunks.push(sanitized.slice(start, end).trim());
    if (end === sanitized.length) {
      break;
    }
    const nextStart = end - overlap;
    start = nextStart > start ? nextStart : end;
  }
  return chunks.filter(Boolean);
};

const extractTextFromFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  switch (ext) {
    case '.pdf': {
      const data = await pdfParse(buffer);
      return data.text;
    }
    case '.docx': {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    }
    case '.txt':
    case '.md': {
      return buffer.toString('utf8');
    }
    case '.csv': {
      const parsed = parseCsv(buffer.toString('utf8'), { columns: false, skip_empty_lines: true });
      return parsed.map((row) => row.join(' | ')).join('\n');
    }
    case '.xls':
    case '.xlsx': {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const sheets = workbook.SheetNames.map((name) => {
        const sheet = workbook.Sheets[name];
        return xlsx.utils.sheet_to_json(sheet, { header: 1 })
          .map((row) => (Array.isArray(row) ? row.join(' | ') : String(row)))
          .join('\n');
      });
      return sheets.join('\n');
    }
    default:
      console.warn(`Unsupported file extension "${ext}". The script will attempt to read as UTF-8 text.`);
      return buffer.toString('utf8');
  }
};

const generateEmbedding = async (text) => {
  const response = await genAI.models.embedContent({
    model: 'text-embedding-004',
    contents: [text],
  });
  if (!response?.embeddings?.[0]?.values) {
    throw new Error('Failed to generate embedding.');
  }
  return response.embeddings[0].values;
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: npm run kb:ingest -- <file-path> --title "Document title" [--description "Short note"]');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  const options = {};
  for (let i = 1; i < args.length; i += 1) {
    const flag = args[i];
    const value = args[i + 1];
    if (!flag.startsWith('--')) continue;
    const key = flag.slice(2);
    options[key] = value;
  }

  const title = options.title ?? path.basename(filePath);
  const description = options.description ?? '';

  console.log(`Reading "${filePath}"...`);
  const text = await extractTextFromFile(filePath);
  if (!text || text.trim().length === 0) {
    console.error('Extracted text is empty. Aborting.');
    process.exit(1);
  }

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    console.error('Unable to split the document into chunks.');
    process.exit(1);
  }

  console.log(`Document size: ${text.length} characters -> ${chunks.length} chunks.`);

  console.log('Creating knowledge document metadata...');
  const { data: document, error: insertError } = await supabase
    .from('ai_knowledge_documents')
    .insert({
      title,
      description,
      source_type: 'file',
      file_name: path.basename(filePath),
      mime_type: options.mime ?? null,
      storage_path: filePath,
      metadata: {
        imported_at: new Date().toISOString(),
        importer: 'cli',
      },
    })
    .select('id')
    .single();

  if (insertError || !document) {
    console.error('Failed to create knowledge document:', insertError);
    process.exit(1);
  }

  const documentId = document.id;

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    console.log(`Embedding chunk ${index + 1}/${chunks.length}...`);
    const embedding = await generateEmbedding(chunk);

    const { error: chunkError } = await supabase
      .from('ai_knowledge_chunks')
      .insert({
        document_id: documentId,
        chunk_index: index,
        content: chunk,
        embedding,
        metadata: {
          source: 'file',
          file_path: filePath,
          chunk_length: chunk.length,
        },
      });

    if (chunkError) {
      console.error('Failed to insert knowledge chunk:', chunkError);
      process.exit(1);
    }
  }

  console.log(`Import completed. Document ID: ${documentId}`);
};

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
