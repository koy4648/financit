# Financit 📈 (티끌모아 태산)

**Financit**은 개인 투자 및 종합 재무 관리를 위해 최적화된 **다크 테크 퀀트(Dark Quant Terminal) 미학**의 투자 대시보드 웹 애플리케이션입니다. 
분산되어 있는 계좌 자산, 투자금 납입 원금, 외화 거래 내역, 그리고 실현손익을 한곳에서 모아 실시간 시세 및 AI 진단과 함께 체계적으로 관리할 수 있습니다.

---

## 🎨 디자인 컨셉: 다크 테크 퀀트 (Dark Quant Terminal)
실제 전문 트레이더들이 사용하는 터미널의 미학을 웹에 구현했습니다.
* **배경색:** 딥 네이비 블랙 (`#0a0e1a`) & 다크 그레이 (`#111827`) 기반의 고대비 다크 모드
* **강조색:** 형광 네온 사이언 블루 (`#00d4ff`), 민트 그린 (`#00ff88`), 네온 오렌지 (`#ff6b35`)
* **타이포그래피:**
  * 헤더: `Space Grotesk` (전문적이고 기하학적인 느낌)
  * 숫자/데이터: `JetBrains Mono` (가독성 높은 모노스페이스 서체)
  * 본문: `Inter` (깔끔하고 모던한 산세리프)

---

## 🛠 기술 스택 (Technology Stack)

### Frontend
* **Core:** React 19, TypeScript
* **Styling:** Vanilla CSS, TailwindCSS (v4), PostCSS, Framer Motion (애니메이션)
* **Charts:** Recharts (그라데이션 및 네온 글로우 효과가 가미된 시각화)
* **Libraries:** Lucide React (아이콘), Sonner (토스트 알림), Wouter (라우팅)

### Backend
* **Runtime & Framework:** Node.js, Express
* **API Protocol:** tRPC v11 (Frontend와 Backend 간의 타입 안전한 API 통신)

### Database & ORM
* **ORM:** Drizzle ORM (MySQL Core)
* **Database:** TiDB Cloud Serverless (MySQL 호환 서버리스 클라우드 DB)

### PWA & Service Worker
* **PWA:** Manifest 구성, 오프라인 캐싱 지원 (Service Worker), iOS Safari 홈 화면 추가 대응 (`apple-touch-icon`)

---

## ✨ 핵심 기능 (Key Features)

### 1. 종합 대시보드 (Summary Dashboard)
* **전체 자산 현황:** 총 납입 원금, 총 투자 평가 금액, 총 실현손익, 누적 수익률(원금 대비)을 한눈에 요약 카드 형태로 시각화
* **자산 배분 차트:** 계좌별 자산 비중을 원형 파이차트로 일목요연하게 표시

### 2. 계좌별 포트폴리오 (Account Portfolio)
* **계좌 탭 구분:** 일반 계좌, 중개형 ISA, 연금저축펀드, IRP로 분류하여 관리
* **실시간 시세 반영:** Yahoo Finance API를 통해 실시간 주가 및 USD/KRW 실시간 환율을 반영하여 평가손익 및 수익률 계산
* **섹터 집중도 경고:** 단일 섹터의 비중이 50%를 초과할 경우 경고 표시
* **AI 포트폴리오 진단:** LLM(인공지능)을 연동하여 현재 포트폴리오의 리스크를 진단하고 리밸런싱 전략 제안

### 3. 재무 기록장 (Finance Records)
* **원금기록장:** 날짜별/계좌별 입금액 기록 및 월별 누적 적립액 집계 스택 바차트
* **외화내역:** 달러 매수/매도 내역을 기록하여 평균 환전 환율 및 총 환전 금액(달러/원화) 자동 산출
* **실현손익:** 한국/미국 주식의 매도 실현손익 입력, 절대 수익률 및 실제 보유 기간 자동 연산

### 4. 매수 캘린더 및 알림 설정
* **적립식 매수 달력:** 이번 달 매수 예정인 종목과 매수일을 캘린더 뷰로 시각화
* **목표가 알림:** 특정 가격 도달 시 브라우저 Notification API를 이용한 실시간 알림 기능 제공

### 5. 비로그인 공개 대시보드
* 로그인하지 않은 일반 방문자도 실시간 국내외 시장 급등락 종목(주식 랭킹) 및 글로벌 뉴스 섹션을 확인할 수 있는 공개 대시보드 레이아웃 분기 처리

---

## 🚀 로컬 개발 환경 설정 (Local Setup)

### 1. 사전 요구사항 (Prerequisites)
* Node.js (v18 이상 권장)
* pnpm (또는 npm / yarn)

### 2. 패키지 설치
```bash
npx pnpm install
```

### 3. 환경 변수 설정
프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래 형식을 채워 넣습니다:
```env
DATABASE_URL="mysql://<user>:<password>@<host>:<port>/financit?ssl=%7B%22rejectUnauthorized%22%3Atrue%7D"
JWT_SECRET="your_jwt_secret_key"
OAUTH_SERVER_URL="your_oauth_server_url"
```

### 4. 데이터베이스 마이그레이션 (Drizzle)
Drizzle ORM을 이용해 TiDB Cloud 데이터베이스에 테이블을 생성합니다:
```bash
npx pnpm db:push
```

### 5. 로컬 개발 서버 실행
```bash
npx pnpm dev
```
서버가 켜지면 브라우저에서 `http://localhost:3000/`으로 접속할 수 있습니다.

---

## 📦 Vercel 배포 (Deployment)

본 프로젝트는 Vercel 빌드 및 배포에 맞추어 [vercel.json](vercel.json) 설정이 완료되어 있습니다. 
GitHub 저장소와 Vercel 프로젝트가 연결된 상태에서 `DATABASE_URL` 등 필요한 환경 변수를 Vercel 대시보드에 설정하면 푸시와 동시에 자동으로 빌드 및 배포가 수행됩니다.

```bash
git push
```
