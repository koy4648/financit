// 비로그인 공개 대시보드 — 급등 종목 + 국내외 시장 정세
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Globe, Newspaper, RefreshCw, LogIn } from 'lucide-react';
import { getLoginUrl } from '@/const';

// 급등 종목 데이터 (야후 파이낸스 공개 API 기반 정적 + 동적 혼합)
const HOT_US_STOCKS = [
  { ticker: 'NVDA', name: '엔비디아', sector: '반도체', reason: 'AI 칩 수요 급증, Blackwell 출하 가속' },
  { ticker: 'META', name: '메타', sector: 'SNS/AI', reason: 'AI 광고 수익 급증, Llama 모델 확장' },
  { ticker: 'AMZN', name: '아마존', sector: '클라우드', reason: 'AWS AI 인프라 투자 확대' },
  { ticker: 'PLTR', name: '팔란티어', sector: 'AI 소프트웨어', reason: '미 정부 AI 계약 급증' },
  { ticker: 'LMT', name: '록히드마틴', sector: '방산', reason: 'NATO 방위비 증액, F-35 수주' },
];

const HOT_KR_STOCKS = [
  { ticker: '012450', name: '한화에어로스페이스', sector: '방산', reason: 'K-방산 수출 급증, 유럽 수주' },
  { ticker: '086520', name: '에코프로', sector: '2차전지', reason: '배터리 소재 수요 회복 기대' },
  { ticker: '000660', name: 'SK하이닉스', sector: '반도체', reason: 'HBM3E 독점 공급, AI 메모리 수요' },
  { ticker: '005380', name: '현대차', sector: '자동차', reason: '미국 현지 생산 확대, 관세 회피' },
  { ticker: '105560', name: 'KB금융', sector: '금융', reason: '고금리 수혜, 배당 확대 정책' },
];

// 시장 정세 카드 데이터
const MARKET_NEWS = [
  {
    category: '미·중 무역',
    icon: '🇺🇸🇨🇳',
    title: '관세 전쟁 90일 휴전',
    summary: '미국 145% → 30%, 중국 125% → 10%로 임시 인하. 2025년 8월까지 협상 진행 중. 반도체·소비재 관련주 주목.',
    impact: 'neutral',
    date: '2025.05',
  },
  {
    category: 'AI 인프라',
    icon: '🤖',
    title: 'AI 데이터센터 투자 폭발',
    summary: '빅테크 4사 2025년 AI 인프라 투자 $320B 예상. NVDA, AMD, 전력주(NEE, CEG) 수혜 지속.',
    impact: 'positive',
    date: '2025.05',
  },
  {
    category: '방산',
    icon: '🛡️',
    title: 'NATO 방위비 GDP 5% 목표',
    summary: '트럼프 압박으로 유럽 방위비 급증. 한화에어로스페이스 K-방산 수출 사상 최대. LMT, RTX 수혜.',
    impact: 'positive',
    date: '2025.05',
  },
  {
    category: '금리',
    icon: '🏦',
    title: 'Fed 금리 동결 지속',
    summary: '2025년 금리 인하 횟수 1-2회로 축소 전망. 미국채 30년물 수익률 4.8% 수준. 커버드콜 ETF 유리한 환경.',
    impact: 'neutral',
    date: '2025.05',
  },
  {
    category: '원자재',
    icon: '🥇',
    title: '금값 사상 최고가 경신',
    summary: '금값 $3,300/oz 돌파. 달러 약세·지정학 리스크·중앙은행 매수 3중 호재. ACE 금현물 ETF 수혜.',
    impact: 'positive',
    date: '2025.05',
  },
  {
    category: '국내 증시',
    icon: '🇰🇷',
    title: '코스피 외국인 순매수 전환',
    summary: '원화 강세 전환 기대감에 외국인 순매수 재개. 반도체·방산·금융 섹터 중심 상승. 코스피 2,600 회복 시도.',
    impact: 'positive',
    date: '2025.05',
  },
];

type StockWithPrice = {
  ticker: string;
  name: string;
  sector: string;
  reason: string;
  price?: number;
  changePercent?: number;
  loading?: boolean;
};

