// ============================================================
// DESIGN: Dark Quant Terminal - Portfolio Data Layer
// All portfolio state is stored in localStorage for persistence
// ============================================================

export type AssetType = 'us-stock' | 'kr-stock' | 'etf' | 'commodity';
export type BuyFrequency = 'daily' | 'weekly' | 'monthly';

export interface PortfolioItem {
  id: string;
  ticker: string;
  name: string;
  nameKr: string;
  type: AssetType;
  avgCost: number;          // 평균 매수가 (원 또는 달러)
  currency: 'KRW' | 'USD';
  shares: number;           // 보유 수량 (소수점 가능)
  buyAmount: number;        // 1회 매수금액
  buyFrequency: BuyFrequency;
  sector: string;
  memo?: string;
}

export interface MarketData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  currency: 'KRW' | 'USD';
  lastUpdated: string;
}

// 기본 포트폴리오 (사용자 현재 보유 종목)
export const DEFAULT_PORTFOLIO: PortfolioItem[] = [
  {
    id: 'nvda',
    ticker: 'NVDA',
    name: 'NVIDIA',
    nameKr: '엔비디아',
    type: 'us-stock',
    avgCost: 115.0,
    currency: 'USD',
    shares: 0.5,
    buyAmount: 1000,
    buyFrequency: 'daily',
    sector: 'AI 반도체',
  },
  {
    id: 'tsla',
    ticker: 'TSLA',
    name: 'Tesla',
    nameKr: '테슬라',
    type: 'us-stock',
    avgCost: 250.0,
    currency: 'USD',
    shares: 0.2,
    buyAmount: 1000,
    buyFrequency: 'daily',
    sector: '전기차/에너지',
  },
  {
    id: 'lly',
    ticker: 'LLY',
    name: 'Eli Lilly',
    nameKr: '일라이 릴리',
    type: 'us-stock',
    avgCost: 800.0,
    currency: 'USD',
    shares: 0.07,
    buyAmount: 1000,
    buyFrequency: 'daily',
    sector: '헬스케어/비만치료제',
  },
  {
    id: 'lmt',
    ticker: 'LMT',
    name: 'Lockheed Martin',
    nameKr: '록히드마틴',
    type: 'us-stock',
    avgCost: 480.0,
    currency: 'USD',
    shares: 0.12,
    buyAmount: 1000,
    buyFrequency: 'daily',
    sector: '방산',
  },
  {
    id: 'aapl',
    ticker: 'AAPL',
    name: 'Apple',
    nameKr: '애플',
    type: 'us-stock',
    avgCost: 190.0,
    currency: 'USD',
    shares: 0.3,
    buyAmount: 1000,
    buyFrequency: 'daily',
    sector: '빅테크',
  },
  {
    id: 'sp500',
    ticker: 'SPY',
    name: 'S&P 500 ETF',
    nameKr: 'S&P500 ETF',
    type: 'etf',
    avgCost: 550.0,
    currency: 'USD',
    shares: 0.5,
    buyAmount: 100000,
    buyFrequency: 'monthly',
    sector: '미국 지수',
  },
  {
    id: 'nasdaq',
    ticker: 'QQQ',
    name: 'NASDAQ ETF',
    nameKr: '나스닥 ETF',
    type: 'etf',
    avgCost: 480.0,
    currency: 'USD',
    shares: 0.4,
    buyAmount: 80000,
    buyFrequency: 'monthly',
    sector: '미국 기술주 지수',
  },
  {
    id: 'gold',
    ticker: '411060.KS',
    name: 'ACE Gold ETF',
    nameKr: 'ACE 금현물',
    type: 'commodity',
    avgCost: 14000,
    currency: 'KRW',
    shares: 5,
    buyAmount: 70000,
    buyFrequency: 'monthly',
    sector: '금 현물',
  },
  {
    id: 'bond',
    ticker: '476550.KS',
    name: 'US 30Y Bond Covered Call',
    nameKr: '미국30년국채커버드콜(합성)',
    type: 'etf',
    avgCost: 9500,
    currency: 'KRW',
    shares: 6,
    buyAmount: 60000,
    buyFrequency: 'monthly',
    sector: '미국 장기국채',
  },
];

