/**
 * 단위 테스트: genre-presets.ts
 * 장르 프리셋 구조 및 데이터 정합성 검증
 */

import { GENRE_PRESETS, getGenrePreset } from '@/lib/genre/genre-presets';

describe('Genre Presets', () => {
    const expectedGenres = ['murim', 'fusion_murim', 'traditional_fantasy', 'modern_fantasy'];

    it('should have all 4 Korean web novel genres', () => {
        expect(Object.keys(GENRE_PRESETS)).toEqual(expect.arrayContaining(expectedGenres));
        expect(Object.keys(GENRE_PRESETS).length).toBe(4);
    });

    describe.each(expectedGenres)('Genre: %s', (genreId) => {
        const preset = GENRE_PRESETS[genreId];

        it('should have required fields', () => {
            expect(preset.id).toBe(genreId);
            expect(typeof preset.name).toBe('string');
            expect(preset.name.length).toBeGreaterThan(0);
            expect(typeof preset.emoji).toBe('string');
            expect(typeof preset.description).toBe('string');
        });

        it('should have a non-empty system prompt template', () => {
            expect(typeof preset.systemPromptTemplate).toBe('string');
            expect(preset.systemPromptTemplate.length).toBeGreaterThan(50);
        });

        it('should have story bible categories', () => {
            expect(Array.isArray(preset.storyBibleCategories)).toBe(true);
            expect(preset.storyBibleCategories.length).toBeGreaterThan(0);
            preset.storyBibleCategories.forEach(cat => {
                expect(cat).toHaveProperty('category');
                expect(cat).toHaveProperty('label');
                expect(cat).toHaveProperty('description');
            });
        });

        it('should have default style', () => {
            expect(preset.defaultStyle).toHaveProperty('tone');
            expect(preset.defaultStyle).toHaveProperty('perspective');
        });

        it('should have default rules', () => {
            expect(Array.isArray(preset.defaultRules)).toBe(true);
            expect(preset.defaultRules.length).toBeGreaterThan(0);
        });
    });

    describe('getGenrePreset', () => {
        it('should return correct preset by id', () => {
            const murim = getGenrePreset('murim');
            expect(murim?.name).toBe('무협');
        });

        it('should return null for invalid id', () => {
            const result = getGenrePreset('nonexistent');
            expect(result).toBeNull();
        });
    });
});
