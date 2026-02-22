import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getProvider } from '@/lib/ai/providers';
import { buildPrompt } from '@/lib/ai/prompt-builder';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const { volumeId, chapterNumber, direction, knowledgeFileIds, providerId = 'gemini', modelId } = body;

    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as any;
    if (!project) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });

    const provider = getProvider(providerId);
    if (!provider || !provider.isConfigured()) {
        return new Response(JSON.stringify({ error: 'Provider not configured' }), { status: 400 });
    }

    // Build prompt (same as generate route)
    let personaSystemPrompt = '';
    let personaRules: string[] = [];
    if (project.persona_id) {
        const persona = db.prepare('SELECT * FROM personas WHERE id = ?').get(project.persona_id) as any;
        if (persona) {
            personaSystemPrompt = persona.system_prompt;
            personaRules = JSON.parse(persona.rules_json || '[]');
        }
    }
    const prompt = buildPrompt(id, volumeId, chapterNumber, personaSystemPrompt, personaRules, knowledgeFileIds);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const send = (type: string, data: any) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`));
            };

            try {
                send('start', { message: '생성 시작...' });

                if (providerId === 'gemini') {
                    // Real streaming with Gemini
                    const { GoogleGenerativeAI } = await import('@google/generative-ai');
                    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
                    const model = genAI.getGenerativeModel({
                        model: modelId || 'gemini-2.5-flash-preview-05-20',
                        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192 },
                        systemInstruction: prompt.systemPrompt,
                    });

                    const result = await model.generateContentStream(
                        prompt.contextPrompt + '\n\n사용자 방향: ' + direction
                    );

                    let fullText = '';
                    for await (const chunk of result.stream) {
                        const text = chunk.text();
                        fullText += text;
                        send('chunk', { text });
                    }

                    // Parse final JSON and save
                    try {
                        const parsed = JSON.parse(fullText);
                        const chapterId = uuidv4();
                        const wordCount = (parsed.content || '').length;

                        db.prepare(
                            `INSERT INTO chapters (id, volume_id, chapter_number, title, content, summary, detailed_summary, word_count, status, generation_direction)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'generated', ?)`
                        ).run(chapterId, volumeId, chapterNumber, parsed.title, parsed.content, parsed.summary, parsed.summary, wordCount, direction);

                        send('done', {
                            chapter: {
                                id: chapterId, chapterNumber, title: parsed.title,
                                content: parsed.content, summary: parsed.summary, wordCount,
                                keyEvents: parsed.keyEvents, newCharacters: parsed.newCharacters,
                                cliffhanger: parsed.cliffhanger,
                            },
                        });
                    } catch {
                        send('error', { message: 'JSON 파싱 실패 — 비스트리밍 모드를 사용해주세요' });
                    }
                } else {
                    // Non-streaming providers: generate fully then send in chunks
                    send('chunk', { text: '📝 AI가 챕터를 작성하고 있습니다...\n\n' });

                    const result = await provider.generateChapter(prompt.systemPrompt, prompt.contextPrompt, direction, modelId);
                    const chapterId = uuidv4();
                    const wordCount = (result.chapter.content || '').length;

                    db.prepare(
                        `INSERT INTO chapters (id, volume_id, chapter_number, title, content, summary, detailed_summary, word_count, status, generation_direction)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'generated', ?)`
                    ).run(chapterId, volumeId, chapterNumber, result.chapter.title, result.chapter.content, result.chapter.summary, result.chapter.summary, wordCount, direction);

                    // Simulate streaming by sending content in chunks
                    const content = result.chapter.content;
                    const chunkSize = 80;
                    for (let i = 0; i < content.length; i += chunkSize) {
                        send('chunk', { text: content.slice(i, i + chunkSize) });
                        // Small delay between chunks for visual effect
                        await new Promise(r => setTimeout(r, 20));
                    }

                    send('done', {
                        chapter: {
                            id: chapterId, chapterNumber, title: result.chapter.title,
                            content: result.chapter.content, summary: result.chapter.summary, wordCount,
                            keyEvents: result.chapter.keyEvents, newCharacters: result.chapter.newCharacters,
                            cliffhanger: result.chapter.cliffhanger,
                        },
                    });
                }
            } catch (err: any) {
                send('error', { message: err.message || '생성 실패' });
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
