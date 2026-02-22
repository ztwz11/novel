/**
 * 삽화/일러스트 생성 모듈
 * 챕터 내용을 분석하여 이미지 프롬프트 생성 → 이미지 AI 호출
 */

import { getDb } from '@/lib/db';
import { generateText } from '@/lib/ai/gemini-client';
import { randomUUID } from 'crypto';

export type IllustrationType = 'scene' | 'character' | 'background' | 'cover';
export type IllustrationProvider = 'gemini' | 'openai' | 'manual';
export type IllustrationStyle =
    | 'anime'        // 애니메이션/만화 스타일
    | 'manhwa'       // 한국 웹툰 스타일
    | 'watercolor'   // 수채화
    | 'oil_painting' // 유화
    | 'digital_art'  // 디지털 아트
    | 'ink_wash'     // 수묵화 (무협)
    | 'concept_art'  // 컨셉 아트
    | 'realistic';   // 사실적

const STYLE_PROMPTS: Record<IllustrationStyle, string> = {
    anime: 'anime art style, vibrant colors, cel shading, detailed eyes',
    manhwa: 'Korean manhwa style, webtoon art, clean linework, dynamic composition',
    watercolor: 'watercolor painting, soft edges, flowing colors, artistic',
    oil_painting: 'oil painting style, rich texture, classical art, detailed brushwork',
    digital_art: 'digital art, high detail, vibrant, professional illustration',
    ink_wash: 'East Asian ink wash painting, sumi-e style, calligraphic, atmospheric',
    concept_art: 'concept art, professional, detailed, cinematic lighting',
    realistic: 'photorealistic, ultra detailed, cinematic lighting, 8k',
};

const TYPE_INSTRUCTIONS: Record<IllustrationType, string> = {
    scene: '이 챕터의 가장 인상적인 장면 하나를 선택하여 시각적으로 묘사해주세요. 인물의 표정, 포즈, 배경, 빛과 그림자를 포함하세요.',
    character: 'Story Bible의 캐릭터 설정을 기반으로 이 캐릭터의 전신 또는 상반신 초상화를 묘사해주세요. 외모, 의상, 무기, 분위기를 포함하세요.',
    background: '이 장소/배경의 전경을 묘사해주세요. 건축물, 자연, 분위기, 시간대를 포함하세요.',
    cover: '이 권의 표지 일러스트를 묘사해주세요. 주인공의 역동적인 포즈, 배경, 전체적인 무드를 포함하세요.',
};

export interface IllustrationRequest {
    chapterId?: string;
    projectId: string;
    type: IllustrationType;
    provider: IllustrationProvider;
    style: IllustrationStyle;
    customPrompt?: string;
    characterName?: string; // 캐릭터 초상 시
}

export interface IllustrationResult {
    id: string;
    prompt: string;
    translatedPrompt: string; // 영문 프롬프트
    imageUrl?: string;
    imageData?: string; // base64
    provider: string;
}

/**
 * 챕터 내용에서 이미지 프롬프트 생성
 */
