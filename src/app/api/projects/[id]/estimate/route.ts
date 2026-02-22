import { NextRequest, NextResponse } from 'next/server';
import { getProvider, getProviderInfo } from '@/lib/ai/providers';
import { buildPrompt } from '@/lib/ai/prompt-builder';
import { estimateTokens } from '@/lib/ai/providers/types';
import { getDb } from '@/lib/db';

// GET: 프로바이더 및 모델 목록
export async function GET() {
    return NextResponse.json({ providers: getProviderInfo() });
}

// POST: 비용 추정
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: projectId } = await params;
        const body = await req.json();
        const { providerId, modelId, volumeId, chapterNumber, direction, knowledgeFileIds } = body;

        const db = getDb();
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

        // Build prompt to estimate tokens
        const prompt = buildPrompt(projectId, volumeId, chapterNumber, personaSystemPrompt, personaRules, knowledgeFileIds);

        const inputTokens = prompt.estimatedTokens + estimateTokens(direction || '') + estimateTokens(personaSystemPrompt);
        const outputTokens = 8000; // ~4000자 한국어 ≈ 8000 토큰

        const provider = getProvider(providerId || 'gemini');
        const estimate = provider.estimateCost(inputTokens, outputTokens, modelId);

        return NextResponse.json({
            estimate,
            context: {
                systemPromptTokens: estimateTokens(personaSystemPrompt),
                contextTokens: prompt.estimatedTokens,
                directionTokens: estimateTokens(direction || ''),
            },
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
