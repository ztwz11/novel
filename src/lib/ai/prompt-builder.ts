import { buildMemoryContext } from '@/lib/memory/memory-manager';
import { getDb } from '@/lib/db';
import { NovelSettings, settingsToPromptRules, DEFAULT_NOVEL_SETTINGS } from '@/lib/settings/novel-settings';

export interface BuiltPrompt {
    systemPrompt: string;
    contextPrompt: string;
    estimatedTokens: number;
}

export function buildPrompt(
    projectId: string,
    volumeId: string,
    chapterNumber: number,
    personaSystemPrompt: string,
    personaRules: string[],
    selectedKnowledgeFileIds?: string[],
): BuiltPrompt {
    const db = getDb();

    // Get project info
    const project = db.prepare('SELECT title, genre, settings_json FROM projects WHERE id = ?')
        .get(projectId) as { title: string; genre: string; settings_json: string } | undefined;

    if (!project) throw new Error(`Project ${projectId} not found`);

    // Get volume info
    const volume = db.prepare('SELECT volume_number, title, synopsis FROM volumes WHERE id = ?')
        .get(volumeId) as { volume_number: number; title: string; synopsis: string } | undefined;

    if (!volume) throw new Error(`Volume ${volumeId} not found`);

    // Parse project settings
    let novelSettings: NovelSettings = DEFAULT_NOVEL_SETTINGS;
    try {
        const parsed = JSON.parse(project.settings_json || '{}');
        novelSettings = { ...DEFAULT_NOVEL_SETTINGS, ...parsed };
    } catch { /* use defaults */ }

    // Convert settings to rules
    const settingsRules = settingsToPromptRules(novelSettings);
    const allRules = [...personaRules, ...settingsRules];

    // Build memory context
    const memory = buildMemoryContext(projectId, volumeId, chapterNumber, selectedKnowledgeFileIds);

    // Target word count from settings
    const targetWords = novelSettings.structure?.wordsPerChapter || 4000;

    // Assemble system prompt
    const rulesSection = allRules.length > 0
        ? `\n\n[작성 규칙]\n${allRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
        : '';

    const systemPrompt = `${personaSystemPrompt}

[프로젝트 정보]
- 작품명: ${project.title}
- 장르: ${project.genre}
- 현재: ${volume.volume_number}권 ${chapterNumber}화
${rulesSection}

[출력 형식]
반드시 JSON으로 응답하세요. title, content, newCharacters, keyEvents, cliffhanger, summary 필드를 포함해야 합니다.
- content: ${targetWords - 1000}~${targetWords + 1000}자의 챕터 본문
- summary: 300-500자의 상세 요약`;

    // Assemble context prompt
    let contextParts: string[] = [];

    if (memory.storyBible) {
        contextParts.push(`[Story Bible - 작품 설정]\n${memory.storyBible}`);
    }

    if (memory.volumeSynopses) {
        contextParts.push(`[시리즈 시놉시스]\n${memory.volumeSynopses}`);
    }

    if (volume.synopsis) {
        contextParts.push(`[현재 ${volume.volume_number}권 시놉시스]\n${volume.synopsis}`);
    }

    if (memory.knowledgeFiles) {
        contextParts.push(`[참고 지식 파일]\n${memory.knowledgeFiles}`);
    }

    if (memory.chapterSummaries) {
        contextParts.push(`[이전 챕터 요약]\n${memory.chapterSummaries}`);
    }

    if (memory.previousChapterContent) {
        contextParts.push(`[직전 챕터 전문]\n${memory.previousChapterContent}`);
    }

    const contextPrompt = contextParts.join('\n\n---\n\n');

    return {
        systemPrompt,
        contextPrompt,
        estimatedTokens: memory.totalEstimatedTokens,
    };
}
