import { NextRequest, NextResponse } from 'next/server';
import { reviseChapter, reviseMultiple, applyRevision, getRevisionHistory } from '@/lib/ai/reviser';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: projectId } = await params;
        const body = await req.json();
        const { action, chapterIds, options, revisionId } = body;

        if (action === 'apply' && revisionId) {
            applyRevision(revisionId);
            return NextResponse.json({ success: true });
        }

        if (action === 'history' && body.chapterId) {
            const history = getRevisionHistory(body.chapterId);
            return NextResponse.json({ history });
        }

        if (!chapterIds || !Array.isArray(chapterIds) || chapterIds.length === 0) {
            return NextResponse.json({ error: 'chapterIds required' }, { status: 400 });
        }

        if (!options || !options.focus || options.focus.length === 0) {
            return NextResponse.json({ error: 'At least one revision focus is required' }, { status: 400 });
        }

        // Fetch story bible for consistency checks
        let storyBibleContext: string | undefined;
        if (options.focus.includes('consistency')) {
            const db = getDb();
            const entries = db.prepare(
                `SELECT category, name, content FROM story_bible_entries WHERE project_id = ? AND content != ''`
            ).all(projectId) as { category: string; name: string; content: string }[];
            storyBibleContext = entries.map(e => `[${e.category}] ${e.name}: ${e.content}`).join('\n');
        }

        if (chapterIds.length === 1) {
            const result = await reviseChapter(chapterIds[0], options, storyBibleContext);
            return NextResponse.json(result);
        } else {
            const result = await reviseMultiple(chapterIds, options, storyBibleContext);
            return NextResponse.json(result);
        }
    } catch (err: any) {
        console.error('Revision error:', err);
        return NextResponse.json({ error: err.message || 'Revision failed' }, { status: 500 });
    }
}
