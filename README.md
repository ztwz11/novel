<p align="center">
  <img src="docs/logo.svg" alt="NovelForge AI" width="80" />
</p>

<h1 align="center">NovelForge AI ✨</h1>

<p align="center">
  <strong>AI 기반 장편소설 창작 도구</strong><br/>
  페르소나 · 멀티 프로바이더 · SSE 스트리밍 · EPUB 내보내기
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/SQLite-via_better--sqlite3-003B57?logo=sqlite" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## 📖 소개

**NovelForge AI**는 30권 이상의 장편 웹소설을 AI와 함께 작성하기 위한 올인원 창작 도구입니다.

- 🎭 **페르소나 시스템** — Gemini Gems처럼 작가의 문체·톤·규칙을 정의
- 🧠 **3단계 메모리** — 단기(최근 챕터) · 중기(압축 요약) · 장기(스토리바이블)로 일관성 유지
- 💎 **멀티 프로바이더** — Gemini, OpenAI, Anthropic 동시 지원 + 실시간 비용 추정 (₩KRW)
- ⚡ **SSE 스트리밍** — Gemini 실시간 토큰 스트리밍으로 타이핑 효과
- ✏️ **AI 탈고** — 문장 다듬기, 묘사 강화, 전투 액션 등 8가지 포커스
- 🎨 **삽화 생성** — Gemini Imagen / DALL-E 3 / 프롬프트 생성
- 📕 **EPUB 3.0 내보내기** — 전자책 리더 호환

---

## 🚀 빠른 시작

### 요구 사항

- **Node.js** 20+ 
- **API 키** 하나 이상 (Gemini / OpenAI / Anthropic)

### 설치

```bash
git clone https://github.com/YOUR_USERNAME/novelforge-ai.git
cd novelforge-ai
npm install
```

### 환경 변수

`.env.local` 파일을 프로젝트 루트에 생성:

```env
# 필수 (하나 이상)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key        # 선택
ANTHROPIC_API_KEY=your_anthropic_api_key  # 선택
```

