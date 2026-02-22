import { NextRequest, NextResponse } from 'next/server';
import { compressSummaries, analyzeTokenUsage, generateVolumeSynopsis } from '@/lib/memory/summary-compressor';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    const body = await req.json();
    const { action, volumeId, currentChapterNumber } = body;

    try {
        if (action === 'compress') {
            const result = await compressSummaries(projectId, currentChapterNumber || 999);
            return NextResponse.json(result);
        }

        if (action === 'volume-synopsis' && volumeId) {
            const synopsis = await generateVolumeSynopsis(volumeId);
            return NextResponse.json({ synopsis });
        }

        if (action === 'analyze') {
            const analysis = analyzeTokenUsage(projectId);
            return NextResponse.json(analysis);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 });
    }
}
