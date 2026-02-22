export interface GenrePreset {
    id: string;
    name: string;
    emoji: string;
    description: string;
    defaultStyle: {
        tone: string;
        perspective: string;
        sentenceStyle: string;
        vocabularyLevel: string;
    };
    systemPromptTemplate: string;
    storyBibleCategories: { category: string; label: string; description: string }[];
    powerSystem: { name: string; levels: string[] };
    narrativeConventions: string[];
    defaultRules: string[];
}

export const GENRE_PRESETS: Record<string, GenrePreset> = {
    murim: {
        id: 'murim',
        name: '무협',
        emoji: '🥋',
        description: '정통 무협소설. 강호, 문파, 내공 수련, 비급 쟁탈의 세계.',
        defaultStyle: {
            tone: '고풍스럽고 비장한',
            perspective: '3인칭 제한 시점',
            sentenceStyle: '한자어와 사자성어를 활용한 격식체',
            vocabularyLevel: '무협 전문용어 포함, 성인 대상',
        },
        systemPromptTemplate: `당신은 정통 무협소설 작가입니다.
- 고풍스러운 한자어와 사자성어를 적절히 활용하세요.
- 전투 장면은 무공의 초식 이름과 내공의 흐름을 비유적으로 묘사하세요.
- 강호의 의리, 복수, 정의를 중심 테마로 다루세요.
- 인물의 내면 갈등과 성장을 깊이 있게 표현하세요.
- 웹소설 독자가 몰입할 수 있는 긴장감과 반전을 매 챕터에 넣으세요.`,
        storyBibleCategories: [
            { category: 'character', label: '인물', description: '이름, 외호, 무공, 성격, 배경' },
            { category: 'faction', label: '문파/세력', description: '정파, 사파, 마교, 무림맹 등' },
            { category: 'martial_art', label: '무공 체계', description: '내공심법, 검법, 장법, 경공 등' },
            { category: 'world', label: '세계관', description: '강호 지도, 지역, 역사' },
            { category: 'item', label: '비급/신물', description: '비급, 영단묘약, 신병이기' },
            { category: 'event', label: '핵심 사건', description: '무림 대사건 타임라인' },
            { category: 'rule', label: '세계 규칙', description: '내공 법칙, 강호 규율' },
            { category: 'relationship', label: '관계도', description: '사제, 원수, 동맹 관계' },
        ],
        powerSystem: {
            name: '내공 경지',
            levels: ['후천경', '선천경', '화경', '현경', '절정', '초절정', '무신'],
        },
        narrativeConventions: ['복수극', '비급 쟁탈', '문파 대립', '무림맹/사파 대결', '은인/원수', '비밀 혈통', '숨겨진 고수'],
        defaultRules: [
            '무공 수련은 단계적으로 진행',
            '강적을 만나면 위기 후 성장',
            '매 권마다 더 강한 적 등장',
            '사자성어나 한자 표현 적절히 활용',
        ],
    },

    fusion_murim: {
        id: 'fusion_murim',
        name: '퓨전무협',
        emoji: '⚔️',
        description: '현대적 감성 + 무협. 회귀, 빙의, 시스템 등 퓨전 요소 결합.',
        defaultStyle: {
            tone: '가볍고 유쾌하면서도 열혈적인',
            perspective: '1인칭 주인공 시점',
            sentenceStyle: '현대적 구어체 + 무협 용어 혼용',
            vocabularyLevel: '현대어 기반, 무협 전문용어 혼합',
        },
        systemPromptTemplate: `당신은 퓨전무협 웹소설 작가입니다.
- 현대적이고 가벼운 문체에 무협 용어를 자연스럽게 섞으세요.
- 주인공의 내면 독백과 유머러스한 반응을 많이 넣으세요.
- 먼치킨/사이다 전개를 기본으로 하되, 적절한 위기도 넣으세요.
- 시스템창이나 스탯 묘사를 효과적으로 활용하세요.
- 독자의 쾌감을 극대화하는 관전 반응(주변 인물 놀라는 장면)을 넣으세요.
- 챕터 끝에 다음 화가 궁금해지는 클리프행어를 넣으세요.`,
        storyBibleCategories: [
            { category: 'character', label: '인물', description: '이름, 외호, 현대 이전 기억, 무공, 성격' },
            { category: 'faction', label: '문파/세력', description: '정파, 사파, 마교, 상단 등' },
            { category: 'martial_art', label: '무공 체계', description: '무공 + 현대 지식 융합' },
            { category: 'system', label: '시스템', description: '시스템창, 스탯, 스킬, 퀘스트' },
            { category: 'world', label: '세계관', description: '강호 + 현대 요소' },
            { category: 'item', label: '아이템', description: '비급, 영단묘약, 시스템 보상' },
            { category: 'event', label: '핵심 사건', description: '회귀 전/후 핵심 사건' },
            { category: 'cheat', label: '치트 능력', description: '주인공 특수 능력, 미래 지식' },
        ],
        powerSystem: {
            name: '무공 경지 + 시스템',
            levels: ['후천경(Lv.1-20)', '선천경(Lv.21-50)', '화경(Lv.51-80)', '현경(Lv.81-100)', '절정(Lv.100+)', '초절정', '무신'],
        },
        narrativeConventions: ['회귀', '빙의', '환생', '먼치킨', '사이다', '관전 반응', '숨긴 실력', '복수'],
        defaultRules: [
            '1인칭 주인공 시점 유지',
            '주인공의 내면 독백 적극 활용',
            '먼치킨이되 적절한 위기감 연출',
            '관전 포인트(주변 반응) 필수 포함',
            '챕터 끝 클리프행어 필수',
        ],
    },

    traditional_fantasy: {
        id: 'traditional_fantasy',
        name: '정통판타지',
        emoji: '🐉',
        description: '서양식 정통 판타지. 마법, 검술, 종족, 신화의 세계.',
        defaultStyle: {
            tone: '서사적이고 장엄한',
            perspective: '3인칭 제한 시점',
            sentenceStyle: '묘사가 풍부하고 서사적인 문장',
            vocabularyLevel: '판타지 전문용어, 성인 대상',
        },
        systemPromptTemplate: `당신은 정통 판타지 소설 작가입니다.
- 세계관의 깊이와 디테일을 중시하세요.
- 마법 체계, 종족 문화, 역사를 일관되게 유지하세요.
- 전투 장면은 마법과 검술을 역동적으로 묘사하세요.
- 영웅의 여정 구조를 따르되, 독창적인 반전을 넣으세요.
- 동료 캐릭터들의 개성과 성장도 중요하게 다루세요.
- 웹소설 독자가 빠져들 수 있는 페이싱을 유지하세요.`,
        storyBibleCategories: [
            { category: 'character', label: '인물', description: '이름, 종족, 클래스, 마법/검술, 성격' },
            { category: 'race', label: '종족', description: '인간, 엘프, 드워프, 수인 등' },
            { category: 'magic', label: '마법 체계', description: '서클, 원소, 마나 시스템' },
            { category: 'faction', label: '세력', description: '왕국, 마탑, 교단, 용병단 등' },
            { category: 'world', label: '세계관', description: '대륙 지도, 역사, 신화' },
            { category: 'item', label: '아티팩트', description: '마법 무기, 유물, 마석' },
            { category: 'event', label: '핵심 사건', description: '대전쟁, 예언, 재앙' },
            { category: 'deity', label: '신들', description: '신전, 신의 권능, 축복' },
        ],
        powerSystem: {
            name: '마법 서클 / 검술 등급',
            levels: ['1서클/초급검사', '2서클/중급검사', '3서클/상급검사', '4서클/검사장', '5서클/마스터', '6서클/그랜드마스터', '7서클/소드마스터', '8서클/아크메이지', '9서클/전설'],
        },
        narrativeConventions: ['영웅의 여정', '동료 모집', '퀘스트', '고대의 악', '예언', '마왕/마족', '용 등장'],
        defaultRules: [
            '마법 체계 일관성 유지',
            '종족 특성 일관되게 묘사',
            '파워 인플레이션 단계적 진행',
            '세계관 설명은 스토리에 자연스럽게 녹여서',
        ],
    },

    modern_fantasy: {
        id: 'modern_fantasy',
        name: '현대판타지',
        emoji: '🏙️',
        description: '현대 세계 + 판타지 요소. 던전, 헌터, 각성, 게이트.',
        defaultStyle: {
            tone: '긴박하고 몰입감 있는',
            perspective: '1인칭 주인공 시점',
            sentenceStyle: '간결하고 빠른 전개, 시스템 UI 묘사',
            vocabularyLevel: '현대어 기반, 게임 용어 혼합',
        },
        systemPromptTemplate: `당신은 현대판타지 웹소설 작가입니다.
- 현대 사회에 초자연적 요소가 결합된 세계관을 다루세요.
- 던전, 게이트, 몬스터 등의 묘사를 박진감 있게 하세요.
- 시스템 UI(스탯창, 스킬창, 알림)를 효과적으로 활용하세요.
- 주인공의 성장과 랭킹 상승을 독자가 체감하게 하세요.
- 현실 세계의 사회 구조(길드, 정부, 미디어)와의 상호작용을 다루세요.
- 레이드, 던전 공략 장면은 게임적 요소와 긴장감을 극대화하세요.`,
        storyBibleCategories: [
            { category: 'character', label: '인물', description: '이름, 등급, 직업, 스킬, 성격' },
            { category: 'dungeon', label: '던전/게이트', description: '등급, 위치, 몬스터, 보스' },
            { category: 'system', label: '시스템', description: '스탯, 스킬, 레벨, 퀘스트' },
            { category: 'guild', label: '길드/조직', description: '길드, 정부기관, 국제조직' },
            { category: 'world', label: '세계관', description: '각성 역사, 사회 변화, 국제 정세' },
            { category: 'item', label: '아이템', description: '무기, 방어구, 물약, 마석' },
            { category: 'event', label: '핵심 사건', description: '대규모 던전 브레이크, 레이드' },
            { category: 'monster', label: '몬스터', description: '종류, 등급, 약점, 드랍 아이템' },
        ],
        powerSystem: {
            name: '헌터/각성자 등급',
            levels: ['E급', 'D급', 'C급', 'B급', 'A급', 'S급', 'SS급', 'SSS급', '국가급', '???'],
        },
        narrativeConventions: ['각성', '던전 공략', '랭킹 경쟁', '레이드', '던전 브레이크', '국가 간 경쟁', '숨겨진 능력'],
        defaultRules: [
            '1인칭 시점 유지',
            '시스템 UI 묘사 활용',
            '파워 성장은 단계적으로',
            '현실 사회 반응 포함',
            '챕터 끝 클리프행어 필수',
        ],
    },
};

export function getGenrePreset(genreId: string): GenrePreset | null {
    return GENRE_PRESETS[genreId] || null;
}

export function getAllGenrePresets(): GenrePreset[] {
    return Object.values(GENRE_PRESETS);
}
