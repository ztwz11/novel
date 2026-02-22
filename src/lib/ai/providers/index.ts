import { AIProvider } from './types';
import { GeminiProvider } from './gemini-provider';
import { OpenAIProvider } from './openai-provider';
import { AnthropicProvider } from './anthropic-provider';

// Provider registry
const providers: Record<string, AIProvider> = {
    gemini: new GeminiProvider(),
    openai: new OpenAIProvider(),
    anthropic: new AnthropicProvider(),
};

export function getProvider(id: string): AIProvider {
    const provider = providers[id];
    if (!provider) throw new Error(`Unknown provider: ${id}`);
    return provider;
}

export function getAllProviders(): AIProvider[] {
    return Object.values(providers);
}

export function getConfiguredProviders(): AIProvider[] {
    return Object.values(providers).filter(p => p.isConfigured());
}

export function getProviderInfo() {
    return Object.values(providers).map(p => ({
        id: p.id,
        name: p.name,
        configured: p.isConfigured(),
        models: p.models,
    }));
}

export type { AIProvider, CostEstimate, ModelInfo } from './types';