// 국내 추천 종목 데이터
export interface KrStockRecommendation {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  theme: string;
  expectedReturn: number;
  riskScore: number;
  dividendYield: number;
  marketCap: string;
  pros: string[];
  cons: string[];
  verdict: 'strong-buy' | 'buy' | 'hold';
  verdictText: string;
  suggestedAmount: number;
  suggestedFrequency: BuyFrequency;
}

export const KR_RECOMMENDATIONS: KrStockRecommendation[] = [
  {
    id: 'samsung',
    ticker: '005930',
    name: '삼성전자',
    sector: '반도체',
    theme: 'AI 메모리 (HBM)',
    expectedReturn: 35,
    riskScore: 6,
    dividendYield: 2.5,
    marketCap: '약 500조원',
    pros: [
      'HBM4 양산으로 AI 메모리 수요 직접 수혜',
      '파운드리 2나노 공정 턴어라운드 진행 중',
      '배당수익률 2.5% + 자사주 매입 정책',
      '소수점 매수 가능, 국내 대표 우량주',
    ],
    cons: [
      '미중 반도체 규제 리스크 상존',
      'SK하이닉스 대비 HBM 점유율 열세',
    ],
    verdict: 'strong-buy',
    verdictText: '강력 추천',
    suggestedAmount: 1000,
    suggestedFrequency: 'daily',
  },
  {
    id: 'hynix',
    ticker: '000660',
    name: 'SK하이닉스',
    sector: '반도체',
    theme: 'HBM 세계 1위',
    expectedReturn: 45,
    riskScore: 8,
    dividendYield: 0.5,
    marketCap: '약 150조원',
    pros: [
      'HBM3E·HBM4 세계 1위 공급사 (NVIDIA 독점 공급)',
      '2026년 HBM 매출 비중 50% 이상 예상',
      '삼성전자보다 높은 AI 수혜 순도',
    ],
    cons: [
      '주가 변동성 매우 높음 (고위험)',
      '배당 거의 없음, 성장주 성격',
      '삼성전자와 섹터 중복',
    ],
    verdict: 'buy',
    verdictText: '추천 (고위험)',
    suggestedAmount: 1000,
    suggestedFrequency: 'daily',
  },
  {
    id: 'semietf',
    ticker: '091160',
    name: '한국반도체 ETF',
    sector: '반도체 ETF',
    theme: '반도체 섹터 분산',
    expectedReturn: 38,
    riskScore: 6,
    dividendYield: 1.2,
    marketCap: 'ETF',
    pros: [
      '삼성전자+SK하이닉스+소재·장비주 한번에 투자',
      '개별 종목 리스크 분산 효과',
      '소수점 매수 가능',
    ],
    cons: [
      '개별 종목 대비 수익률 희석',
      '운용보수 발생',
    ],
    verdict: 'buy',
    verdictText: '추천 (분산형)',
    suggestedAmount: 1000,
    suggestedFrequency: 'daily',
  },
  {
    id: 'kbfin',
    ticker: '105560',
    name: 'KB금융',
    sector: '금융',
    theme: '밸류업 대장주',
    expectedReturn: 25,
    riskScore: 4,
    dividendYield: 5.2,
    marketCap: '약 60조원',
    pros: [
      '한국 밸류업 프로그램 최대 수혜주',
      '배당수익률 5.2% + 적극적 자사주 매입·소각',
      '저PBR 해소 정책으로 구조적 리레이팅 진행 중',
      '미국 포트폴리오에 없는 고배당 가치주 역할',
    ],
    cons: [
      '금리 하락 시 순이자마진(NIM) 압박',
      '경기 침체 시 대손충당금 증가 위험',
    ],
    verdict: 'buy',
    verdictText: '추천 (배당 중심)',
    suggestedAmount: 1000,
    suggestedFrequency: 'daily',
  },
  {
    id: 'hanwha',
    ticker: '012450',
    name: '한화에어로스페이스',
    sector: '방산',
    theme: 'K-방산 수출',
    expectedReturn: 40,
    riskScore: 7,
    dividendYield: 0.8,
    marketCap: '약 45조원',
    pros: [
      '이란 분쟁 등 지정학적 리스크 직접 수혜',
      '폴란드·루마니아 등 수십조 수주잔고 확보',
      '록히드마틴과 함께 글로벌 방산 양축 구성',
    ],
    cons: [
      '지정학적 리스크 완화 시 주가 조정 가능',
      '고PER 밸류에이션 부담',
    ],
    verdict: 'buy',
    verdictText: '추천 (지정학 헤지)',
    suggestedAmount: 1000,
    suggestedFrequency: 'daily',
  },
];

