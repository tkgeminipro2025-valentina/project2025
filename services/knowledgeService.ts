import { supabase, isSupabaseConfigured } from './supabaseClient';
import { keysToCamel } from '../utils';
import { KnowledgeDocument } from '../types';
import { generateEmbedding } from './geminiService';

const handleSupabaseError = (error: any, context: string) => {
    console.error(`Supabase error in ${context}:`, {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
    });
    throw new Error(`Failed to ${context}.`);
};

const EXPECTED_EMBEDDING_DIMENSION = 768;

const chunkText = (input: string, chunkSize: number = 1200, overlap: number = 150): string[] => {
    const sanitized = input.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
    if (sanitized.length <= chunkSize) {
        return [sanitized];
    }

    const chunks: string[] = [];
    let start = 0;
    while (start < sanitized.length) {
        const end = Math.min(start + chunkSize, sanitized.length);
        chunks.push(sanitized.slice(start, end).trim());
        if (end === sanitized.length) {
            break;
        }
        const nextStart = end - overlap;
        start = nextStart > start ? nextStart : end; // ensure forward progress even if overlap >= chunkSize
    }
    return chunks.filter(Boolean);
};

export const fetchKnowledgeDocuments = async (): Promise<KnowledgeDocument[]> => {
    if (!isSupabaseConfigured) {
        return [];
    }
    try {
        const { data, error } = await supabase
            .from('ai_knowledge_documents')
            .select('id, title, description, source_type, file_name, mime_type, storage_path, metadata, created_at, created_by, ai_knowledge_chunks(count)')
            .order('created_at', { ascending: false });

        if (error) handleSupabaseError(error, 'fetch knowledge documents');

        return (data ?? []).map((doc: any) => {
            const camel = keysToCamel(doc) as KnowledgeDocument & { aiKnowledgeChunks?: Array<{ count: number }> };
            const chunkCount = camel.aiKnowledgeChunks?.[0]?.count ?? 0;
            const { aiKnowledgeChunks, ...rest } = camel;
            return { ...rest, chunkCount };
        });
    } catch (error) {
        console.error('Error fetching knowledge documents:', error);
        throw error;
    }
};

interface ManualKnowledgePayload {
    title: string;
    description?: string;
    content: string;
    chunkSize?: number;
    sourceType?: string;
    fileName?: string | null;
    mimeType?: string | null;
    storagePath?: string | null;
}

export const createManualKnowledgeEntry = async ({
    title,
    description,
    content,
    chunkSize = 1200,
    sourceType = 'manual',
    fileName = null,
    mimeType = null,
    storagePath = null,
}: ManualKnowledgePayload): Promise<KnowledgeDocument> => {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured.');
    }
    const trimmed = content.trim();
    if (!trimmed) {
        throw new Error('No content provided.');
    }

    const chunks = chunkText(trimmed, chunkSize);
    if (chunks.length === 0) {
        throw new Error('Unable to split content into chunks.');
    }

    try {
        const { data: document, error } = await supabase
            .from('ai_knowledge_documents')
            .insert({
            title,
            description: description ?? null,
            source_type: sourceType,
            file_name: fileName,
            mime_type: mimeType,
            storage_path: storagePath,
        })
            .select('id, title, description, source_type, file_name, mime_type, storage_path, metadata, created_at, created_by')
            .single();

        if (error || !document) {
            handleSupabaseError(error, 'create knowledge document');
        }

        const docId = document.id as string;

        for (let index = 0; index < chunks.length; index += 1) {
            const chunk = chunks[index];
            const embedding = await generateEmbedding(chunk);
            if (!embedding || embedding.length === 0) {
                console.warn('Missing embedding for chunk', index);
                continue;
            }

            const embeddingArray = Array.isArray(embedding)
                ? embedding
                : Array.from(embedding);

            if (embeddingArray.length !== EXPECTED_EMBEDDING_DIMENSION) {
                throw new Error(
                    `Embedding dimension mismatch (${embeddingArray.length}). ` +
                    `Please ensure the ai_knowledge_chunks.embedding column is vector(${EXPECTED_EMBEDDING_DIMENSION}).`
                );
            }

            const { error: insertError } = await supabase
                .from('ai_knowledge_chunks')
                .insert({
                    document_id: docId,
                    chunk_index: index,
                    content: chunk,
                    embedding: embeddingArray,
                    metadata: {
                        source: sourceType,
                        length: chunk.length,
                        file_name: fileName,
                        storage_path: storagePath,
                    },
                });

            if (insertError) {
                handleSupabaseError(insertError, 'insert knowledge chunk');
            }
        }

        return keysToCamel({ ...document, chunk_count: chunks.length }) as KnowledgeDocument;
    } catch (error) {
        console.error('Error creating knowledge entry:', error);
        throw error;
    }
};

export const deleteKnowledgeDocument = async (id: string, storagePath?: string | null): Promise<void> => {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase client is not configured.');
    }
    try {
        const { error } = await supabase
            .from('ai_knowledge_documents')
            .delete()
            .eq('id', id);

        if (error) {
            handleSupabaseError(error, 'delete knowledge document');
        }

        await removeKnowledgeFile(storagePath);
    } catch (error) {
        console.error('Error deleting knowledge document:', error);
        throw error;
    }
};

export const uploadKnowledgeFile = async (file: File): Promise<{ storagePath: string | null; fileName: string; mimeType: string | null; }> => {
    return {
        storagePath: null,
        fileName: file.name,
        mimeType: file.type || null,
    };
};

export async function removeKnowledgeFile(_storagePath: string | null | undefined): Promise<void> {
    // No-op: files are not persisted in storage in the current implementation.
}
