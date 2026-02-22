import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: projectId } = await params;
    const db = getDb();
    const url = new URL(req.url);
    const volumeId = url.searchParams.get('volumeId');

    if (volumeId) {
        const chapters = db.prepare(
            'SELECT * FROM chapters WHERE volume_id = ? ORDER BY chapter_number'
        ).all(volumeId);
        return NextResponse.json(chapters);
    }

    // Return all chapters for the project
    const chapters = db.prepare(`
    SELECT c.*, v.volume_number 
    FROM chapters c 
    JOIN volumes v ON c.volume_id = v.id 
    WHERE v.project_id = ? 
    ORDER BY v.volume_number, c.chapter_number
  `).all(projectId);
    return NextResponse.json(chapters);
}

// PUT: 챕터 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const db = getDb();
        const { chapterId, title, content } = body;

        if (!chapterId) return NextResponse.json({ error: 'chapterId required' }, { status: 400 });

        const updates: string[] = [];
        const values: any[] = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (content !== undefined) {
            updates.push('content = ?', 'word_count = ?');
            values.push(content, content.length);
        }

        if (updates.length > 0) {
            values.push(chapterId);
            db.prepare(`UPDATE chapters SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        const chapter = db.prepare('SELECT * FROM chapters WHERE id = ?').get(chapterId);
        return NextResponse.json(chapter);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE: 챕터 삭제
export async function DELETE(req: NextRequest) {
    const url = new URL(req.url);
    const chapterId = url.searchParams.get('chapterId');
    if (!chapterId) return NextResponse.json({ error: 'chapterId required' }, { status: 400 });

    const db = getDb();
    db.prepare('DELETE FROM generation_logs WHERE chapter_id = ?').run(chapterId);
    db.prepare('DELETE FROM chapters WHERE id = ?').run(chapterId);
    return NextResponse.json({ success: true });
}
