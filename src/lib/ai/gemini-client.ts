import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        if (!API_KEY) throw new Error('GEMINI_API_KEY is not set in environment variables');
        genAI = new GoogleGenerativeAI(API_KEY);
    }
    return genAI;
}

export interface GenerationResult {
    text: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface ChapterGenerationOutput {
    title: string;
    content: string;
    newCharacters: string[];
    keyEvents: string[];
    cliffhanger: string;
    summary: string;
}

export async function generateChapter(
    systemPrompt: string,
    contextPrompt: string,
    userDirection: string,
    model: string = 'gemini-2.5-flash'
): Promise<{ result: ChapterGenerationOutput; usage: GenerationResult }> {
    const ai = getGenAI();
    const generativeModel = ai.getGenerativeModel({
        model,
        systemInstruction: systemPrompt,
    });

    const generationConfig: GenerationConfig = {
        temperature: 0.85,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 16384,
        responseMimeType: 'application/json',
        responseSchema: {
            type: 'object' as any,
            properties: {
                title: { type: 'string' as any, description: '챕터 제목' },
                content: { type: 'string' as any, description: '챕터 본문 (3000-5000자)' },
                newCharacters: {
                    type: 'array' as any,
                    items: { type: 'string' as any },
                    description: '이 챕터에서 새로 등장한 캐릭터 이름 목록',
                },
                keyEvents: {
                    type: 'array' as any,
                    items: { type: 'string' as any },
                    description: '이 챕터의 핵심 사건들',
                },
                cliffhanger: { type: 'string' as any, description: '다음 챕터로의 연결고리/긴장감 요소' },
                summary: { type: 'string' as any, description: '이 챕터의 상세 요약 (300-500자)' },
            },
            required: ['title', 'content', 'newCharacters', 'keyEvents', 'cliffhanger', 'summary'],
        },
    };

    const fullPrompt = `${contextPrompt}\n\n---\n\n[현재 챕터 작성 지시]\n${userDirection}`;

    const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig,
    });

    const response = result.response;
    const text = response.text();
    const parsed: ChapterGenerationOutput = JSON.parse(text);

    const usage: GenerationResult = {
        text,
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
    };

    return { result: parsed, usage };
}

export async function generateSummary(
    content: string,
    level: 'detailed' | 'condensed' | 'key_events_only',
    model: string = 'gemini-2.5-flash'
): Promise<string> {
    const ai = getGenAI();
    const generativeModel = ai.getGenerativeModel({ model });

    const instructions: Record<string, string> = {
        detailed: '다음 챕터의 내용을 300-500자로 상세히 요약하세요. 주요 사건, 캐릭터 행동, 감정 변화를 포함하세요.',
        condensed: '다음 챕터의 핵심 내용을 100자 이내로 압축 요약하세요.',
        key_events_only: '다음 챕터에서 향후 스토리에 영향을 미치는 핵심 사건만 50자 이내로 나열하세요.',
    };

    const result = await generativeModel.generateContent(
        `${instructions[level]}\n\n---\n\n${content}`
    );

    return result.response.text();
}

export async function checkConsistency(
    storyBible: string,
    chapterContent: string,
    model: string = 'gemini-2.5-flash'
): Promise<{ issues: string[]; suggestions: string[] }> {
    const ai = getGenAI();
    const generativeModel = ai.getGenerativeModel({
        model,
        generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: 'object' as any,
                properties: {
                    issues: {
                        type: 'array' as any,
                        items: { type: 'string' as any },
                        description: '발견된 일관성 문제 목록',
                    },
                    suggestions: {
                        type: 'array' as any,
                        items: { type: 'string' as any },
                        description: '개선 제안 목록',
                    },
                },
                required: ['issues', 'suggestions'],
            },
        },
    });

    const prompt = `당신은 소설 편집자입니다. 아래 Story Bible(설정)과 새 챕터를 비교하여 일관성 문제를 찾으세요.

[Story Bible]
${storyBible}

[새 챕터]
${chapterContent}

캐릭터 이름/외모/성격 불일치, 타임라인 모순, 설정 충돌, 죽은 캐릭터 재등장 등을 체크하세요.`;

    const result = await generativeModel.generateContent(prompt);
    return JSON.parse(result.response.text());
}

/**
 * 범용 텍스트 생성 (일관성 검증, 커스텀 프롬프트 등에 사용)
 */
export async function generateText(
    prompt: string,
    model: string = 'gemini-2.5-flash'
): Promise<string> {
    const ai = getGenAI();
    const generativeModel = ai.getGenerativeModel({ model });
    const result = await generativeModel.generateContent(prompt);
    return result.response.text();
}
