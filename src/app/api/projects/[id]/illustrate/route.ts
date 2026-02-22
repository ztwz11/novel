import { NextRequest, NextResponse } from 'next/server';
import { generateIllustration, generateImagePrompt, getProjectIllustrations } from '@/lib/ai/illustrator';
import type { IllustrationRequest } from '@/lib/ai/illustrator';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: projectId } = await params;
        const body = await req.json();
        const { action } = body;

        if (action === 'prompt_only') {
            // 프롬프트만 생성 (외부 도구용)
            const result = await generateImagePrompt({
                projectId,
                chapterId: body.chapterId,
                type: body.type || 'scene',
                provider: 'manual',
                style: body.style || 'anime',
                customPrompt: body.customPrompt,
                characterName: body.characterName,
            });
            return NextResponse.json(result);
        }

        // 이미지 생성
        const request: IllustrationRequest = {
            projectId,
            chapterId: body.chapterId,
            type: body.type || 'scene',
            provider: body.provider || 'manual',
            style: body.style || 'anime',
            customPrompt: body.customPrompt,
            characterName: body.characterName,
        };

        const result = await generateIllustration(request);
        return NextResponse.json(result);
    } catch (err: any) {
        console.error('Illustration error:', err);
        return NextResponse.json({ error: err.message || 'Illustration failed' }, { status: 500 });
    }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: projectId } = await params;
        const illustrations = getProjectIllustrations(projectId);
        return NextResponse.json({ illustrations });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
