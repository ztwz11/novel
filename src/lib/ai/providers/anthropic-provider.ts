import { AIProvider, ModelInfo, GenerationResult, CostEstimate, ChapterOutput, USD_TO_KRW } from './types';

const ANTHROPIC_MODELS: ModelInfo[] = [
    {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        inputPricePerMToken: 3.0,
        outputPricePerMToken: 15.0,
        maxOutputTokens: 16384,
        description: '최고 문학 품질, 감정/대화 묘사에 탁월',
    },
    {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        inputPricePerMToken: 0.80,
        outputPricePerMToken: 4.0,
        maxOutputTokens: 8192,
        description: '빠르고 합리적 가격, 일반 소설에 적합',
    },
];

const JSON_INSTRUCTION = `반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요:
{
  "title": "챕터 제목",
  "content": "챕터 본문 (3000-5000자)",
  "newCharacters": ["새 캐릭터1"],
  "keyEvents": ["핵심 사건1"],
  "cliffhanger": "다음 챕터 연결고리",
  "summary": "상세 요약 (300-500자)"
}`;

export class AnthropicProvider implements AIProvider {
    name = 'Anthropic';
    id = 'anthropic';
    models = ANTHROPIC_MODELS;

    isConfigured(): boolean {
        return !!process.env.ANTHROPIC_API_KEY;
    }

    private getKey(): string {
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다');
        return key;
    }

    async generateChapter(
        systemPrompt: string,
        contextPrompt: string,
        userDirection: string,
        model: string = 'claude-sonnet-4-20250514',
    ): Promise<GenerationResult> {
        const fullContext = `${contextPrompt}\n\n---\n\n[현재 챕터 작성 지시]\n${userDirection}\n\n${JSON_INSTRUCTION}`;

        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.getKey(),
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 16384,
                temperature: 0.85,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: fullContext },
                ],
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(`Anthropic API 오류: ${err.error?.message || res.statusText}`);
        }

        const data = await res.json();
        const text = data.content[0]?.text || '';

        // Extract JSON from response (Claude may wrap in markdown)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Anthropic 응답에서 JSON을 찾을 수 없습니다');

        const parsed: ChapterOutput = JSON.parse(jsonMatch[0]);

        return {
            chapter: parsed,
            usage: {
                promptTokens: data.usage?.input_tokens || 0,
                completionTokens: data.usage?.output_tokens || 0,
                totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            },
        };
    }

    async generateText(prompt: string, model: string = 'claude-sonnet-4-20250514'): Promise<string> {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.getKey(),
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 4096,
                temperature: 0.7,
                messages: [{ role: 'user', content: prompt }],
            }),
        });

        if (!res.ok) throw new Error('Anthropic API 오류');
        const data = await res.json();
        return data.content[0]?.text || '';
    }

    estimateCost(inputTokens: number, outputTokens: number, model: string = 'claude-sonnet-4-20250514'): CostEstimate {
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
