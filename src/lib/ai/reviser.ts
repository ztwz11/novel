/**
 * AI 탈고 (Revision) 모듈
 * 챕터 내용을 옵션에 따라 교정/개선
 */

import { getDb } from '@/lib/db';
import { generateText } from '@/lib/ai/gemini-client';
import { randomUUID } from 'crypto';

export interface RevisionOptions {
    // 탈고 포커스 (복수 선택 가능)
    focus: RevisionFocus[];
    // 탈고 강도
    intensity: 'light' | 'normal' | 'heavy';
    // 추가 지시사항
    customInstruction?: string;
    // 목표 글자수 (분량 조절 시)
    targetWordCount?: number;
}

export type RevisionFocus =
    | 'polish'          // 문장 다듬기
    | 'description'     // 묘사 강화
    | 'dialogue'        // 대사 개선
    | 'action'          // 전투/액션 강화
    | 'pacing'          // 페이싱 조절
    | 'emotion'         // 감정선 깊이
    | 'consistency'     // 일관성 교정
    | 'length';         // 분량 조절

const FOCUS_LABELS: Record<RevisionFocus, { label: string; instruction: string }> = {
    polish: {
        label: '문장 다듬기',
        instruction: '어색한 문장, 문법 오류, 중복 표현을 수정하세요. 더 자연스럽고 읽기 좋은 문장으로 개선하세요.',
    },
    description: {
        label: '묘사 강화',
        instruction: '배경, 감각(오감), 분위기 묘사를 보강하세요. 독자가 장면을 생생하게 상상할 수 있도록 시각/청각/촉각 등을 추가하세요.',
    },
    dialogue: {
        label: '대사 개선',
        instruction: '캐릭터별 말투와 어조를 통일하고, 대사를 더 자연스럽고 캐릭터에 맞게 수정하세요. 불필요한 "설명 대사"를 줄이세요.',
    },
    action: {
        label: '전투/액션 강화',
        instruction: '전투/액션 장면의 긴장감, 속도감, 역동성을 강화하세요. 무공/마법의 시각적 묘사와 초식 이름을 풍부하게 넣으세요.',
    },
    pacing: {
        label: '페이싱 조절',
        instruction: '전개 속도를 조절하세요. 지루한 부분은 압축하고, 긴장감 있는 장면은 확장하세요. 챕터 끝 클리프행어를 강화하세요.',
    },
    emotion: {
        label: '감정선 깊이',
        instruction: '캐릭터의 내면 감정, 심리 변화, 갈등을 더 깊이 있게 묘사하세요. 독자가 감정적으로 몰입할 수 있도록 하세요.',
    },
    consistency: {
        label: '일관성 교정',
        instruction: 'Story Bible과 이전 챕터를 기반으로 캐릭터 이름, 외모, 설정, 타임라인의 모순을 찾아 교정하세요.',
    },
    length: {
        label: '분량 조절',
        instruction: '목표 글자수에 맞게 내용을 늘리거나 줄이세요. 늘릴 때는 묘사와 대사를 보강하고, 줄일 때는 불필요한 반복을 제거하세요.',
    },
};

const INTENSITY_INSTRUCTIONS: Record<string, string> = {
    light: '원문의 80% 이상을 유지하면서 최소한의 수정만 하세요. 원작자의 의도와 스타일을 최대한 보존하세요.',
    normal: '원문의 구조와 핵심 내용은 유지하되, 50~80% 수준으로 자유롭게 수정하세요.',
    heavy: '원문의 스토리 뼈대만 유지하고 전면적으로 재작성할 수 있습니다. 품질 향상을 최우선으로 하세요.',
};

export function getFocusLabels() {
    return FOCUS_LABELS;
}

/**
 * 단일 챕터 탈고
 */
