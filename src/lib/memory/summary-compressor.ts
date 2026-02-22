/**
 * 요약 압축 파이프라인
 * 챕터가 쌓일수록 오래된 요약을 자동 압축하여 토큰 효율을 높인다.
 * 
 * 3단계 압축:
 *  1. detailed_summary   (300~500자) — 최근 5화 이내
 *  2. condensed_summary  (100~200자) — 6~20화 전
 *  3. key_events_summary (50~100자)  — 21화 이전
 */

import { getDb } from '@/lib/db';
import { generateSummary } from '@/lib/ai/gemini-client';

interface ChapterForCompression {
    id: string;
    chapter_number: number;
    title: string;
    content: string;
    summary: string;
    detailed_summary: string;
    condensed_summary: string;
    key_events_summary: string;
    volume_number: number;
}

/**
 * 프로젝트 전체의 요약을 점검하고 필요 시 압축
 * - detailed → condensed: 현재 챕터 기준 6화 이상 차이나는 챕터
 * - condensed → key_events: 현재 챕터 기준 21화 이상 차이나는 챕터
 */
export async function compressSummaries(projectId: string, currentChapterNumber: number): Promise<{
    compressed: number;
    errors: string[];
}> {
    const db = getDb();
    let compressed = 0;
    const errors: string[] = [];

    // 모든 챕터의 요약 상태 가져오기
    const chapters = db.prepare(
        `SELECT c.id, c.chapter_number, c.title, c.content, c.summary,
            c.detailed_summary, c.condensed_summary, c.key_events_summary,
            v.volume_number
     FROM chapters c
     JOIN volumes v ON c.volume_id = v.id
     WHERE v.project_id = ?
     ORDER BY v.volume_number, c.chapter_number`
    ).all(projectId) as ChapterForCompression[];

    for (const ch of chapters) {
        const chaptersAgo = currentChapterNumber - ch.chapter_number;

        try {
            // 6화 이상 전인데 condensed_summary가 없는 경우 → 압축
            if (chaptersAgo >= 6 && !ch.condensed_summary && (ch.detailed_summary || ch.summary)) {
                const sourceText = ch.detailed_summary || ch.summary;
                const condensed = await generateSummary(
                    sourceText,
                    'condensed',
                );
                db.prepare('UPDATE chapters SET condensed_summary = ? WHERE id = ?')
                    .run(condensed, ch.id);
                compressed++;
            }

            // 21화 이상 전인데 key_events_summary가 없는 경우 → 핵심 이벤트만
            if (chaptersAgo >= 21 && !ch.key_events_summary && (ch.condensed_summary || ch.summary)) {
                const sourceText = ch.condensed_summary || ch.summary;
                const keyEvents = await generateSummary(
                    sourceText,
                    'key_events_only',
                );
                db.prepare('UPDATE chapters SET key_events_summary = ? WHERE id = ?')
                    .run(keyEvents, ch.id);
                compressed++;
            }
        } catch (err: any) {
            errors.push(`${ch.chapter_number}화: ${err.message}`);
        }
    }

    return { compressed, errors };
}

/**
 * 볼륨 시놉시스 자동 생성/갱신
 * 해당 볼륨의 모든 챕터 요약을 기반으로 볼륨 전체 시놉시스 생성
 */
export async function generateVolumeSynopsis(volumeId: string): Promise<string> {
    const db = getDb();

    const volume = db.prepare('SELECT id, title, volume_number FROM volumes WHERE id = ?')
        .get(volumeId) as { id: string; title: string; volume_number: number } | undefined;

    if (!volume) throw new Error('Volume not found');

    const chapters = db.prepare(
        `SELECT chapter_number, title, summary, condensed_summary
     FROM chapters WHERE volume_id = ? ORDER BY chapter_number`
    ).all(volumeId) as { chapter_number: number; title: string; summary: string; condensed_summary: string }[];

    if (chapters.length === 0) return '';

    const summaryText = chapters.map(ch =>
        `${ch.chapter_number}화 "${ch.title}": ${ch.condensed_summary || ch.summary}`
    ).join('\n');

    const synopsis = await generateSummary(
        summaryText,
        'detailed',
    );

    db.prepare('UPDATE volumes SET synopsis = ? WHERE id = ?')
        .run(synopsis, volumeId);

    return synopsis;
}

/**
 * 컨텍스트 토큰 사용량 분석
 */
export function analyzeTokenUsage(projectId: string): {
    totalChapters: number;
    totalWords: number;
    estimatedContextTokens: number;
    compressionNeeded: boolean;
    chaptersNeedingCondensed: number;
    chaptersNeedingKeyEvents: number;
} {
    const db = getDb();

    const stats = db.prepare(
        `SELECT COUNT(*) as count, COALESCE(SUM(word_count), 0) as words
     FROM chapters c JOIN volumes v ON c.volume_id = v.id
     WHERE v.project_id = ?`
    ).get(projectId) as { count: number; words: number };

    const needCondensed = db.prepare(
        `SELECT COUNT(*) as count FROM chapters c JOIN volumes v ON c.volume_id = v.id
     WHERE v.project_id = ? AND c.condensed_summary IS NULL AND c.chapter_number <= ?`
    ).get(projectId, stats.count - 5) as { count: number };

    const needKeyEvents = db.prepare(
        `SELECT COUNT(*) as count FROM chapters c JOIN volumes v ON c.volume_id = v.id
     WHERE v.project_id = ? AND c.key_events_summary IS NULL AND c.chapter_number <= ?`
    ).get(projectId, stats.count - 20) as { count: number };

    return {
        totalChapters: stats.count,
        totalWords: stats.words,
        estimatedContextTokens: Math.ceil(stats.words / 1.5), // rough Korean estimation
        compressionNeeded: needCondensed.count > 0 || needKeyEvents.count > 0,
        chaptersNeedingCondensed: needCondensed.count,
        chaptersNeedingKeyEvents: needKeyEvents.count,
    };
}
