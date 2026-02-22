import { NextRequest, NextResponse } from 'next/server';
import { quickConsistencyCheck, deepConsistencyCheck } from '@/lib/ai/consistency-checker';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    const body = await req.json();
    const { action, content, chapterNumber } = body;

    try {
        if (action === 'quick' && content) {
            const report = await quickConsistencyCheck(projectId, content, chapterNumber);
            return NextResponse.json(report);
        }

        if (action === 'deep') {
            const report = await deepConsistencyCheck(projectId);
            return NextResponse.json(report);
        }

        return NextResponse.json({ error: 'Invalid action. Use "quick" or "deep"' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Consistency check failed' }, { status: 500 });
    }
}
