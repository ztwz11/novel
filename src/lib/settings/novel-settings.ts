/**
 * NovelForge 세부 설정 시스템
 * 웹소설 창작을 위한 상세 설정 타입 정의
 */

// ============================
// 문체 (Writing Style)
// ============================
export interface WritingStyleSettings {
    // 서술 시점
    perspective: '1인칭' | '3인칭 제한' | '3인칭 전지' | '다시점' | '2인칭';

    // 문장 스타일
    sentenceStyle: '간결체' | '만연체' | '경어체' | '반말체' | '혼합체';

    // 문체 톤
    tone: string; // 예: "어둡고 비장한", "가볍고 유쾌한", "서정적인"

    // 묘사 밀도 (1=최소, 5=최대)
    descriptionDensity: 1 | 2 | 3 | 4 | 5;

    // 대사 비율 (1=서술 위주, 5=대사 위주)
    dialogueRatio: 1 | 2 | 3 | 4 | 5;

    // 내면 독백 사용 정도 (1=거의 없음, 5=매우 많음)
    innerMonologue: 1 | 2 | 3 | 4 | 5;

    // 전투/액션 묘사 스타일
    actionStyle: '간결한 속도감' | '상세한 초식 묘사' | '감각적 몰입' | '전략적 분석' | '영화적 연출';

    // 유머 수준 (1=시리어스, 5=코미디)
    humorLevel: 1 | 2 | 3 | 4 | 5;

    // 한자어/고어 사용 (무협 특화)
    archaicLanguage: '없음' | '가끔' | '보통' | '많이' | '매우 많이';
}

// ============================
// 수위 설정 (Content Maturity / Rating)
// ============================
export interface MaturitySettings {
    // 전체 등급
    overallRating: '전체이용가' | '12세' | '15세' | '18세' | '성인';

    // 폭력/잔혹 묘사 수위 (1=순화, 5=사실적)
    violenceLevel: 1 | 2 | 3 | 4 | 5;

    // 로맨스/성적 묘사 수위 (1=순정, 5=성인물)
    romanceLevel: 1 | 2 | 3 | 4 | 5;

    // 욕설/비속어 수위 (1=없음, 5=거친 언어)
    profanityLevel: 1 | 2 | 3 | 4 | 5;

    // 심리적 공포/암울함 (1=가벼운, 5=매우 어두운)
    darknessLevel: 1 | 2 | 3 | 4 | 5;

    // 금지 묘사 항목 (AI가 절대 생성하지 않을 것)
    prohibitedContent: string[];
}

// ============================
// 퓨전 정도 (Fusion Level)
// ============================
export interface FusionSettings {
    // 퓨전 정도 (0=정통, 5=극한 퓨전)
    fusionLevel: 0 | 1 | 2 | 3 | 4 | 5;

    // 현대 지식 활용 (회귀/빙의물)
    modernKnowledge: boolean;

    // 시스템/게임 요소
    systemElements: {
        enabled: boolean;
        type: '스탯창' | '스킬트리' | '퀘스트' | '아이템등급' | '없음';
        detail: '간략' | '보통' | '상세';
    };

    // 차원이동/이세계 요소
    isekai: boolean;

    // 회귀/타임리프
    regression: boolean;

    // 빙의/환생
    possession: boolean;

    // 융합 장르 (추가 장르 요소)
    subGenres: string[];
}

// ============================
// 스토리 방향성 (Story Direction)
// ============================
export interface StoryDirectionSettings {
    // 주인공 유형
    protagonistType: '약자에서 성장' | '먼치킨(처음부터 강함)' | '반영웅' | '평범한 일반인' | '숨겨진 천재' | '몰락 귀족/강자의 부활';

    // 주요 전개 방식
    narrativeStyle: '사이다(통쾌)' | '고구마(답답)' | '균형' | '점진적 카타르시스';

    // 성장 속도
    growthPace: '느린 성장' | '보통' | '빠른 성장' | '폭풍 성장(먼치킨)';

    // 하렘/로맨스 유무
    romance: {
        enabled: boolean;
        type: '없음' | '단일 히로인' | '삼각관계' | '하렘' | '역하렘' | '공략물';
        intensity: 1 | 2 | 3 | 4 | 5;
    };

    // 결말 유형
    endingType: '해피엔딩' | '배드엔딩' | '열린결말' | '비터스위트' | '순환(다음 시즌 연결)' | '미정';

    // 전체 분위기
    atmosphere: string; // "어둡고 무거운", "밝고 열혈적인" 등

    // 핵심 갈등 유형
    mainConflict: string; // "복수", "세계 멸망", "권력 쟁탈" 등

    // 교훈/메시지 (선택)
    theme: string;
}

// ============================
// 시즌/구조 설정 (Season & Structure)
// ============================
export interface StructureSettings {
    // 시즌제 사용 여부
    useSeason: boolean;

