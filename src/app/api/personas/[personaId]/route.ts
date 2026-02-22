import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// PUT: 페르소나 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ personaId: string }> }) {
    try {
        const { personaId } = await params;
        const body = await req.json();
        const db = getDb();

        const updates: string[] = [];
        const values: any[] = [];

        if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
        if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
        if (body.genre !== undefined) { updates.push('genre = ?'); values.push(body.genre); }
        if (body.systemPrompt !== undefined) { updates.push('system_prompt = ?'); values.push(body.systemPrompt); }
        if (body.writingStyle !== undefined) { updates.push('writing_style_json = ?'); values.push(JSON.stringify(body.writingStyle)); }
        if (body.rules !== undefined) { updates.push('rules_json = ?'); values.push(JSON.stringify(body.rules)); }
        if (body.constraints !== undefined) { updates.push('constraints_json = ?'); values.push(JSON.stringify(body.constraints)); }

        if (updates.length > 0) {
            values.push(personaId);
            db.prepare(`UPDATE personas SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(personaId);
        return NextResponse.json(persona);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE: 페르소나 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ personaId: string }> }) {
    const { personaId } = await params;
    const db = getDb();
    db.prepare('DELETE FROM personas WHERE id = ?').run(personaId);
    return NextResponse.json({ success: true });
}