export async function generateImagePrompt(
    request: IllustrationRequest,
): Promise<{ prompt: string; translatedPrompt: string }> {
    const db = getDb();

    let contextText = '';

    if (request.chapterId) {
        const chapter = db.prepare('SELECT chapter_number, title, content FROM chapters WHERE id = ?')
            .get(request.chapterId) as { chapter_number: number; title: string; content: string } | undefined;

        if (chapter) {
            contextText = `[챕터 ${chapter.chapter_number}화: ${chapter.title}]\n${chapter.content.substring(0, 4000)}`;
        }
    }

    if (request.type === 'character' && request.characterName) {
        const charEntry = db.prepare(
            `SELECT content FROM story_bible_entries WHERE project_id = ? AND name LIKE ?`
        ).get(request.projectId, `%${request.characterName}%`) as { content: string } | undefined;

        if (charEntry) {
            contextText += `\n\n[캐릭터 설정]\n${charEntry.content}`;
        }
    }

    const typeInstruction = TYPE_INSTRUCTIONS[request.type];
    const styleHint = STYLE_PROMPTS[request.style];

    const prompt = `당신은 소설 삽화를 위한 이미지 프롬프트 전문가입니다.

[요청 유형] ${request.type === 'scene' ? '장면 삽화' : request.type === 'character' ? '캐릭터 초상' : request.type === 'background' ? '배경' : '표지'}
${typeInstruction}

[스타일] ${styleHint}

${contextText}

${request.customPrompt ? `[추가 지시] ${request.customPrompt}` : ''}

다음 JSON 형식으로 응답하세요:
{"korean_prompt": "한국어로 된 상세 장면 묘사 (3-5문장)", "english_prompt": "English image generation prompt, detailed, with style keywords, comma-separated descriptors (max 200 words)"}`;

    const result = await generateText(prompt);

    let parsed: { korean_prompt: string; english_prompt: string };
    try {
        parsed = JSON.parse(result);
    } catch {
        parsed = {
            korean_prompt: result.substring(0, 300),
            english_prompt: `${styleHint}, fantasy illustration, detailed`,
        };
    }

    return {
        prompt: parsed.korean_prompt,
        translatedPrompt: parsed.english_prompt,
    };
}

/**
 * Gemini Imagen으로 이미지 생성
 */
async function generateWithGemini(prompt: string): Promise<{ imageData?: string; imageUrl?: string }> {
    // Gemini Imagen 3 API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt }],
                parameters: { sampleCount: 1, aspectRatio: '3:4' },
            }),
        },
    );

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini Imagen error: ${err}`);
    }

    const data = await response.json();
    const imageBytes = data.predictions?.[0]?.bytesBase64Encoded;

    return { imageData: imageBytes || undefined };
}

/**
 * OpenAI DALL-E로 이미지 생성
 */
async function generateWithOpenAI(prompt: string): Promise<{ imageUrl?: string }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set. .env.local에 OPENAI_API_KEY를 설정하세요.');

    const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'dall-e-3',
            prompt: prompt,
            n: 1,
            size: '1024x1536',
            quality: 'hd',
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI DALL-E error: ${err}`);
    }

    const data = await response.json();
    return { imageUrl: data.data?.[0]?.url };
}

/**
 * 삽화 생성 메인 함수
 */
export async function generateIllustration(request: IllustrationRequest): Promise<IllustrationResult> {
    const db = getDb();

    // 1. 프롬프트 생성
    const prompts = await generateImagePrompt(request);

    // 2. Provider에 따라 이미지 생성
    let imageUrl: string | undefined;
    let imageData: string | undefined;

    if (request.provider === 'gemini') {
        const result = await generateWithGemini(prompts.translatedPrompt);
        imageData = result.imageData;
    } else if (request.provider === 'openai') {
        const result = await generateWithOpenAI(prompts.translatedPrompt);
        imageUrl = result.imageUrl;
    }
    // 'manual' provider: 프롬프트만 생성, 이미지는 사용자가 직접 생성

    // 3. DB에 저장
    const id = randomUUID();
    db.prepare(
        `INSERT INTO illustrations (id, project_id, chapter_id, type, provider, prompt, image_url, image_data, style, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
        id,
        request.projectId,
        request.chapterId || null,
        request.type,
        request.provider,
        prompts.translatedPrompt,
        imageUrl || '',
        imageData || '',
        request.style,
        JSON.stringify({ koreanPrompt: prompts.prompt, customPrompt: request.customPrompt }),
    );

    return {
        id,
        prompt: prompts.prompt,
        translatedPrompt: prompts.translatedPrompt,
        imageUrl,
        imageData,
        provider: request.provider,
    };
}

/**
 * 프로젝트의 모든 삽화 조회
 */
export function getProjectIllustrations(projectId: string) {
    const db = getDb();
    return db.prepare(
        `SELECT i.*, c.chapter_number, c.title as chapter_title
     FROM illustrations i
     LEFT JOIN chapters c ON i.chapter_id = c.id
     WHERE i.project_id = ?
     ORDER BY i.created_at DESC`
    ).all(projectId);
}
