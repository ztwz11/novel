import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const db = getDb();

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const volumes = db.prepare('SELECT * FROM volumes WHERE project_id = ? ORDER BY volume_number').all(id);
    const storyBible = db.prepare('SELECT * FROM story_bible_entries WHERE project_id = ? ORDER BY category, sort_order').all(id);
    const persona = (project as any).persona_id
        ? db.prepare('SELECT * FROM personas WHERE id = ?').get((project as any).persona_id)
        : null;

    return NextResponse.json({ project, volumes, storyBible, persona });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();

    // Handle volume addition
    if (body.addVolume) {
        const { v4: uuidv4 } = await import('uuid');
        db.prepare('INSERT INTO volumes (id, project_id, volume_number, title) VALUES (?, ?, ?, ?)')
            .run(uuidv4(), id, body.volumeNumber, `${body.volumeNumber}권`);
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
        return NextResponse.json(project);
    }

    // Handle settings-only update
    if (body.settings_json !== undefined && !body.title) {
        db.prepare(`UPDATE projects SET settings_json = ?, updated_at = datetime('now') WHERE id = ?`)
            .run(body.settings_json, id);
        const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
        return NextResponse.json(project);
    }

    // Full update
    db.prepare(
        `UPDATE projects SET title = ?, genre = ?, description = ?, target_volumes = ?, persona_id = ?, settings_json = ?, updated_at = datetime('now')
     WHERE id = ?`
    ).run(
        body.title,
        body.genre,
        body.description || '',
        body.targetVolumes || 1,
        body.personaId || null,
        JSON.stringify(body.settings || {}),
        id,
    );

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return NextResponse.json(project);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const db = getDb();
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
}
