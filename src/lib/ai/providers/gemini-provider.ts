import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';
import { AIProvider, ModelInfo, GenerationResult, CostEstimate, ChapterOutput, USD_TO_KRW } from './types';

const GEMINI_MODELS: ModelInfo[] = [
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        inputPricePerMToken: 0.15,
        outputPricePerMToken: 0.60,
        maxOutputTokens: 65536,
        description: '빠르고 저렴, 일반 소설 생성에 최적',
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        inputPricePerMToken: 1.25,
        outputPricePerMToken: 10.0,
        maxOutputTokens: 65536,
        description: '최고 품질, 복잡한 플롯이나 문학적 문체에 적합',
    },
];

export class GeminiProvider implements AIProvider {
    name = 'Gemini';
    id = 'gemini';
    models = GEMINI_MODELS;
    private genAI: GoogleGenerativeAI | null = null;

    private getClient(): GoogleGenerativeAI {
        if (!this.genAI) {
            const key = process.env.GEMINI_API_KEY;
            if (!key) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다');
            this.genAI = new GoogleGenerativeAI(key);
        }
        return this.genAI;
    }

    isConfigured(): boolean {
        return !!process.env.GEMINI_API_KEY;
    }

    async generateChapter(
        systemPrompt: string,
        contextPrompt: string,
        userDirection: string,
        model: string = 'gemini-2.5-flash',
    ): Promise<GenerationResult> {
        const ai = this.getClient();
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
                    title: { type: 'string' as any },
                    content: { type: 'string' as any },
                    newCharacters: { type: 'array' as any, items: { type: 'string' as any } },
                    keyEvents: { type: 'array' as any, items: { type: 'string' as any } },
                    cliffhanger: { type: 'string' as any },
                    summary: { type: 'string' as any },
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
        const parsed: ChapterOutput = JSON.parse(response.text());

        return {
            chapter: parsed,
            usage: {
                promptTokens: response.usageMetadata?.promptTokenCount || 0,
                completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: response.usageMetadata?.totalTokenCount || 0,
            },
        };
    }

    async generateText(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
        const ai = this.getClient();
        const generativeModel = ai.getGenerativeModel({ model });
        const result = await generativeModel.generateContent(prompt);
        return result.response.text();
    }

    estimateCost(inputTokens: number, outputTokens: number, model: string = 'gemini-2.5-flash'): CostEstimate {
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
