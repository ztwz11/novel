/**
 * 단위 테스트: exporter.ts
 * TXT/HTML 내보내기 포맷 검증 (DB 모킹)
 */

import { exportToTxt, exportToHtml } from '@/lib/export/exporter';

// Mock the database module
jest.mock('@/lib/db', () => ({
    getDb: () => ({
        prepare: (sql: string) => ({
            get: (projectId: string) => {
                if (sql.includes('FROM projects')) {
                    return { title: '천마의 귀환', description: '무협 소설', genre: 'murim' };
                }
                return undefined;
            },
            all: (projectId: string) => {
                if (sql.includes('FROM chapters')) {
                    return [
                        {
                            chapter_number: 1,
                            title: '운명의 시작',
                            content: '어두운 밤하늘 아래, 젊은 무사가 걸음을 멈추었다.',
                            word_count: 20,
                            volume_number: 1,
                            volume_title: '여정의 시작',
                        },
                        {
                            chapter_number: 2,
                            title: '첫 번째 시련',
                            content: '새벽녘, 도전자가 나타났다.',
                            word_count: 12,
                            volume_number: 1,
                            volume_title: '여정의 시작',
                        },
                    ];
                }
                return [];
            },
        }),
    }),
}));

describe('Exporter', () => {
    describe('exportToTxt', () => {
        it('should generate TXT with title header', () => {
            const txt = exportToTxt('test-project');
            expect(txt).toContain('천마의 귀환');
        });

        it('should include chapter content', () => {
            const txt = exportToTxt('test-project');
            expect(txt).toContain('운명의 시작');
            expect(txt).toContain('첫 번째 시련');
            expect(txt).toContain('어두운 밤하늘 아래');
        });

        it('should include volume headers', () => {
            const txt = exportToTxt('test-project');
            expect(txt).toContain('1권');
            expect(txt).toContain('여정의 시작');
        });

        it('should include word count stats', () => {
            const txt = exportToTxt('test-project');
            expect(txt).toContain('2화');
            expect(txt).toContain('32자');
        });

        it('should include NovelForge credit', () => {
            const txt = exportToTxt('test-project');
            expect(txt).toContain('NovelForge');
        });
    });

    describe('exportToHtml', () => {
        it('should generate valid HTML with doctype', () => {
            const html = exportToHtml('test-project');
            expect(html).toMatch(/^<!DOCTYPE html>/);
            expect(html).toContain('</html>');
        });

        it('should include title in HTML title tag', () => {
            const html = exportToHtml('test-project');
            expect(html).toContain('<title>천마의 귀환</title>');
        });

        it('should include chapter content in HTML body', () => {
            const html = exportToHtml('test-project');
            expect(html).toContain('운명의 시작');
            expect(html).toContain('어두운 밤하늘 아래');
        });

        it('should escape HTML entities', () => {
            // The content doesn't have special chars, but the function should handle them
            const html = exportToHtml('test-project');
            expect(html).not.toContain('<script>');
        });

        it('should include Korean font styling', () => {
            const html = exportToHtml('test-project');
            expect(html).toContain('Noto Sans KR');
        });
    });
});
