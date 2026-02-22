import { AIProvider, ModelInfo, GenerationResult, CostEstimate, ChapterOutput, USD_TO_KRW, CHAPTER_RESPONSE_SCHEMA } from './types';

const OPENAI_MODELS: ModelInfo[] = [
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        inputPricePerMToken: 2.50,
        outputPricePerMToken: 10.0,
        maxOutputTokens: 16384,
        description: '높은 품질, 복잡한 문체와 감정 묘사에 강점',
    },
    {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        inputPricePerMToken: 0.15,
        outputPricePerMToken: 0.60,
        maxOutputTokens: 16384,
        description: '저렴하고 빠름, 일반 소설 생성에 적합',
    },
];

export class OpenAIProvider implements AIProvider {
    name = 'OpenAI';
    id = 'openai';
    models = OPENAI_MODELS;

    isConfigured(): boolean {
        return !!process.env.OPENAI_API_KEY;
    }

    private getKey(): string {
        const key = process.env.OPENAI_API_KEY;
        if (!key) throw new Error('OPENAI_API_KEY가 설정되지 않았습니다');
        return key;
    }

    async generateChapter(
        systemPrompt: string,
        contextPrompt: string,
        userDirection: string,
        model: string = 'gpt-4o-mini',
    ): Promise<GenerationResult> {
        const fullContext = `${contextPrompt}\n\n---\n\n[현재 챕터 작성 지시]\n${userDirection}`;

        const jsonSchema = {
            type: 'object',
            properties: {
                title: { type: 'string', description: '챕터 제목' },
                content: { type: 'string', description: '챕터 본문 (3000-5000자)' },
                newCharacters: { type: 'array', items: { type: 'string' }, description: '새 등장 캐릭터' },
                keyEvents: { type: 'array', items: { type: 'string' }, description: '핵심 사건' },
                cliffhanger: { type: 'string', description: '다음 챕터 연결고리' },
                summary: { type: 'string', description: '상세 요약 (300-500자)' },
            },
            required: ['title', 'content', 'newCharacters', 'keyEvents', 'cliffhanger', 'summary'],
            additionalProperties: false,
        };

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getKey()}`,
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: fullContext },
                ],
                temperature: 0.85,
                max_tokens: 16384,
                response_format: {
                    type: 'json_schema',
                    json_schema: { name: 'chapter_output', strict: true, schema: jsonSchema },
                },
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`OpenAI API 오류: ${err.error?.message || res.statusText}`);
        }

        const data = await res.json();
        const parsed: ChapterOutput = JSON.parse(data.choices[0].message.content);

        return {
            chapter: parsed,
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0,
            },
        };
    }

    async generateText(prompt: string, model: string = 'gpt-4o-mini'): Promise<string> {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getKey()}`,
            },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 4096,
            }),
        });

        if (!res.ok) throw new Error('OpenAI API 오류');
        const data = await res.json();
        return data.choices[0].message.content;
    }

    estimateCost(inputTokens: number, outputTokens: number, model: string = 'gpt-4o-mini'): CostEstimate {
        const modelInfo = this.models.find(m => m.id === model) || this.models[0];
        const costUSD = (inputTokens * modelInfo.inputPricePerMToken + outputTokens * modelInfo.outputPricePerMToken) / 1_000_000;
        return {
            provider: this.id,
            model,
            estimatedInputTokens: inputTokens,
            estimatedOutputTokens: outputTokens,
            estimatedCostUSD: Math.round(costUSD * 10000) / 10000,
            estimatedCostKRW: Math.round(costUSD * USD_TO_KRW),
        };
    }
}
