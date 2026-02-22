/**
 * 단위 테스트: novel-settings.ts
 * settingsToPromptRules() 함수의 정확한 규칙 변환 검증
 */

import { DEFAULT_NOVEL_SETTINGS, settingsToPromptRules } from '@/lib/settings/novel-settings';
import type { NovelSettings } from '@/lib/settings/novel-settings';

describe('Novel Settings', () => {
    describe('DEFAULT_NOVEL_SETTINGS', () => {
        it('should have all required top-level categories', () => {
            expect(DEFAULT_NOVEL_SETTINGS).toHaveProperty('writingStyle');
            expect(DEFAULT_NOVEL_SETTINGS).toHaveProperty('maturity');
            expect(DEFAULT_NOVEL_SETTINGS).toHaveProperty('fusion');
            expect(DEFAULT_NOVEL_SETTINGS).toHaveProperty('storyDirection');
            expect(DEFAULT_NOVEL_SETTINGS).toHaveProperty('structure');
            expect(DEFAULT_NOVEL_SETTINGS).toHaveProperty('worldBuilding');
        });

        it('should have valid default writing style', () => {
            const ws = DEFAULT_NOVEL_SETTINGS.writingStyle;
            expect(ws.perspective).toBe('1인칭');
            expect(ws.descriptionDensity).toBeGreaterThanOrEqual(1);
            expect(ws.descriptionDensity).toBeLessThanOrEqual(5);
        });

        it('should have valid default maturity levels', () => {
            const m = DEFAULT_NOVEL_SETTINGS.maturity;
            expect(m.violenceLevel).toBeGreaterThanOrEqual(1);
            expect(m.violenceLevel).toBeLessThanOrEqual(5);
            expect(m.romanceLevel).toBeGreaterThanOrEqual(1);
            expect(m.romanceLevel).toBeLessThanOrEqual(5);
        });
    });

    describe('settingsToPromptRules', () => {
        it('should return an array of string rules', () => {
            const rules = settingsToPromptRules(DEFAULT_NOVEL_SETTINGS);
            expect(Array.isArray(rules)).toBe(true);
            expect(rules.length).toBeGreaterThan(0);
            rules.forEach(rule => {
                expect(typeof rule).toBe('string');
                expect(rule.length).toBeGreaterThan(0);
            });
        });

        it('should include perspective rule', () => {
            const rules = settingsToPromptRules(DEFAULT_NOVEL_SETTINGS);
            const perspectiveRule = rules.find(r => r.includes('시점'));
            expect(perspectiveRule).toBeDefined();
        });

        it('should include maturity/rating rules', () => {
            const settings: NovelSettings = {
                ...DEFAULT_NOVEL_SETTINGS,
                maturity: { ...DEFAULT_NOVEL_SETTINGS.maturity, overallRating: '성인', violenceLevel: 5 },
            };
            const rules = settingsToPromptRules(settings);
            const ratingRule = rules.find(r => r.includes('성인'));
            expect(ratingRule).toBeDefined();
        });

        it('should include fusion rules when enabled', () => {
            const settings: NovelSettings = {
                ...DEFAULT_NOVEL_SETTINGS,
                fusion: {
                    ...DEFAULT_NOVEL_SETTINGS.fusion,
                    regression: true,
                    isekai: true,
                },
            };
            const rules = settingsToPromptRules(settings);
            const regressionRule = rules.find(r => r.includes('회귀'));
            const isekaiRule = rules.find(r => r.includes('이세계'));
            expect(regressionRule).toBeDefined();
            expect(isekaiRule).toBeDefined();
        });

        it('should include structure rules with custom word count', () => {
            const settings: NovelSettings = {
                ...DEFAULT_NOVEL_SETTINGS,
                structure: { ...DEFAULT_NOVEL_SETTINGS.structure, wordsPerChapter: 5000 },
            };
            const rules = settingsToPromptRules(settings);
            const wordRule = rules.find(r => r.includes('5000'));
            expect(wordRule).toBeDefined();
        });

        it('should include ending type rule', () => {
            const settings: NovelSettings = {
                ...DEFAULT_NOVEL_SETTINGS,
                storyDirection: { ...DEFAULT_NOVEL_SETTINGS.storyDirection, endingType: '배드엔딩' },
            };
            const rules = settingsToPromptRules(settings);
            const endingRule = rules.find(r => r.includes('배드엔딩'));
            expect(endingRule).toBeDefined();
        });

        it('should include world building power system', () => {
            const settings: NovelSettings = {
                ...DEFAULT_NOVEL_SETTINGS,
                worldBuilding: {
                    ...DEFAULT_NOVEL_SETTINGS.worldBuilding,
                    powerSystem: {
                        name: '내공',
                        levels: ['초급', '중급', '고급', '절정', '화경'],
                        description: '내공 기반 무공 체계',
                        hardOrSoft: '하드 매직',
                    },
                },
            };
            const rules = settingsToPromptRules(settings);
            const powerRule = rules.find(r => r.includes('내공'));
            expect(powerRule).toBeDefined();
        });

        it('should handle prohibited content list', () => {
            const settings: NovelSettings = {
                ...DEFAULT_NOVEL_SETTINGS,
                maturity: {
                    ...DEFAULT_NOVEL_SETTINGS.maturity,
                    prohibitedContent: ['아동학대', '자살 미화'],
                },
            };
            const rules = settingsToPromptRules(settings);
            const prohibitedRule = rules.find(r => r.includes('금지'));
            expect(prohibitedRule).toBeDefined();
        });
    });
});
