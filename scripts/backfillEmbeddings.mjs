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
    console.error('Ensure they are present in your .env.local file or exported in your shell.');
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const targets = [
    { table: 'products', textField: 'description' },
    { table: 'organizations', textField: 'description' },
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const backfillTable = async ({ table, textField }) => {
    console.log(`\nProcessing table "${table}"...`);
    const { data, error } = await supabaseAdmin
        .from(table)
        .select(`id, ${textField}`)
        .is(`${textField}_embedding`, null);

    if (error) {
        console.error(`  Failed to fetch rows: ${error.message}`);
        return;
    }

    if (!data?.length) {
        console.log('  No rows requiring embedding.');
        return;
    }

    console.log(`  Found ${data.length} rows to embed.`);
    for (const row of data) {
        if (!row[textField]) {
            console.log(`  Skipping ${row.id} (empty ${textField}).`);
            continue;
        }
        try {
            const { error: invokeError } = await supabaseAdmin.functions.invoke('generate-embedding', {
                body: {
                    tableName: table,
                    recordId: row.id,
                    textToEmbed: row[textField],
                },
            });
            if (invokeError) {
                console.error(`  ❌ ${row.id}: ${invokeError.message}`);
            } else {
                console.log(`  ✅ ${row.id}`);
            }
            await delay(300); // avoid hammering rate limits
        } catch (err) {
            console.error(`  ❌ ${row.id}:`, err.message ?? err);
        }
    }
};

const main = async () => {
    console.log('Starting embedding backfill...');
    for (const target of targets) {
        await backfillTable(target);
    }
    console.log('\nBackfill complete.');
};

main().catch(err => {
    console.error(err);
    process.exit(1);
});
