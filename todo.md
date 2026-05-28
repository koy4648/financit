# 투자 전략 대시보드 TODO

## Phase 9: DB 연동 완성
- [x] web-db-user 업그레이드
- [x] DB 스키마 (portfolio_items, buy_records) 설계 및 마이그레이션
- [x] tRPC 라우터 (portfolio CRUD, buyRecord CRUD) 구현
- [x] NavBar 로그인/로그아웃 버튼 추가
- [x] PinLock → 로그인 게이트 전환
- [x] PortfolioSection DB 기반 재작성
- [x] AutoAccumulateModal DB 기반으로 전환 (localStorage → tRPC)
- [x] BuyRecordModal DB 기반으로 전환 (localStorage → tRPC)
- [x] App.tsx ThemeProvider dark 유지

## Phase 10: 실시간 현재가·수익률·환율
- [x] 서버사이드 야후파이낸스 현재가 조회 API (tRPC)
- [x] 실시간 환율 조회 API (USD/KRW)
- [x] 포트폴리오 종목별 현재가·평가손익·수익률(%) 표시
- [x] 총 평가금액 (원화 환산) 헤더 표시
- [x] 섹터 집중도 경고 (50% 초과 시 시각적 경고)
- [x] AI 포트폴리오 진단 (LLM 연동, 리밸런싱 제안)

## Phase 11: 포트폴리오 스냅샷 히스토리
- [x] DB 스냅샷 테이블 (portfolio_snapshots)
- [x] 스냅샷 저장/조회 API (tRPC)

## Phase 12: 매수 캘린더·목표가 알림
- [x] 매수 캘린더 (이번 달 매수 예정일 달력 시각화)
- [x] 오늘 매수 예정 종목 사이드 패널
- [x] 목표가 설정 및 브라우저 알림 (Web Notification API)
- [x] 알림 추가/삭제 UI

## Phase 13: 비로그인 공개 대시보드
- [x] 비로그인 유저 감지 및 공개/개인 대시보드 분기
- [x] 급등 종목 섹션 (국내외 실시간 상위 종목)
- [x] 국내외 시장 정세 뉴스 섹션
- [x] NavBar 로그인 여부에 따라 메뉴 분기

## Phase 14: 최종 테스트 + 체크포인트
- [x] TypeScript 빌드 오류 없음 확인
- [x] vitest 테스트 통과
- [x] 히어로 제목 "티끌모아 태산"으로 변경
- [x] 최종 체크포인트 저장

## Phase 15: PWA 설정
- [x] PWA 앱 아이콘 생성 (512x512, 192x192, 180x180)
- [x] manifest.json 작성 (앱 이름, 아이콘, 테마 색상, 전체화면 모드)
- [x] Service Worker 등록 (오프라인 캐싱)
- [x] index.html에 PWA 메타태그 추가
- [x] iOS Safari 홈 화면 추가 지원 (apple-touch-icon)
- [x] 체크포인트 저장

## Phase 16~18: 재무관리.xlsx 기반 종합 재무 관리 기능

### DB 스키마 확장
- [x] portfolio_items에 accountType 컬럼 추가 (isa/pension/irp/general)
- [x] principal_records 테이블 (원금기록장 — 날짜별 계좌별 입금액)
- [x] fx_records 테이블 (외화내역 — 매수/매도, 날짜, 환율, 달러, 원화)
- [x] realized_gains 테이블 (실현손익 — 한국/미국 구분, 매수/매도 정보)
- [x] DB 마이그레이션 완료

### 계좌별 포트폴리오 UI
- [x] 계좌 탭 (중개형ISA / 연금저축펀드 / IRP / 일반계좌) 구성
- [x] 각 계좌별 종목 목록 + 평단가 + 수량 + 투자금액 표시
- [x] 계좌별 총 투자금액 요약 + 전체 합계 표시
- [x] AccountPortfolioSection 컴포넌트 완성 및 Home.tsx 조립
- [x] NavBar에 계좌별 포트폴리오(#accounts) 링크 추가

### 원금기록장
- [x] 날짜별 계좌별 입금액 입력 UI
- [x] 월별 적립액 집계 차트 (스택 바차트)
- [x] 계좌별/전체 누계 원금 표시

### 외화내역
- [x] 외화 매수/매도 기록 입력 (날짜, 환율, 달러, 원화)
- [x] 평균 환전 환율 자동 계산
- [x] 총 환전 원화/달러 집계

### 실현손익
- [x] 한국/미국 실현손익 기록 입력 (매수일/매도일/종목/단가/수량)
- [x] 절대 수익률 / 보유기간 자동 계산
- [x] 한국/미국 필터 탭

### 재무기록 통합 섹션
- [x] FinanceRecordsSection 컴포넌트 완성 (원금기록장/외화내역/실현손익 탭)
- [x] Home.tsx에 조립
- [x] NavBar에 재무기록(#finance-records) 링크 추가

### 종합 대시보드 업그레이드
- [x] SummaryDashboard 컴포넌트 — 전체 자산 현황 요약 카드
- [x] 총 납입 원금 / 총 투자금액 / 총 실현손익 / 원금 대비 수익률 표시
- [x] 계좌별 비중 파이차트
- [x] Home.tsx 히어로 섹션 바로 아래 배치

### 최종
- [x] TypeScript 오류 없음 (npx tsc --noEmit)
- [x] vitest 테스트 통과 (1 test passed)
- [x] DB 마이그레이션 완료
- [x] 최종 체크포인트 저장
