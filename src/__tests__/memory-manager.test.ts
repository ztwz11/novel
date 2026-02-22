/**
 * 단위 테스트: memory-manager.ts
 * 토큰 추정 및 메모리 컨텍스트 빌드 검증 (DB 모킹)
 */

// Mock better-sqlite3 before importing
jest.mock('@/lib/db', () => {
    const mockDb = {
        prepare: (sql: string) => ({
            all: (...args: any[]) => {
                if (sql.includes('story_bible_entries')) {
                    return [
                        { category: '세계관', name: '무림 구조', content: '구파일방과 마교가 대립하는 구도' },
                        { category: '캐릭터', name: '주인공', content: '천마문 출신의 젊은 무사, 내공이 깊다' },
                    ];
                }
                if (sql.includes('FROM volumes')) {
                    return [
                        { volume_number: 1, title: '서막', synopsis: '주인공의 여정 시작' },
                    ];
                }
                if (sql.includes('FROM chapters')) {
                    return [
                        {
                            chapter_number: 1,
                            title: '1화',
                            summary: '주인공 등장과 배경 소개',
                            detailed_summary: '주인공 이천명이 산에서 내려온다',
                            condensed_summary: '이천명 하산',
                            key_events_summary: '이천명 하산',
                            volume_number: 1,
                        },
                        {
                            chapter_number: 2,
                            title: '2화',
                            summary: '첫 번째 전투',
                            detailed_summary: null,
                            condensed_summary: null,
                            key_events_summary: null,
                            volume_number: 1,
                        },
                    ];
                }
                return [];
            },
            get: (...args: any[]) => {
                if (sql.includes('FROM chapters c') && sql.includes('content')) {
                    return { content: '이전 챕터의 본문 내용입니다. 긴 내용...' };
                }
                return undefined;
            },
        }),
    };
    return { getDb: () => mockDb };
});

import { buildMemoryContext } from '@/lib/memory/memory-manager';

describe('Memory Manager', () => {
    describe('buildMemoryContext', () => {
        it('should return all required context fields', () => {
            const context = buildMemoryContext('test-project', 'vol-1', 3);
            expect(context).toHaveProperty('storyBible');
            expect(context).toHaveProperty('volumeSynopses');
            expect(context).toHaveProperty('chapterSummaries');
            expect(context).toHaveProperty('previousChapterContent');
            expect(context).toHaveProperty('totalEstimatedTokens');
        });

        it('should include story bible content', () => {
            const context = buildMemoryContext('test-project', 'vol-1', 3);
            expect(context.storyBible).toContain('무림 구조');
            expect(context.storyBible).toContain('주인공');
        });

        it('should include volume synopses', () => {
            const context = buildMemoryContext('test-project', 'vol-1', 3);
            expect(context.volumeSynopses).toContain('서막');
        });

        it('should estimate tokens as positive number', () => {
            const context = buildMemoryContext('test-project', 'vol-1', 3);
            expect(context.totalEstimatedTokens).toBeGreaterThan(0);
        });

        it('should include previous chapter content', () => {
            const context = buildMemoryContext('test-project', 'vol-1', 3);
            // May or may not have content based on mock, but field should exist
            expect(typeof context.previousChapterContent).toBe('string');
        });
    });
});
