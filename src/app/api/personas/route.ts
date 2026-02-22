import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    const db = getDb();
    const personas = db.prepare('SELECT * FROM personas ORDER BY created_at DESC').all();
    return NextResponse.json(personas);
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const db = getDb();
    const id = uuidv4();

    db.prepare(
        `INSERT INTO personas (id, name, description, genre, system_prompt, writing_style_json, rules_json, constraints_json, example_excerpts_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
        id,
        body.name || '',
        body.description || '',
        body.genre || '',
        body.systemPrompt || '',
        JSON.stringify(body.writingStyle || {}),
        JSON.stringify(body.rules || []),
        JSON.stringify(body.constraints || []),
        JSON.stringify(body.exampleExcerpts || []),
    );

    const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(id);
    return NextResponse.json(persona, { status: 201 });
}
