import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getProvider } from '@/lib/ai/providers';
import { buildPrompt } from '@/lib/ai/prompt-builder';
import { generateSummary } from '@/lib/ai/gemini-client';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    const body = await req.json();
    const db = getDb();

    const { volumeId, chapterNumber, direction, knowledgeFileIds, providerId, modelId } = body;

    if (!volumeId || !chapterNumber || !direction) {
        return NextResponse.json({ error: 'volumeId, chapterNumber, direction are required' }, { status: 400 });
    }

    // Get persona
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

    let personaSystemPrompt = '';
    let personaRules: string[] = [];

    if (project.persona_id) {
        const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(project.persona_id) as any;
        if (persona) {
            personaSystemPrompt = persona.system_prompt;
            personaRules = JSON.parse(persona.rules_json || '[]');
        }
    }

    try {
        // Build prompt
        const prompt = buildPrompt(projectId, volumeId, chapterNumber, personaSystemPrompt, personaRules, knowledgeFileIds);

        // Get provider
        const provider = getProvider(providerId || 'gemini');
        const selectedModel = modelId || provider.models[0].id;

        // Generate chapter using selected provider
        const { chapter: result, usage } = await provider.generateChapter(
            prompt.systemPrompt,
            prompt.contextPrompt,
            direction,
            selectedModel,
        );

        // Save chapter
        const chapterId = uuidv4();
        const wordCount = result.content.length;

        db.prepare(
            `INSERT INTO chapters (id, volume_id, chapter_number, title, content, summary, detailed_summary, word_count, status, generation_direction)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'generated', ?)`
        ).run(
            chapterId, volumeId, chapterNumber,
            result.title, result.content, result.summary, result.summary,
            wordCount, direction,
        );

        // Save generation log
        db.prepare(
            `INSERT INTO generation_logs (id, chapter_id, prompt_tokens, completion_tokens, total_tokens, model)
       VALUES (?, ?, ?, ?, ?, ?)`
        ).run(uuidv4(), chapterId, usage.promptTokens, usage.completionTokens, usage.totalTokens, `${providerId || 'gemini'}/${selectedModel}`);

        // Generate condensed summary for mid-term memory (use Gemini for this as it's cheap)
        try {
            const condensed = await generateSummary(result.content, 'condensed');
            const keyEvents = await generateSummary(result.content, 'key_events_only');
            db.prepare('UPDATE chapters SET condensed_summary = ?, key_events_summary = ? WHERE id = ?')
                .run(condensed, keyEvents, chapterId);
        } catch { /* non-critical */ }

        // Estimate cost for display
        const costEstimate = provider.estimateCost(usage.promptTokens, usage.completionTokens, selectedModel);

        return NextResponse.json({
            chapter: {
                id: chapterId,
                chapterNumber,
                title: result.title,
                content: result.content,
                summary: result.summary,
                wordCount,
                keyEvents: result.keyEvents,
                newCharacters: result.newCharacters,
                cliffhanger: result.cliffhanger,
            },
            usage: {
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens,
                estimatedContextTokens: prompt.estimatedTokens,
            },
            cost: costEstimate,
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
    }
}