> **API 키 발급:**
> - Gemini → [Google AI Studio](https://aistudio.google.com/apikey)
> - OpenAI → [OpenAI Platform](https://platform.openai.com/api-keys)
> - Anthropic → [Anthropic Console](https://console.anthropic.com/)

### 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 접속할 수 있습니다.

---

## 🏗️ 프로젝트 구조

```
novelforge-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # 메인 대시보드
│   │   ├── personas/           # 페르소나 관리
│   │   ├── project/[id]/       # 프로젝트 에디터
│   │   └── api/                # API 라우트
│   │       └── projects/[id]/
│   │           ├── generate/   # 챕터 생성
│   │           ├── stream/     # SSE 스트리밍
│   │           ├── revise/     # AI 탈고
│   │           ├── illustrate/ # 삽화 생성
│   │           ├── export/     # TXT/HTML/EPUB
│   │           ├── estimate/   # 비용 추정
│   │           ├── compress/   # 요약 압축
│   │           └── consistency/# 일관성 검증
│   ├── components/             # UI 컴포넌트
│   │   ├── ChapterSidebar.tsx
│   │   ├── ChapterViewer.tsx
│   │   ├── GenerateTab.tsx     # 스트리밍 포함
│   │   ├── ReviseTab.tsx
│   │   ├── IllustrateTab.tsx
│   │   └── StoryBibleTab.tsx
│   └── lib/
│       ├── ai/
│       │   ├── providers/      # Gemini, OpenAI, Anthropic
│       │   ├── prompt-builder.ts
│       │   └── gemini-client.ts
│       ├── memory/
│       │   ├── memory-manager.ts
│       │   └── summary-compressor.ts
│       ├── export/exporter.ts  # TXT, HTML, EPUB 3.0
│       └── db.ts               # SQLite (better-sqlite3)
├── docs/                       # 가이드 문서
└── data/                       # SQLite DB (gitignored)
```

---

## ✨ 주요 기능

### 🎭 페르소나

장르별 프리셋(무협, 판타지, 현대판타지...)으로 빠르게 생성하거나, 직접 시스템 프롬프트와 작성 규칙을 정의합니다. 지식 파일을 첨부하면 세계관·설정집을 AI가 참고합니다.

### ✨ 챕터 생성

| 기능 | 설명 |
|------|------|
| 방향 지시 | "주인공이 비급을 발견하고 수련 시작" 같은 자연어 지시 |
| 프로바이더 선택 | 💎 Gemini · 🤖 OpenAI · 🟣 Anthropic |
| 모델 선택 | 각 프로바이더의 모든 모델 지원 |
| 비용 추정 | 생성 전 ₩KRW 단위 비용 자동 계산 |
| SSE 스트리밍 | 실시간 타이핑 효과 (토글 가능) |
| 지식 파일 | 선택적으로 참고 자료 포함 |

### ✏️ AI 탈고

- **8가지 포커스**: 문장 다듬기, 묘사 강화, 대사 개선, 전투 액션, 페이싱, 감정선, 일관성, 분량
- **3단계 강도**: 🌱 가볍게 · ⚡ 보통 · 🔥 대폭 수정
- 여러 챕터 동시 선택 후 일괄 탈고

### 🎨 삽화

- **프로바이더**: Gemini Imagen 3 · OpenAI DALL-E 3 · 프롬프트만 생성
- **유형**: 장면 · 캐릭터 · 배경 · 표지
- **스타일**: 애니메이션 · 웹툰 · 수묵화 · 디지털 아트 · 유화 등 8종
- 한국어 + 영어 프롬프트 동시 생성

### 📕 내보내기

- **TXT** — 플레인 텍스트
- **HTML** — 스타일링된 웹 페이지
- **EPUB 3.0** — 전자책 리더 호환 (목차, 챕터별 분리, 한국어 스타일)

### 🧠 메모리 시스템

30권 이상 장편에서도 일관성을 유지하기 위한 3단계 메모리:

```
┌─────────────┐  ┌─────────────────┐  ┌──────────────┐
│  단기 메모리  │  │   중기 메모리     │  │  장기 메모리   │
│  최근 3-5화  │  │  압축 요약       │  │ 스토리바이블   │
│  전체 텍스트  │  │  핵심 이벤트만   │  │ 캐릭터·세계관  │
└─────────────┘  └─────────────────┘  └──────────────┘
```

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Vanilla CSS (다크 테마) |
| DB | SQLite via better-sqlite3 |
| AI | Gemini, OpenAI, Anthropic SDK |
| 스트리밍 | Server-Sent Events (SSE) |
| EPUB | JSZip |
| 타입 | TypeScript 5, Zod |
| 테스트 | Jest, Testing Library |

---

## 📝 API 라우트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/projects` | 프로젝트 목록 |
| POST | `/api/projects` | 프로젝트 생성 |
| GET | `/api/projects/[id]` | 프로젝트 상세 |
| POST | `/api/projects/[id]/generate` | 챕터 생성 |
| POST | `/api/projects/[id]/stream` | SSE 스트리밍 생성 |
| POST | `/api/projects/[id]/revise` | AI 탈고 |
| POST | `/api/projects/[id]/illustrate` | 삽화 생성 |
| GET | `/api/projects/[id]/export` | 내보내기 (txt/html/epub) |
| POST | `/api/projects/[id]/estimate` | 비용 추정 |
| POST | `/api/projects/[id]/compress` | 요약 압축 |
| POST | `/api/projects/[id]/consistency` | 일관성 검증 |
| GET/POST | `/api/personas` | 페르소나 CRUD |
| GET/POST | `/api/personas/[id]/knowledge` | 지식 파일 관리 |

---

## 🤝 기여

1. Fork 후 새 브랜치에서 작업
2. `npm run build` 로 빌드 확인
3. Pull Request 생성

---

## 📄 라이선스

MIT License — 자유롭게 사용, 수정, 배포할 수 있습니다.

---

<p align="center">
  Made with ❤️ for Korean web novel writers
</p>
