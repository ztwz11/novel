import { getDb } from '@/lib/db';

interface MemoryContext {
    storyBible: string;
    volumeSynopses: string;
    chapterSummaries: string;
    previousChapterContent: string;
    knowledgeFiles: string;
    totalEstimatedTokens: number;
}

// Rough Korean token estimation: ~2 chars per token for Korean
function estimateTokens(text: string): number {
    if (!text) return 0;
    const koreanChars = (text.match(/[\uac00-\ud7af]/g) || []).length;
    const otherChars = text.length - koreanChars;
    return Math.ceil(koreanChars / 1.5 + otherChars / 4);
}

const TOKEN_BUDGETS = {
    storyBible: 80000,
    volumeSynopses: 20000,
    chapterSummaries: 150000,
    previousChapter: 200000,
    knowledgeFiles: 100000,
    buffer: 500000, // reserved for AI response
};

export function buildMemoryContext(
    projectId: string,
    currentVolumeId: string,
    currentChapterNumber: number,
    selectedKnowledgeFileIds?: string[]
): MemoryContext {
    const db = getDb();

    // 1. Story Bible (long-term memory)
    const storyBibleEntries = db.prepare(
        `SELECT category, name, content FROM story_bible_entries 
     WHERE project_id = ? ORDER BY category, sort_order`
    ).all(projectId) as { category: string; name: string; content: string }[];

    let storyBible = '';
    let currentCategory = '';
    for (const entry of storyBibleEntries) {
        if (entry.category !== currentCategory) {
            currentCategory = entry.category;
            storyBible += `\n## [${currentCategory}]\n`;
        }
        storyBible += `### ${entry.name}\n${entry.content}\n\n`;
    }

    // Trim if over budget
    let storyBibleTokens = estimateTokens(storyBible);
    if (storyBibleTokens > TOKEN_BUDGETS.storyBible) {
        const ratio = TOKEN_BUDGETS.storyBible / storyBibleTokens;
        storyBible = storyBible.substring(0, Math.floor(storyBible.length * ratio));
        storyBibleTokens = TOKEN_BUDGETS.storyBible;
    }

    // 2. Volume synopses (long-term memory)
    const volumes = db.prepare(
        `SELECT volume_number, title, synopsis FROM volumes 
     WHERE project_id = ? ORDER BY volume_number`
    ).all(projectId) as { volume_number: number; title: string; synopsis: string }[];

    let volumeSynopses = '';
    for (const vol of volumes) {
        if (vol.synopsis) {
            volumeSynopses += `[${vol.volume_number}권: ${vol.title}] ${vol.synopsis}\n`;
        }
    }
    const volumeSynopsesTokens = estimateTokens(volumeSynopses);

    // 3. Chapter summaries (mid-term memory)
    // Get all chapters for context, with more detail for recent ones
    const allChapters = db.prepare(
        `SELECT c.chapter_number, c.title, c.summary, c.detailed_summary, 
            c.condensed_summary, c.key_events_summary, v.volume_number
     FROM chapters c
     JOIN volumes v ON c.volume_id = v.id
     WHERE v.project_id = ?
     ORDER BY v.volume_number, c.chapter_number`
    ).all(projectId) as {
        chapter_number: number;
        title: string;
        summary: string;
        detailed_summary: string;
        condensed_summary: string;
        key_events_summary: string;
        volume_number: number;
    }[];

    let chapterSummaries = '';
    let summaryTokens = 0;

    for (const ch of allChapters) {
        // Skip current chapter
        if (ch.volume_number === (volumes.find(v => v.volume_number)?.volume_number) && ch.chapter_number >= currentChapterNumber) {
            continue;
        }

        let summaryText: string;
        const chaptersAgo = currentChapterNumber - ch.chapter_number;

        if (chaptersAgo <= 5) {
            // Recent: use detailed summary
            summaryText = ch.detailed_summary || ch.summary || '';
        } else if (chaptersAgo <= 20) {
            // Moderate: use condensed 
            summaryText = ch.condensed_summary || ch.summary || '';
        } else {
            // Old: use key events only
            summaryText = ch.key_events_summary || ch.condensed_summary || '';
        }

        if (summaryText) {
            const line = `[${ch.volume_number}권 ${ch.chapter_number}화: ${ch.title}] ${summaryText}\n`;
            const lineTokens = estimateTokens(line);
            if (summaryTokens + lineTokens > TOKEN_BUDGETS.chapterSummaries) break;
            chapterSummaries += line;
            summaryTokens += lineTokens;
        }
    }

    // 4. Previous chapter content (short-term memory)
    const prevChapter = db.prepare(
        `SELECT c.content FROM chapters c
     JOIN volumes v ON c.volume_id = v.id
     WHERE v.id = ? AND c.chapter_number = ?`
    ).get(currentVolumeId, currentChapterNumber - 1) as { content: string } | undefined;

    let previousChapterContent = prevChapter?.content || '';
    let prevTokens = estimateTokens(previousChapterContent);
    if (prevTokens > TOKEN_BUDGETS.previousChapter) {
        const ratio = TOKEN_BUDGETS.previousChapter / prevTokens;
        previousChapterContent = previousChapterContent.substring(0, Math.floor(previousChapterContent.length * ratio));
        prevTokens = TOKEN_BUDGETS.previousChapter;
    }

    // 5. Knowledge files (persona knowledge)
    let knowledgeFiles = '';
    let knowledgeTokens = 0;

    if (selectedKnowledgeFileIds && selectedKnowledgeFileIds.length > 0) {
        const placeholders = selectedKnowledgeFileIds.map(() => '?').join(',');
        const kFiles = db.prepare(
            `SELECT filename, content, summary FROM persona_knowledge_files
             WHERE id IN (${placeholders}) AND is_active = 1
             ORDER BY sort_order`
        ).all(...selectedKnowledgeFileIds) as { filename: string; content: string; summary: string }[];

        for (const kf of kFiles) {
            // Use summary if available, fall back to full content
            const text = kf.summary || kf.content || '';
            const entry = `\n### [${kf.filename}]\n${text}\n`;
            const entryTokens = estimateTokens(entry);
            if (knowledgeTokens + entryTokens > TOKEN_BUDGETS.knowledgeFiles) break;
            knowledgeFiles += entry;
            knowledgeTokens += entryTokens;
        }
    }

    return {
        storyBible,
        volumeSynopses,
        chapterSummaries,
        previousChapterContent,
        knowledgeFiles,
        totalEstimatedTokens: storyBibleTokens + volumeSynopsesTokens + summaryTokens + prevTokens + knowledgeTokens,
    };
}