export async function reviseChapter(
    chapterId: string,
    options: RevisionOptions,
    storyBibleContext?: string,
): Promise<{
    revisedContent: string;
    diffSummary: string;
    revisionId: string;
}> {
    const db = getDb();
    const chapter = db.prepare(
        'SELECT id, chapter_number, title, content, word_count FROM chapters WHERE id = ?'
    ).get(chapterId) as { id: string; chapter_number: number; title: string; content: string; word_count: number } | undefined;

    if (!chapter) throw new Error('Chapter not found');
    if (!chapter.content) throw new Error('Chapter has no content to revise');

    // Build revision prompt
    const focusInstructions = options.focus.map(f => `- ${FOCUS_LABELS[f].label}: ${FOCUS_LABELS[f].instruction}`).join('\n');
    const intensityInstruction = INTENSITY_INSTRUCTIONS[options.intensity];

    let prompt = `당신은 프로 웹소설 편집자입니다. 아래 챕터를 탈고(교정/퇴고)해주세요.

[탈고 강도]
${intensityInstruction}

[탈고 포커스]
${focusInstructions}
`;

    if (options.customInstruction) {
        prompt += `\n[추가 지시]\n${options.customInstruction}\n`;
    }

    if (options.focus.includes('length') && options.targetWordCount) {
        prompt += `\n[목표 글자수] ${options.targetWordCount}자\n`;
    }

    if (storyBibleContext && options.focus.includes('consistency')) {
        prompt += `\n[Story Bible 참고]\n${storyBibleContext.substring(0, 5000)}\n`;
    }

    prompt += `\n[원본 챕터: ${chapter.chapter_number}화 "${chapter.title}" (${chapter.word_count}자)]
${chapter.content}

반드시 아래 JSON 형식으로 응답하세요:
{"revised_content": "탈고된 전체 본문", "changes_summary": "주요 변경 사항 요약 (3-5줄)"}`;

    const result = await generateText(prompt);

    let parsed: { revised_content: string; changes_summary: string };
    try {
        parsed = JSON.parse(result);
    } catch {
        // If JSON parsing fails, treat the whole response as the revised content
        parsed = { revised_content: result, changes_summary: '탈고 완료' };
    }

    // Save revision history
    const revisionId = randomUUID();
    db.prepare(
        `INSERT INTO revisions (id, chapter_id, original_content, revised_content, options_json, intensity, diff_summary)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
        revisionId,
        chapterId,
        chapter.content,
        parsed.revised_content,
        JSON.stringify(options),
        options.intensity,
        parsed.changes_summary,
    );

    return {
        revisedContent: parsed.revised_content,
        diffSummary: parsed.changes_summary,
        revisionId,
    };
}

/**
 * 탈고 결과를 적용 (챕터 내용 교체)
 */
export function applyRevision(revisionId: string): void {
    const db = getDb();
    const revision = db.prepare('SELECT chapter_id, revised_content FROM revisions WHERE id = ?')
        .get(revisionId) as { chapter_id: string; revised_content: string } | undefined;

    if (!revision) throw new Error('Revision not found');

    const wordCount = revision.revised_content.length;
    db.prepare('UPDATE chapters SET content = ?, word_count = ?, status = ?, updated_at = datetime(\'now\') WHERE id = ?')
        .run(revision.revised_content, wordCount, 'revised', revision.chapter_id);
}

/**
 * 여러 챕터 순차 탈고
 */
export async function reviseMultiple(
    chapterIds: string[],
    options: RevisionOptions,
    storyBibleContext?: string,
): Promise<{ results: { chapterId: string; revisionId: string; diffSummary: string }[]; errors: string[] }> {
    const results: { chapterId: string; revisionId: string; diffSummary: string }[] = [];
    const errors: string[] = [];

    for (const chapterId of chapterIds) {
        try {
            const result = await reviseChapter(chapterId, options, storyBibleContext);
            results.push({ chapterId, revisionId: result.revisionId, diffSummary: result.diffSummary });
        } catch (err: any) {
            errors.push(`${chapterId}: ${err.message}`);
        }
    }

    return { results, errors };
}

/**
 * 챕터의 탈고 이력 조회
 */
export function getRevisionHistory(chapterId: string) {
    const db = getDb();
    return db.prepare(
        'SELECT id, intensity, diff_summary, options_json, created_at FROM revisions WHERE chapter_id = ? ORDER BY created_at DESC'
    ).all(chapterId);
}
