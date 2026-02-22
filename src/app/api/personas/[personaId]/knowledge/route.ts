import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { generateText } from '@/lib/ai/gemini-client';

// GET: 페르소나의 지식 파일 목록
export async function GET(req: NextRequest, { params }: { params: Promise<{ personaId: string }> }) {
    const { personaId } = await params;
    const db = getDb();
    const files = db.prepare(
        'SELECT * FROM persona_knowledge_files WHERE persona_id = ? ORDER BY sort_order, created_at'
    ).all(personaId);
    return NextResponse.json({ files });
}

// POST: 지식 파일 추가 또는 요약 생성
export async function POST(req: NextRequest, { params }: { params: Promise<{ personaId: string }> }) {
    try {
        const { personaId } = await params;
        const body = await req.json();
        const db = getDb();

        // 요약 생성 요청
        if (body.action === 'summarize') {
            const file = db.prepare('SELECT id, content FROM persona_knowledge_files WHERE id = ? AND persona_id = ?')
                .get(body.fileId, personaId) as { id: string; content: string } | undefined;

            if (!file || !file.content) {
                return NextResponse.json({ error: 'File not found or empty' }, { status: 404 });
            }

            const prompt = `다음 소설 작성 참고 문서를 500자 이내로 핵심만 요약하세요. 소설 생성 시 AI가 참고할 수 있도록 설정, 규칙, 스타일 가이드의 핵심 포인트를 중심으로 요약하세요.

---
${file.content.substring(0, 15000)}
---

요약:`;

            const summary = await generateText(prompt);

            db.prepare('UPDATE persona_knowledge_files SET summary = ?, updated_at = datetime(\'now\') WHERE id = ?')
                .run(summary, file.id);

            return NextResponse.json({ summary });
        }

        // 전체 요약 생성
        if (body.action === 'summarize_all') {
            const files = db.prepare(
                'SELECT id, filename, content FROM persona_knowledge_files WHERE persona_id = ? AND is_active = 1 AND content != \'\''
            ).all(personaId) as { id: string; filename: string; content: string }[];

            const results: { fileId: string; summary: string }[] = [];
            for (const file of files) {
                const prompt = `다음 소설 작성 참고 문서를 500자 이내로 핵심만 요약하세요. 소설 생성 시 AI가 참고할 수 있도록 설정, 규칙, 스타일 가이드의 핵심 포인트를 중심으로 요약하세요.

---
${file.content.substring(0, 15000)}
---

요약:`;
                const summary = await generateText(prompt);
                db.prepare('UPDATE persona_knowledge_files SET summary = ?, updated_at = datetime(\'now\') WHERE id = ?')
                    .run(summary, file.id);
                results.push({ fileId: file.id, summary });
            }
            return NextResponse.json({ results, count: results.length });
        }

        // 새 파일 추가
        const id = uuidv4();
        const content = body.content || '';
        const charCount = content.length;

        db.prepare(
            `INSERT INTO persona_knowledge_files (id, persona_id, filename, content, file_type, sort_order, char_count)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(id, personaId, body.filename || 'untitled.md', content, body.fileType || 'md', body.sortOrder || 0, charCount);

        const newFile = db.prepare('SELECT * FROM persona_knowledge_files WHERE id = ?').get(id);
        return NextResponse.json(newFile, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PUT: 지식 파일 수정
export async function PUT(req: NextRequest, { params }: { params: Promise<{ personaId: string }> }) {
    try {
        const { personaId } = await params;
        const body = await req.json();
        const db = getDb();

        if (!body.fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 });

        const updates: string[] = [];
        const values: any[] = [];

        if (body.filename !== undefined) { updates.push('filename = ?'); values.push(body.filename); }
        if (body.content !== undefined) {
            updates.push('content = ?', 'char_count = ?');
            values.push(body.content, body.content.length);
        }
        if (body.is_active !== undefined) { updates.push('is_active = ?'); values.push(body.is_active ? 1 : 0); }
        if (body.sort_order !== undefined) { updates.push('sort_order = ?'); values.push(body.sort_order); }

        if (updates.length > 0) {
            updates.push("updated_at = datetime('now')");
            values.push(body.fileId, personaId);
            db.prepare(`UPDATE persona_knowledge_files SET ${updates.join(', ')} WHERE id = ? AND persona_id = ?`).run(...values);
        }

        const file = db.prepare('SELECT * FROM persona_knowledge_files WHERE id = ?').get(body.fileId);
        return NextResponse.json(file);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE: 지식 파일 삭제
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ personaId: string }> }) {
    const { personaId } = await params;
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) return NextResponse.json({ error: 'fileId required' }, { status: 400 });

    const db = getDb();
    db.prepare('DELETE FROM persona_knowledge_files WHERE id = ? AND persona_id = ?').run(fileId, personaId);
    return NextResponse.json({ success: true });
}
