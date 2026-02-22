import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const db = getDb();
    const entries = db.prepare(
        'SELECT * FROM story_bible_entries WHERE project_id = ? ORDER BY category, sort_order'
    ).all(id);
    return NextResponse.json(entries);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();
    const entryId = uuidv4();

    db.prepare(
        `INSERT INTO story_bible_entries (id, project_id, category, name, content, metadata_json, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(entryId, id, body.category, body.name, body.content || '', JSON.stringify(body.metadata || {}), body.sortOrder || 0);

    const entry = db.prepare('SELECT * FROM story_bible_entries WHERE id = ?').get(entryId);
    return NextResponse.json(entry, { status: 201 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    if (!body.entryId) return NextResponse.json({ error: 'entryId required' }, { status: 400 });

    db.prepare(
        `UPDATE story_bible_entries SET name = ?, content = ?, category = ?, metadata_json = ?, updated_at = datetime('now')
     WHERE id = ? AND project_id = ?`
    ).run(body.name, body.content, body.category, JSON.stringify(body.metadata || {}), body.entryId, id);

    const entry = db.prepare('SELECT * FROM story_bible_entries WHERE id = ?').get(body.entryId);
    return NextResponse.json(entry);
}