function StockCard({ stock, market }: { stock: StockWithPrice; market: 'US' | 'KR' }) {
  const isUp = (stock.changePercent ?? 0) >= 0;
  return (
    <div className="quant-card p-3 hover:bg-white/[0.04] transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div>
          <span className="ticker-badge text-xs">{stock.ticker}</span>
          <span className="text-sm font-medium ml-2">{stock.name}</span>
        </div>
        {stock.loading ? (
          <RefreshCw size={12} className="animate-spin text-muted-foreground mt-0.5" />
        ) : stock.changePercent !== undefined ? (
          <div className={`flex items-center gap-0.5 text-xs font-mono font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs px-1.5 py-0.5 rounded text-muted-foreground font-mono"
          style={{ background: 'oklch(0.18 0.02 255)', border: '1px solid oklch(0.25 0.02 255)' }}>
          {stock.sector}
        </span>
      </div>
      <p className="text-xs text-muted-foreground font-mono leading-relaxed">{stock.reason}</p>
    </div>
  );
}

export default function PublicDashboard() {
  const [usStocks, setUsStocks] = useState<StockWithPrice[]>(
    HOT_US_STOCKS.map(s => ({ ...s, loading: true }))
  );
  const [krStocks, setKrStocks] = useState<StockWithPrice[]>(
    HOT_KR_STOCKS.map(s => ({ ...s, loading: true }))
  );
  const [lastUpdated, setLastUpdated] = useState('');

  // 클라이언트에서 야후 파이낸스 직접 호출 (공개 API)
  useEffect(() => {
    const fetchPrices = async () => {
      const fetchOne = async (ticker: string, isKR: boolean) => {
        try {
          if (!ticker || typeof ticker !== 'string') return null;
          const yahooTicker = isKR ? `${ticker}.KS` : ticker;
          const baseUrl = "https://query1.finance.yahoo.com/v8/finance/chart/";
          const url = new URL(yahooTicker, baseUrl);
          url.searchParams.set("interval", "1d");
          url.searchParams.set("range", "2d");
          
          const res = await fetch(url.toString());
          if (!res.ok) return null;
          const data = await res.json();
          const meta = data?.chart?.result?.[0]?.meta;
          if (!meta) return null;
          const price = meta.regularMarketPrice ?? 0;
          const prev = meta.previousClose ?? meta.chartPreviousClose ?? price;
          const changePercent = prev > 0 ? ((price - prev) / prev) * 100 : 0;
          return { price, changePercent };
        } catch {
          return null;
        }
      };

      const [usResults, krResults] = await Promise.all([
        Promise.all(HOT_US_STOCKS.map(s => fetchOne(s.ticker, false))),
        Promise.all(HOT_KR_STOCKS.map(s => fetchOne(s.ticker, true))),
      ]);

      setUsStocks(HOT_US_STOCKS.map((s, i) => ({
        ...s,
        price: usResults[i]?.price,
        changePercent: usResults[i]?.changePercent,
        loading: false,
      })));
      setKrStocks(HOT_KR_STOCKS.map((s, i) => ({
        ...s,
        price: krResults[i]?.price,
        changePercent: krResults[i]?.changePercent,
        loading: false,
      })));
      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    };

    fetchPrices();
  }, []);

  return (
    <div className="space-y-16">
      {/* 로그인 유도 배너 */}
      <div className="quant-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ borderColor: 'rgba(0,212,255,0.3)', background: 'rgba(0,212,255,0.04)' }}>
        <div>
          <div className="font-semibold text-sm mb-1" style={{ color: '#00d4ff' }}>내 포트폴리오를 추적하려면 로그인하세요</div>
          <div className="text-xs text-muted-foreground font-mono">
            로그인하면 포트폴리오 등록·수익률 추적·AI 진단·매수 캘린더를 모두 이용할 수 있습니다
          </div>
        </div>
        <a href={getLoginUrl()} className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium text-background whitespace-nowrap"
          style={{ background: '#00d4ff' }}>
          <LogIn size={14} />
          로그인 / 회원가입
        </a>
      </div>

      {/* 급등 종목 */}
      <section>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #00ff88, #00d4ff)' }} />
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>주목할 종목</h2>
              <p className="text-sm text-muted-foreground mt-0.5 font-mono">
                2026년 5월 현재 · 국내외 주목 종목
                {lastUpdated && <span className="ml-2 text-xs opacity-60">시세 {lastUpdated} 기준</span>}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 미국 주식 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={14} style={{ color: '#00d4ff' }} />
              <span className="text-sm font-medium font-mono">🇺🇸 미국 주식</span>
            </div>
            <div className="space-y-2">
              {usStocks.map(stock => (
                <StockCard key={stock.ticker} stock={stock} market="US" />
              ))}
            </div>
          </div>

          {/* 국내 주식 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={14} style={{ color: '#00ff88' }} />
              <span className="text-sm font-medium font-mono">🇰🇷 국내 주식</span>
            </div>
            <div className="space-y-2">
              {krStocks.map(stock => (
                <StockCard key={stock.ticker} stock={stock} market="KR" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 시장 정세 */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #f59e0b, #7c3aed)' }} />
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>국내외 시장 정세</h2>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">2026년 5월 기준 주요 이슈 및 투자 영향</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MARKET_NEWS.map((news, i) => (
            <div key={i} className={`quant-card p-4 border-l-2 ${
              news.impact === 'positive' ? 'border-l-green-500' :
              news.impact === 'negative' ? 'border-l-red-500' : 'border-l-amber-500'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{news.icon}</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-mono text-muted-foreground"
                  style={{ background: 'oklch(0.18 0.02 255)', border: '1px solid oklch(0.25 0.02 255)' }}>
                  {news.category}
                </span>
                <span className="text-xs text-muted-foreground font-mono ml-auto">{news.date}</span>
              </div>
              <h3 className="text-sm font-semibold mb-2">{news.title}</h3>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">{news.summary}</p>
              <div className={`mt-2 text-xs font-mono font-semibold ${
                news.impact === 'positive' ? 'text-green-400' :
                news.impact === 'negative' ? 'text-red-400' : 'text-amber-400'
              }`}>
                {news.impact === 'positive' ? '▲ 긍정적' : news.impact === 'negative' ? '▼ 부정적' : '◆ 중립'}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
