import { GoogleGenAI } from "@google/genai";
import { knowledgeBase } from '../data/knowledgeBase';
import { Contact, Deal, AiContextSnapshot, AiDocumentMatch } from '../types';

const processEnv = typeof process !== 'undefined' ? process.env : undefined;

const GEMINI_API_KEY =
    import.meta.env?.VITE_GEMINI_API_KEY ??
    processEnv?.GEMINI_API_KEY ??
    processEnv?.API_KEY;

const isGeminiConfigured = Boolean(GEMINI_API_KEY);

const ai = isGeminiConfigured
    ? new GoogleGenAI({ apiKey: GEMINI_API_KEY! })
    : null;

if (!isGeminiConfigured) {
    console.warn('Gemini API key is not set. AI features will return placeholder responses.');
}

export const generateEmbedding = async (text: string): Promise<number[]> => {
    console.log("generateEmbedding called", text);
    if (!ai) {
        console.warn('Gemini embedding requested without configuration.');
        return [];
    }
    try {
        const response = await ai.models.embedContent({
            model: "text-embedding-004",
            contents: [text],
        });
        return response.embeddings[0].values;
    } catch (error) {
        console.error('Error generating embedding:', error);
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate text embedding.');
    }
};

const formatKnowledgeBase = (): string => {
    return knowledgeBase.map(article => `
        Category: ${article.category}
        Title: ${article.title}
        Content: ${article.content}
    `).join('\n---\n');
};

const knowledgeBaseContent = formatKnowledgeBase();

const formatContextSnapshot = (snapshot?: AiContextSnapshot | null): string => {
    if (!snapshot) {
        return '';
    }

    const totals = snapshot.totals;
    const parts: string[] = [];

    parts.push(
        `Totals: organizations=${totals.organizations}, contacts=${totals.contacts}, deals=${totals.deals}, open_deals=${totals.openDeals}, pipeline_value=${totals.pipelineValue}`
    );

    if (snapshot.topDeals.length > 0) {
        const dealLines = snapshot.topDeals
            .map((deal, index) => {
                const org = deal.organization ? ` | org: ${deal.organization}` : '';
                const close = deal.closeDate ? ` | close_date: ${deal.closeDate}` : '';
                return `${index + 1}. ${deal.dealName} (${deal.stage}) amount: ${deal.amount}${org}${close}`;
            })
            .join('\n');
        parts.push('Top Deals:\n' + dealLines);
    }

    if (snapshot.upcomingTasks.length > 0) {
        const taskLines = snapshot.upcomingTasks
            .map((task, index) => {
                const related =
                    task.relatedTo && typeof task.relatedTo === 'object'
                        ? ` | related_to: ${JSON.stringify(task.relatedTo)}`
                        : '';
                return `${index + 1}. ${task.title} due ${task.dueDate} (${task.status} / ${task.priority})${related}`;
            })
            .join('\n');
        parts.push('Upcoming Tasks:\n' + taskLines);
    }

    if (snapshot.recentOrganizations.length > 0) {
        const orgLines = snapshot.recentOrganizations
            .map(
                (org, index) =>
                    `${index + 1}. ${org.name} (${org.industry ?? 'N/A'}) created_at ${org.createdAt}`
            )
            .join('\n');
        parts.push('Recent Organizations:\n' + orgLines);
    }

    parts.push(`Snapshot generated at: ${snapshot.generatedAt}`);
    return parts.join('\n');
};

const truncateContent = (value: string, maxLength: number = 500): string => {
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength - 3) + '...';
};

const formatMatches = (matches?: AiDocumentMatch[] | null): string => {
    if (!matches || matches.length === 0) {
        return '';
    }

    return matches
        .slice(0, 6)
        .map((match, index) => {
            const meta =
                match.metadata && Object.keys(match.metadata).length > 0
                    ? `Metadata: ${JSON.stringify(match.metadata)}`
                    : '';
            return `Result ${index + 1} [${match.source}] ${match.title}\nRelevance: ${match.similarity.toFixed(
                3
            )}\n${meta}\nExcerpt: ${truncateContent(match.content, 600)}`;
        })
        .join('\n\n');
};

