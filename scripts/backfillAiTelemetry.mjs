#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const loadLocalEnv = () => {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const [key, ...rest] = line.split('=');
    if (!key || rest.length === 0) continue;
    const value = rest.join('=');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadLocalEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Add them to .env.local or export before running this script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const addDays = (date, offset) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + offset);
  return copy;
};

const makeTimestamp = (date, hourOffset = 0) => {
  const ts = new Date(date);
  ts.setHours(ts.getHours() + hourOffset);
  return ts.toISOString();
};

const randomTokens = () => Math.floor(Math.random() * 80) + 20;

const seedSamples = async () => {
  const today = new Date();
  const templates = [
    {
      prompt: 'Give me a quick summary of today’s open deals.',
      response: 'You currently have 5 active deals worth $72,000. Two deals are in quoting, three are pending follow-up.',
      rating: 1,
    },
    {
      prompt: 'Draft an email to follow up with the InnovateTech contact.',
      response: 'Hi Alice,\n\nJust checking in regarding the InnovateTech pilot. Let me know if you have any blockers.\n\nBest,\nYour name',
      rating: 1,
    },
    {
      prompt: 'What were the main questions from yesterday’s discovery call?',
      response: 'The customer asked about pricing tiers, implementation timeline, and data migration support.',
      rating: -1,
    },
  ];

  for (let dayOffset = -6; dayOffset <= 0; dayOffset++) {
    for (const template of templates) {
      const createdAt = addDays(today, dayOffset);
      const sessionInsert = await supabase
        .from('ai_sessions')
        .insert({
          channel: 'assistant',
          metadata: { seeded: true },
          created_at: makeTimestamp(createdAt),
          last_interaction_at: makeTimestamp(createdAt, 1),
        })
        .select('id')
        .single();

      if (sessionInsert.error) {
        console.error('Failed to insert session', sessionInsert.error);
        continue;
      }

      const sessionId = sessionInsert.data.id;
      await supabase.from('ai_messages').insert([
        {
          session_id: sessionId,
          role: 'user',
          content: template.prompt,
          tokens: randomTokens(),
          created_at: makeTimestamp(createdAt),
        },
        {
          session_id: sessionId,
          role: 'assistant',
          content: template.response,
          tokens: randomTokens(),
          created_at: makeTimestamp(createdAt, 1),
        },
      ]);

      await supabase.from('ai_feedback').upsert({
        session_id: sessionId,
        message_id: null,
        rating: template.rating,
        comment: template.rating === -1 ? 'Needs more actionable next steps.' : null,
        created_at: makeTimestamp(createdAt, 2),
      });
    }
  }
};

const main = async () => {
  console.log('Checking existing AI telemetry...');
  const { data, error } = await supabase
    .from('ai_sessions')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Failed to read ai_sessions:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('AI telemetry already exists. No seed required.');
    return;
  }

  console.log('Seeding sample AI telemetry (7 days, 3 sessions/day)...');
  await seedSamples();
  console.log('Completed seeding AI telemetry.');
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
