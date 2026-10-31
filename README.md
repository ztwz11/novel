# NovelForge AI

**소설 초안 작성부터 챕터 편집·내보내기까지 연결한 개인용 로컬 웹 앱입니다.**

프로젝트, 작가 페르소나, 세계관·캐릭터 설정을 관리하고, 이전 챕터와 요약을 다음 생성 요청의 문맥으로 구성합니다. Next.js·React·TypeScript로 화면과 API를 만들고 SQLite에 집필 데이터를 저장합니다.

현재는 개인 개발 프로젝트입니다. 아래 내용은 코드에 구현된 범위이며, 상용 서비스 운영이나 장편 전체의 품질을 보장한다는 뜻은 아닙니다.

## 주요 기능

| 기능 | 구현 범위 |
|---|---|
| 집필 작업 관리 | 프로젝트·권·챕터, 페르소나, 장르 프리셋, 세계관·캐릭터 설정 관리 |
| AI 챕터 생성 | Gemini·OpenAI·Anthropic 공급자 어댑터와 설정된 모델 선택 |
| 문맥 구성 | 설정집, 권별 시놉시스, 챕터 요약, 직전 챕터 본문, 선택한 참고 자료 조합 |
| 생성 상태 표시 | SSE로 시작·내용·완료·오류 전달. Gemini는 생성 중 전달, 다른 공급자는 생성 완료 후 분할 전달 |
| 집필 보조 | 탈고, 요약 압축, 일관성 점검, 삽화용 프롬프트·이미지 생성 경로 |
| 내보내기 | TXT·HTML·EPUB 출력 코드. 전자책 리더별 호환성은 별도 확인 필요 |

삽화 API와 모델별 동작은 계정 권한·모델 가용성·요청 매개변수에 따라 달라집니다. 모든 제공자·모델의 실서비스 동작을 검증한 것으로 소개하지 않습니다.

## 빠른 시작

### 1. 설치

Node.js 22와 npm을 권장합니다. `better-sqlite3` 네이티브 모듈 설치가 필요하며, 환경에 따라 별도 빌드 도구가 필요할 수 있습니다.

```bash
git clone https://github.com/ztwz11/novel.git
cd novel
npm ci
```

### 2. 환경변수

저장소의 `.env.example`을 `.env.local`로 복사하고 사용하는 키만 입력합니다. 기존 `.env.local`이 있으면 덮어쓰지 마세요.

macOS / Linux:

```bash
cp -n .env.example .env.local
```

Windows PowerShell:

```powershell
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
```

| 변수 | 사용 범위 |
|---|---|
| `GEMINI_API_KEY` | Gemini 챕터 생성·스트리밍, Gemini 기반 요약·삽화 프롬프트 등 보조 기능 |
| `OPENAI_API_KEY` | OpenAI 챕터 생성과 이미지 생성 경로 |
| `ANTHROPIC_API_KEY` | Anthropic 챕터 생성 경로 |

기본 집필 흐름을 살펴볼 때는 Gemini 키부터 설정하세요. 챕터 공급자를 바꾸더라도 일부 보조 기능은 Gemini를 사용합니다. 예를 들어 OpenAI 이미지 생성도 앞선 삽화 프롬프트 작성에는 Gemini가 필요합니다. `NEXT_PUBLIC_` 환경변수에 API 키를 넣지 마세요.

### 3. 로컬 실행

```bash
npm run dev -- --hostname 127.0.0.1
```

브라우저에서 `http://127.0.0.1:3000`을 엽니다. 기본 포트가 사용 중이면 터미널에 표시된 주소를 확인하세요. 로컬 빌드 실행은 다음과 같습니다.

```bash
npm run build
npm run start -- --hostname 127.0.0.1
```

**로컬 저장과 오프라인 실행은 다릅니다.** AI 기능을 사용하면 요청에 포함된 원고·설정·참고 자료가 외부 AI 제공자에 전달되고 비용이 발생할 수 있습니다. 회사 자료나 공개 권한이 없는 원고는 입력하지 마세요.

## 코드를 보는 순서

화면에서 AI 요청과 저장으로 이어지는 경로를 먼저 보는 편이 이해하기 쉽습니다.

| 관심 영역 | 시작 위치 |
|---|---|
| 화면과 편집 흐름 | [`src/app`](src/app), [`src/components`](src/components) |
| 생성·스트리밍 API | [`src/app/api/projects`](src/app/api/projects) |
| 공급자 교체 | [`src/lib/ai/providers`](src/lib/ai/providers) |
| 문맥 선택 | [`memory-manager.ts`](src/lib/memory/memory-manager.ts) |
| 데이터 저장 | [`src/lib/db`](src/lib/db) |
| 파일 출력 | [`exporter.ts`](src/lib/export/exporter.ts) |

세부 구조와 검증 방법은 [개발·검증 안내](docs/development.md), 참고 자료 관리는 [지식 파일 안내](docs/knowledge-file-guide.md)에 정리했습니다.

## 테스트와 정적 검사

```bash
npm test
npm run test:ci
npm run typecheck
npm run lint
npm run build
```

`npm test`와 `npm run test:ci`는 같은 Jest 테스트를 각각 기본 모드와 단일 프로세스 CI 모드로 실행합니다. 둘 다 실행해야 서로 다른 범위를 검증하는 것은 아닙니다. 변경 중 반복 실행은 `npm run test:watch`를 사용합니다.

현재 테스트 파일은 장르 프리셋, 집필 설정의 규칙 변환, DB를 모의 처리한 문맥 구성과 TXT·HTML 출력을 다룹니다. 실제 AI 요청, 브라우저 E2E, EPUB 리더 호환성 검증과는 별개입니다. 이 문서는 테스트 통과 수나 커버리지를 주장하지 않으며, 결과는 실행 환경에서 확인해야 합니다.

## 설계상 구분한 점과 한계

- **공급자와 공통 문맥:** 생성 인터페이스는 분리했지만 요약 등 일부 보조 기능은 Gemini에 의존합니다. 모델 목록은 코드에 정의돼 있으며 모든 모델을 자동 지원하지 않습니다.
- **본문과 요약:** 설정집·요약·직전 챕터를 나눠 문맥을 만듭니다. 압축 과정에서 세부 내용이 빠질 수 있으며, 장편 전체의 설정 일관성은 검증된 성능 지표가 아닙니다.
- **추정치와 실제 사용량:** 토큰·비용은 일부 고정값과 휴리스틱을 사용합니다. 최신 요금·실제 청구액·비용 상한으로 해석하지 마세요.
- **로컬 앱과 공개 서비스:** 다중 사용자 인증·권한·요청 제한을 갖춘 공개 서비스로 검증하지 않았습니다. 터널이나 공용 서버로 그대로 공개하지 마세요.

## 데이터와 라이선스

집필 데이터는 `data/novelforge.db`에 저장됩니다. `.env.local`, `data/`, DB 파일은 Git 제외 대상이며, `.env.example`에는 빈 키 이름만 둡니다. 공개 이슈·PR에는 API 키, 원고 원문, 개인 경로 또는 실제 DB를 올리지 마세요.

소스 코드는 [MIT License](LICENSE)를 따릅니다. 외부 모델의 이용 조건과 입력 자료·생성물의 권리는 별도로 확인해야 합니다.