    // 시즌 수 (시즌제일 경우)
    totalSeasons: number;

    // 시즌별 권수
    volumesPerSeason: number;

    // 권당 목표 챕터 수
    chaptersPerVolume: number;

    // 챕터당 목표 글자 수
    wordsPerChapter: number;

    // 구조 타입
    structureType: '일직선 진행' | '멀티 아크' | '듀얼 타임라인' | '군상극' | '에피소드형';

    // 아크 설정 (멀티 아크일 경우)
    arcs: {
        name: string;
        description: string;
        volumeRange: string; // "1-5권"
    }[];

    // 시즌별 설정 (시즌제일 경우)
    seasons: {
        name: string;
        theme: string;
        endingType: string;
    }[];
}

// ============================
// 세계관 상세 설정 (World Building)
// ============================
export interface WorldBuildingSettings {
    // 시대 배경
    era: string; // "고대 중원", "중세 판타지", "현대 대한민국", "미래"

    // 기술 수준
    techLevel: string; // "냉병기 시대", "마법 문명", "현대 과학 + 마법"

    // 파워 시스템 유형
    powerSystem: {
        name: string; // "내공", "마나", "오라"
        levels: string[];
        description: string;
        hardOrSoft: '하드 매직' | '소프트 매직' | '혼합';
    };

    // 사회 구조
    socialStructure: string; // "강호 사회", "봉건 왕국", "현대 민주주의 + 헌터 시스템"

    // 핵심 세력 구조
    factionStructure: string; // "정사대립", "다왕국", "길드 시스템"

    // 지리적 규모
    geographicScale: '도시' | '국가' | '대륙' | '다중 세계' | '우주';

    // 비현실적 요소
    supernaturalElements: string[]; // ["몬스터", "던전", "정령", "마족"]

    // 고유 용어 사전
    glossary: { term: string; definition: string }[];
}

// ============================
// 통합 프로젝트 설정
// ============================
export interface NovelSettings {
    writingStyle: WritingStyleSettings;
    maturity: MaturitySettings;
    fusion: FusionSettings;
    storyDirection: StoryDirectionSettings;
    structure: StructureSettings;
    worldBuilding: WorldBuildingSettings;
}

// ============================
// 기본값
// ============================
export const DEFAULT_NOVEL_SETTINGS: NovelSettings = {
    writingStyle: {
        perspective: '1인칭',
        sentenceStyle: '혼합체',
        tone: '',
        descriptionDensity: 3,
        dialogueRatio: 3,
        innerMonologue: 3,
        actionStyle: '영화적 연출',
        humorLevel: 2,
        archaicLanguage: '없음',
    },
    maturity: {
        overallRating: '15세',
        violenceLevel: 3,
        romanceLevel: 2,
        profanityLevel: 2,
        darknessLevel: 2,
        prohibitedContent: [],
    },
    fusion: {
        fusionLevel: 0,
        modernKnowledge: false,
        systemElements: { enabled: false, type: '없음', detail: '보통' },
        isekai: false,
        regression: false,
        possession: false,
        subGenres: [],
    },
    storyDirection: {
        protagonistType: '약자에서 성장',
        narrativeStyle: '균형',
        growthPace: '보통',
        romance: { enabled: false, type: '없음', intensity: 1 },
        endingType: '미정',
        atmosphere: '',
        mainConflict: '',
        theme: '',
    },
    structure: {
        useSeason: false,
        totalSeasons: 1,
        volumesPerSeason: 10,
        chaptersPerVolume: 25,
        wordsPerChapter: 4000,
        structureType: '일직선 진행',
        arcs: [],
        seasons: [],
    },
    worldBuilding: {
        era: '',
        techLevel: '',
        powerSystem: { name: '', levels: [], description: '', hardOrSoft: '혼합' },
        socialStructure: '',
        factionStructure: '',
        geographicScale: '대륙',
        supernaturalElements: [],
        glossary: [],
    },
};