async function extractTextFromResponse(result: any): Promise<string> {
    try {
        if (!result) return '';

        if (typeof result.text === 'function') {
            const maybeText = await result.text();
            if (maybeText) return maybeText;
        }

        if (result.response && typeof result.response.text === 'function') {
            const maybeText = await result.response.text();
            if (maybeText) return maybeText;
        }

        const candidates = result.response?.candidates ?? result.candidates;
        if (Array.isArray(candidates) && candidates.length > 0) {
            const parts = candidates[0]?.content?.parts ?? [];
            if (Array.isArray(parts)) {
                return parts
                    .map((part: any) => part?.text ?? '')
                    .filter(Boolean)
                    .join('\n')
                    .trim();
            }
        }
    } catch (error) {
        console.error('Error extracting Gemini response text:', error);
    }
    return '';
}

export const generateAiResponse = async (
    userInput: string,
    context?: { contact?: Contact; deal?: Deal },
    options?: {
        searchResults?: AiDocumentMatch[];
        contextSnapshot?: AiContextSnapshot | null;
    }
): Promise<string> => {
    console.log("generateAiResponse called", userInput, context, options);
    if (!ai) {
        return 'AI assistant is not configured. Please add your Gemini API key to enable this feature.';
    }
    const systemInstruction = `You are an expert AI assistant for a CRM called "Stellar AI CRM". Your purpose is to help sales representatives with their tasks.
- You are helpful, intelligent, and concise.
- Your main tasks include drafting emails, summarizing information, and providing sales advice based on the provided context, CRM snapshot, retrieved knowledge, and knowledge base.
- When drafting emails, be professional and friendly. Use placeholders like [Your Name] for the sender's signature.
- If context about a contact or deal is provided, use it to personalize the response.
- If the user asks about product information, pricing, or case studies, use the provided knowledge base and retrieved knowledge.
- If a user's request is ambiguous, ask for clarification.
- Do not invent information that is not present in the context, CRM snapshot, retrieved knowledge, or knowledge base.
- Reference the relevant source (for example the product name, organization, or metric) when using retrieved knowledge.
- Your response should be in plain text or markdown.

Here is the knowledge base you should use:
--- KNOWLEDGE BASE START ---
${knowledgeBaseContent}
--- KNOWLEDGE BASE END ---
`;

    let prompt = `User request: "${userInput}"\n`;

    if (context) {
        prompt += "\n--- CONTEXT START ---\n";
        if (context.contact) {
            prompt += `Contact Information:\n- Name: ${context.contact.fullName}\n- Email: ${context.contact.email}\n- Title: ${context.contact.title}\n`;
        }
        if (context.deal) {
            prompt += `Deal Information:\n- Name: ${context.deal.dealName}\n- Amount: $${context.deal.amount}\n- Stage: ${context.deal.stage}\n- Close Date: ${context.deal.closeDate}\n`;
        }
        prompt += "--- CONTEXT END ---\n";
    }

    const snapshotText = formatContextSnapshot(options?.contextSnapshot);
    if (snapshotText) {
        prompt += "\n--- CRM SNAPSHOT ---\n";
        prompt += snapshotText + '\n';
        prompt += "--- END CRM SNAPSHOT ---\n";
    }

    const matchesText = formatMatches(options?.searchResults);
    if (matchesText) {
        prompt += "\n--- RETRIEVED KNOWLEDGE ---\n";
        prompt += matchesText + '\n';
        prompt += "--- END RETRIEVED KNOWLEDGE ---\n";
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            systemInstruction,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }],
                },
            ],
        });

        const text = await extractTextFromResponse(response);
        if (text) {
            return text;
        }
        return 'Sorry, I was not able to generate a response. Please try again.';
    } catch (error) {
        console.error('Error calling Gemini API:', error);
        console.error('Error calling Gemini API:', error);
        return 'Sorry, I encountered an error while processing your request. Please check the console for details.';
    }
};