// 연간 수익률 데이터
export const ANNUAL_RETURNS = [
  { year: '2021', sp500: 26.9, nasdaq: 21.4, kospi: 3.6, kosdaq: 4.9 },
  { year: '2022', sp500: -19.4, nasdaq: -33.1, kospi: -24.9, kosdaq: -34.3 },
  { year: '2023', sp500: 24.2, nasdaq: 43.4, kospi: 18.7, kosdaq: 27.6 },
  { year: '2024', sp500: 23.3, nasdaq: 24.9, kospi: -9.6, kosdaq: -21.7 },
  { year: '2025', sp500: 23.3, nasdaq: 29.6, kospi: 75.6, kosdaq: 68.2 },
];

// 섹터 성과 데이터
export const SECTOR_PERFORMANCE = [
  { sector: '방산', return2025: 220, return2026ytd: 45 },
  { sector: '반도체', return2025: 180, return2026ytd: 75 },
  { sector: '금융', return2025: 85, return2026ytd: 55 },
  { sector: '바이오', return2025: 60, return2026ytd: 40 },
  { sector: '자동차', return2025: 45, return2026ytd: 30 },
  { sector: '통신', return2025: 30, return2026ytd: 20 },
  { sector: '에너지', return2025: -15, return2026ytd: 10 },
  { sector: '유통', return2025: -20, return2026ytd: -5 },
];

// 글로벌 이슈 타임라인
export const GLOBAL_EVENTS = [
  {
    date: '2022.01',
    title: '연준 금리 인상 시작',
    impact: 'negative',
    description: '인플레이션 억제를 위한 급격한 금리 인상. 미국·한국 증시 동반 급락.',
  },
  {
    date: '2022.11',
    title: 'ChatGPT 출시',
    impact: 'positive',
    description: '생성형 AI 혁명 시작. NVIDIA 등 AI 관련주 폭발적 상승의 기폭제.',
  },
  {
    date: '2024.01',
    title: '한국 밸류업 프로그램',
    impact: 'positive',
    description: '저PBR 기업 주주환원 강화 정책. 금융·지주사 중심 리레이팅 진행.',
  },
  {
    date: '2025.04',
    title: '트럼프 상호관세 발동',
    impact: 'negative',
    description: '중국 67%, 한국 50% 등 전방위 관세. 단기 충격 후 협상 국면 진입.',
  },
  {
    date: '2026.01',
    title: '이란 분쟁 발발',
    impact: 'mixed',
    description: '호르무즈 해협 통행 제한. 에너지·방산주 급등, 전반적 시장 변동성 확대.',
  },
];

// localStorage 유틸리티
export const STORAGE_KEY = 'quant-dashboard-portfolio';

export function loadPortfolio(): PortfolioItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_PORTFOLIO;
}

export function savePortfolio(items: PortfolioItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export function formatKRW(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억원`;
  if (amount >= 10000) return `${(amount / 10000).toFixed(0)}만원`;
  return `${amount.toLocaleString()}원`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getBuyFrequencyLabel(freq: BuyFrequency): string {
  const map = { daily: '매일', weekly: '매주', monthly: '매월' };
  return map[freq];
}

export function getVerdictColor(verdict: KrStockRecommendation['verdict']): string {
  const map = {
    'strong-buy': 'text-mint',
    'buy': 'text-cyan',
    'hold': 'text-amber-400',
  };
  return map[verdict];
}
