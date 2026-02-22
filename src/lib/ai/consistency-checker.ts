/**
 * 일관성 자동 검증 모듈
 * AI를 활용한 스토리, 캐릭터, 설정 일관성 체크
 */

import { getDb } from '@/lib/db';
import { generateText } from '@/lib/ai/gemini-client';

export interface ConsistencyIssue {
    type: 'character' | 'plot' | 'setting' | 'timeline' | 'power' | 'tone';
    severity: 'low' | 'medium' | 'high';
    chapter: number;
    description: string;
    suggestion: string;
}

export interface ConsistencyReport {
    projectId: string;
    checkedAt: string;
    totalIssues: number;
    issues: ConsistencyIssue[];
    summary: string;
}

/**
 * 챕터 생성 후 빠른 일관성 체크
 */
export async function quickConsistencyCheck(
    projectId: string,
    newChapterContent: string,
    chapterNumber: number,
): Promise<ConsistencyReport> {
    const db = getDb();

    const storyBible = db.prepare(
        `SELECT category, name, content FROM story_bible_entries
     WHERE project_id = ? AND content IS NOT NULL AND content != ''
     ORDER BY category`
    ).all(projectId) as { category: string; name: string; content: string }[];

    const bibleText = storyBible.map(e =>
        `[${e.category}] ${e.name}: ${e.content}`
    ).join('\n');

    const recentChapters = db.prepare(
        `SELECT c.chapter_number, c.title, c.summary
     FROM chapters c JOIN volumes v ON c.volume_id = v.id
     WHERE v.project_id = ? AND c.chapter_number < ?
     ORDER BY c.chapter_number DESC LIMIT 3`
    ).all(projectId, chapterNumber) as { chapter_number: number; title: string; summary: string }[];

    const contextText = recentChapters.reverse().map(ch =>
        `${ch.chapter_number}화 "${ch.title}": ${ch.summary}`
    ).join('\n');

    const prompt = `당신은 웹소설 편집자입니다. 새로 작성된 챕터가 기존 설정과 일관성을 유지하는지 검수하세요.

[작품 설정 (Story Bible)]
${bibleText || '(설정 없음)'}

[최근 스토리 요약]
${contextText || '(이전 챕터 없음)'}

[검수 대상: ${chapterNumber}화]
${newChapterContent.substring(0, 8000)}

다음 항목을 검수하세요:
1. 캐릭터 일관성: 이름/특징/성격이 설정과 일치하는가
2. 설정 일관성: 세계관/무공/마법 체계가 설정과 일치하는가
3. 줄거리 일관성: 이전 사건과 모순이 없는가
4. 톤/분위기: 작품 전체 톤과 어울리는가

반드시 아래 JSON 형식으로만 응답하세요:
{"issues": [{"type": "character|plot|setting|timeline|power|tone", "severity": "low|medium|high", "description": "문제 설명", "suggestion": "수정 제안"}], "summary": "전체 요약 (1-2문장)"}

문제가 없으면 issues를 빈 배열로, summary에 "일관성 검증 통과"를 넣으세요.`;

    const result = await generateText(prompt);

    let parsed: { issues: any[]; summary: string };
    try {
        parsed = JSON.parse(result);
    } catch {
        parsed = { issues: [], summary: result.substring(0, 200) };
    }

    return {
        projectId,
        checkedAt: new Date().toISOString(),
        totalIssues: parsed.issues.length,
        issues: parsed.issues.map(i => ({
            type: i.type || 'plot',
            severity: i.severity || 'low',
            chapter: chapterNumber,
            description: i.description || '',
            suggestion: i.suggestion || '',
        })),
        summary: parsed.summary || '검증 완료',
    };
}

/**
 * 프로젝트 전체 일관성 심층 분석
 */
export async function deepConsistencyCheck(projectId: string): Promise<ConsistencyReport> {
    const db = getDb();

    const storyBible = db.prepare(
        `SELECT category, name, content FROM story_bible_entries
     WHERE project_id = ? AND content IS NOT NULL AND content != ''`
    ).all(projectId) as { category: string; name: string; content: string }[];

    const bibleText = storyBible.map(e =>
        `[${e.category}] ${e.name}: ${e.content}`
    ).join('\n');

    const chapters = db.prepare(
        `SELECT c.chapter_number, c.title, c.summary, c.condensed_summary
     FROM chapters c JOIN volumes v ON c.volume_id = v.id
     WHERE v.project_id = ?
     ORDER BY v.volume_number, c.chapter_number`
    ).all(projectId) as { chapter_number: number; title: string; summary: string; condensed_summary: string }[];

    const chaptersText = chapters.map(ch =>
        `${ch.chapter_number}화 "${ch.title}": ${ch.condensed_summary || ch.summary}`
    ).join('\n');

    const prompt = `당신은 웹소설 편집장입니다. 전체 작품의 일관성을 종합 분석하세요.

[작품 설정]
${bibleText || '(설정 없음)'}

[전체 챕터 요약 (${chapters.length}화)]
${chaptersText.substring(0, 15000)}

다음을 종합 분석하세요:
1. 캐릭터 아크: 캐릭터 성장/변화가 자연스러운가
2. 복선 회수: 미회수 복선이 있는가
3. 파워 밸런스: 강함의 기준이 일관적인가
4. 줄거리 모순: 사건 간 논리적 모순이 없는가
5. 떡밥 관리: 잊힌 설정이나 사라진 캐릭터가 있는가

반드시 아래 JSON 형식으로만 응답하세요:
{"issues": [{"type":"character|plot|setting|timeline|power|tone", "severity":"low|medium|high", "description":"문제 설명", "suggestion":"수정 제안"}], "summary": "전체 분석 요약 (2-3문장)"}`;

    const result = await generateText(prompt);
    let parsed: { issues: any[]; summary: string };
    try {
        parsed = JSON.parse(result);
    } catch {
        parsed = { issues: [], summary: result.substring(0, 300) };
    }

    return {
        projectId,
        checkedAt: new Date().toISOString(),
        totalIssues: parsed.issues.length,
        issues: parsed.issues.map(i => ({
            type: i.type || 'plot',
            severity: i.severity || 'medium',
            chapter: i.chapter || chapters.length,
            description: i.description || '',
            suggestion: i.suggestion || '',
        })),
        summary: parsed.summary || '분석 완료',
    };
}
