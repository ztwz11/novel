import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getGenrePreset } from '@/lib/genre/genre-presets';

export async function GET() {
    const db = getDb();
    const projects = db.prepare(`
    SELECT p.*, pe.name as persona_name 
    FROM projects p 
    LEFT JOIN personas pe ON p.persona_id = pe.id 
    ORDER BY p.updated_at DESC
  `).all();
    return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const db = getDb();
    const id = uuidv4();

    db.prepare(
        `INSERT INTO projects (id, title, genre, description, target_volumes, persona_id, settings_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
        id,
        body.title || '새 프로젝트',
        body.genre || '',
        body.description || '',
        body.targetVolumes || 1,
        body.personaId || null,
        JSON.stringify(body.settings || {}),
    );

    // Auto-create first volume
    const volumeId = uuidv4();
    db.prepare(
        `INSERT INTO volumes (id, project_id, volume_number, title, status) VALUES (?, ?, 1, '1권', 'draft')`
    ).run(volumeId, id);

    // Auto-create story bible entries from genre preset
    if (body.genre) {
        const preset = getGenrePreset(body.genre);
        if (preset) {
            const insertEntry = db.prepare(
                `INSERT INTO story_bible_entries (id, project_id, category, name, content, sort_order) VALUES (?, ?, ?, ?, ?, ?)`
            );
            preset.storyBibleCategories.forEach((cat, i) => {
                insertEntry.run(uuidv4(), id, cat.category, cat.label, cat.description, i);
            });
        }
    }

    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return NextResponse.json(project, { status: 201 });
}
