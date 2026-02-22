// AI Provider 공통 인터페이스

export interface ChapterOutput {
    title: string;
    content: string;
    newCharacters: string[];
    keyEvents: string[];
    cliffhanger: string;
    summary: string;
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface GenerationResult {
    chapter: ChapterOutput;
    usage: TokenUsage;
}

export interface ModelInfo {
    id: string;
    name: string;
    inputPricePerMToken: number;   // USD per 1M tokens
    outputPricePerMToken: number;  // USD per 1M tokens
    maxOutputTokens: number;
    description: string;
}

export interface CostEstimate {
    provider: string;
    model: string;
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    estimatedCostUSD: number;
    estimatedCostKRW: number;  // ~1450 KRW/USD
}

export interface AIProvider {
    name: string;
    id: string;
    models: ModelInfo[];
    isConfigured(): boolean;
    generateChapter(
        systemPrompt: string,
        contextPrompt: string,
        userDirection: string,
        model?: string,
    ): Promise<GenerationResult>;
    generateText(prompt: string, model?: string): Promise<string>;
    estimateCost(inputTokens: number, outputTokens: number, model?: string): CostEstimate;
}

// 토큰 추정 (한국어 기준)
export function estimateTokens(text: string): number {
    if (!text) return 0;
    const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length;
    const otherChars = text.length - koreanChars;
    return Math.ceil(koreanChars / 1.5 + otherChars / 4);
}

// 환율 상수
export const USD_TO_KRW = 1450;

export const CHAPTER_RESPONSE_SCHEMA = {
    title: '챕터 제목',
    content: '챕터 본문 (3000-5000자)',
    newCharacters: '이 챕터에서 새로 등장한 캐릭터 이름 목록',
    keyEvents: '이 챕터의 핵심 사건들',
    cliffhanger: '다음 챕터로의 연결고리/긴장감 요소',
    summary: '이 챕터의 상세 요약 (300-500자)',
};