// ============================
// 설정을 프롬프트로 변환
// ============================
export function settingsToPromptRules(settings: NovelSettings): string[] {
    const rules: string[] = [];

    // 문체 규칙
    const ws = settings.writingStyle;
    rules.push(`[시점] ${ws.perspective} 시점으로 서술`);
    rules.push(`[문장] ${ws.sentenceStyle} 스타일`);
    if (ws.tone) rules.push(`[톤] ${ws.tone} 분위기`);

    const densityDesc = ['', '묘사 최소화', '묘사 간략하게', '묘사 보통 수준', '묘사 풍부하게', '묘사 매우 상세하게'];
    rules.push(`[묘사] ${densityDesc[ws.descriptionDensity]}`);

    const dialogueDesc = ['', '서술 위주, 대사 최소화', '서술 중심에 대사 보조', '서술과 대사 균형', '대사 중심 전개', '대사 위주로 진행'];
    rules.push(`[대사] ${dialogueDesc[ws.dialogueRatio]}`);

    if (ws.innerMonologue >= 3) rules.push(`[내면] 주인공 내면 독백 적극 활용`);
    rules.push(`[액션] ${ws.actionStyle} 스타일로 전투/액션 묘사`);

    const humorDesc = ['', '진지하고 시리어스한 톤 유지', '가끔 가벼운 유머', '적절한 유머 배합', '유머러스한 분위기', '코미디 요소 강하게'];
    rules.push(`[유머] ${humorDesc[ws.humorLevel]}`);

    if (ws.archaicLanguage !== '없음') rules.push(`[한자어/고어] ${ws.archaicLanguage} 사용`);

    // 수위 규칙
    const mt = settings.maturity;
    rules.push(`[등급] ${mt.overallRating} 수준 유지`);

    const violenceDesc = ['', '폭력 묘사 순화', '폭력 묘사 절제', '적당한 전투 묘사', '사실적 전투 묘사', '잔혹하고 사실적인 전투 묘사'];
    rules.push(`[폭력] ${violenceDesc[mt.violenceLevel]}`);

    const romanceDesc = ['', '로맨스 없거나 암시만', '가벼운 스킨십 수준', '키스/포옹 수준', '성적 묘사 포함', '성인물 수준 묘사'];
    rules.push(`[로맨스 수위] ${romanceDesc[mt.romanceLevel]}`);

    if (mt.profanityLevel <= 2) rules.push(`[언어] 욕설/비속어 자제`);
    else if (mt.profanityLevel >= 4) rules.push(`[언어] 캐릭터에 맞는 거친 언어 사용 가능`);

    if (mt.prohibitedContent.length > 0) {
        rules.push(`[금지] 절대 포함하지 마세요: ${mt.prohibitedContent.join(', ')}`);
    }

    // 퓨전 규칙
    const fu = settings.fusion;
    if (fu.fusionLevel > 0) {
        const fusionDesc = ['', '약간의 퓨전 요소', '적당한 퓨전', '강한 퓨전', '매우 강한 퓨전', '극한 퓨전(전면 재해석)'];
        rules.push(`[퓨전] ${fusionDesc[fu.fusionLevel]}`);
    }
    if (fu.modernKnowledge) rules.push(`[현대지식] 주인공이 현대 지식을 활용하여 상황을 해결`);
    if (fu.systemElements.enabled) {
        rules.push(`[시스템] ${fu.systemElements.type} 시스템 사용 (${fu.systemElements.detail} 수준으로 묘사)`);
    }
    if (fu.regression) rules.push(`[회귀] 회귀물 설정 적용 — 미래 지식/기억 활용`);
    if (fu.possession) rules.push(`[빙의/환생] 빙의 또는 환생 설정 적용`);
    if (fu.isekai) rules.push(`[이세계] 차원이동/이세계 요소 적용`);
    if (fu.subGenres.length > 0) rules.push(`[부장르] ${fu.subGenres.join(', ')} 요소 포함`);

    // 방향성 규칙
    const sd = settings.storyDirection;
    rules.push(`[주인공] ${sd.protagonistType} 유형`);
    rules.push(`[전개] ${sd.narrativeStyle} 전개`);
    rules.push(`[성장] ${sd.growthPace}`);

    if (sd.romance.enabled) {
        rules.push(`[로맨스] ${sd.romance.type} 구조`);
    }

    if (sd.endingType !== '미정') rules.push(`[결말] ${sd.endingType} 방향으로 전개`);
    if (sd.atmosphere) rules.push(`[분위기] ${sd.atmosphere}`);
    if (sd.mainConflict) rules.push(`[핵심갈등] ${sd.mainConflict}`);
    if (sd.theme) rules.push(`[테마] ${sd.theme}`);

    // 구조 규칙
    const st = settings.structure;
    rules.push(`[구조] ${st.structureType}`);
    rules.push(`[분량] 챕터당 약 ${st.wordsPerChapter}자`);
    if (st.useSeason) rules.push(`[시즌] 시즌제 — 총 ${st.totalSeasons}시즌, 시즌당 ${st.volumesPerSeason}권`);

    // 세계관 규칙
    const wb = settings.worldBuilding;
    if (wb.era) rules.push(`[시대] ${wb.era}`);
    if (wb.techLevel) rules.push(`[기술수준] ${wb.techLevel}`);
    if (wb.powerSystem.name) {
        rules.push(`[파워시스템] ${wb.powerSystem.name} (${wb.powerSystem.hardOrSoft}) — 단계: ${wb.powerSystem.levels.join(' → ')}`);
    }
    if (wb.socialStructure) rules.push(`[사회] ${wb.socialStructure}`);
    if (wb.supernaturalElements.length > 0) rules.push(`[초자연] ${wb.supernaturalElements.join(', ')} 요소 존재`);

    return rules;
}
