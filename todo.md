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
- [ ] 최종 체크포인트 저장
