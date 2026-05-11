// DESIGN: Dark Quant Terminal - Korea Stock Recommendation Section
// Detailed comparison: 삼성전자 vs SK하이닉스 vs 한국반도체ETF vs KB금융 vs 한화에어로

import { useState } from 'react';
import { KR_RECOMMENDATIONS, KrStockRecommendation, getBuyFrequencyLabel, formatKRW } from '@/lib/portfolioData';
import { Star, TrendingUp, Shield, Zap, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

const VERDICT_STYLES: Record<KrStockRecommendation['verdict'], { bg: string; text: string; border: string; label: string }> = {
  'strong-buy': { bg: 'rgba(0,255,136,0.08)', text: '#00ff88', border: 'rgba(0,255,136,0.3)', label: '강력 추천' },
  'buy': { bg: 'rgba(0,212,255,0.08)', text: '#00d4ff', border: 'rgba(0,212,255,0.3)', label: '추천' },
  'hold': { bg: 'rgba(245,158,11,0.08)', text: '#f59e0b', border: 'rgba(245,158,11,0.3)', label: '보류' },
};

const RISK_LABELS = ['', '매우 낮음', '낮음', '낮음', '보통', '보통', '보통', '높음', '높음', '매우 높음', '매우 높음'];

function RiskBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-sm transition-all"
            style={{
              background: i < score
                ? (score <= 4 ? '#22c55e' : score <= 6 ? '#f59e0b' : '#ef4444')
                : 'oklch(0.22 0.02 255)'
            }} />
        ))}
      </div>
      <span className="text-xs font-mono text-muted-foreground">{RISK_LABELS[score]}</span>
    </div>
  );
}

function StockCard({ stock }: { stock: KrStockRecommendation }) {
  const [expanded, setExpanded] = useState(false);
  const vs = VERDICT_STYLES[stock.verdict];

  return (
    <div className="quant-card overflow-hidden transition-all hover:border-border/80"
      style={{ borderColor: expanded ? vs.border : undefined }}>
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="ticker-badge">{stock.ticker}</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold"
                style={{ background: vs.bg, color: vs.text, border: `1px solid ${vs.border}` }}>
                {vs.label}
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {stock.name}
            </h3>
            <div className="text-xs text-muted-foreground mt-0.5">{stock.sector} · {stock.theme}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs text-muted-foreground font-mono mb-0.5">기대수익률</div>
            <div className="text-xl font-bold font-mono text-gain">+{stock.expectedReturn}%</div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded" style={{ background: 'oklch(0.16 0.015 255)' }}>
            <div className="text-xs text-muted-foreground font-mono mb-0.5">배당수익률</div>
            <div className="text-sm font-bold font-mono" style={{ color: stock.dividendYield >= 3 ? '#00ff88' : '#00d4ff' }}>
              {stock.dividendYield}%
            </div>
          </div>
          <div className="text-center p-2 rounded" style={{ background: 'oklch(0.16 0.015 255)' }}>
            <div className="text-xs text-muted-foreground font-mono mb-0.5">시가총액</div>
            <div className="text-sm font-bold font-mono text-foreground">{stock.marketCap}</div>
          </div>
          <div className="text-center p-2 rounded" style={{ background: 'oklch(0.16 0.015 255)' }}>
            <div className="text-xs text-muted-foreground font-mono mb-0.5">추천 매수</div>
            <div className="text-sm font-bold font-mono" style={{ color: '#00d4ff' }}>
              {getBuyFrequencyLabel(stock.suggestedFrequency)} {formatKRW(stock.suggestedAmount)}
            </div>
          </div>
        </div>

        {/* Risk Bar */}
        <div className="mb-3">
          <div className="text-xs text-muted-foreground font-mono mb-1.5">리스크 수준</div>
          <RiskBar score={stock.riskScore} />
        </div>

        {/* Expand Button */}
        <button onClick={() => setExpanded(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1 rounded hover:bg-white/5">
          {expanded ? <><ChevronUp size={13} /> 접기</> : <><ChevronDown size={13} /> 상세 분석 보기</>}
        </button>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-border/40 p-4 space-y-3" style={{ background: 'oklch(0.11 0.015 255)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gain mb-2">
                <CheckCircle size={12} /> 투자 포인트
              </div>
              <ul className="space-y-1.5">
                {stock.pros.map((p, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span style={{ color: '#00ff88' }} className="shrink-0 mt-0.5">▸</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-loss mb-2">
                <XCircle size={12} /> 리스크 요인
              </div>
              <ul className="space-y-1.5">
                {stock.cons.map((c, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-2">
                    <span style={{ color: '#ef4444' }} className="shrink-0 mt-0.5">▸</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RecommendSection() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'semiconductor' | 'finance' | 'defense'>('all');

  const filtered = KR_RECOMMENDATIONS.filter(s => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'semiconductor') return s.sector.includes('반도체');
    if (activeFilter === 'finance') return s.sector.includes('금융');
    if (activeFilter === 'defense') return s.sector.includes('방산');
    return true;
  });

  return (
    <section id="recommend" className="py-12 border-t border-border/40">
      <div className="container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #f59e0b, #ff6b35)' }} />
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              국내주식 소수점 추천
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">매일 1,000원 적립식 투자 최적 종목 비교 분석</p>
          </div>
        </div>

        {/* Insight Box */}
        <div className="p-4 rounded mb-6 text-sm"
          style={{ background: 'oklch(0.14 0.025 50 / 0.4)', border: '1px solid oklch(0.35 0.08 50 / 0.4)' }}>
          <div className="flex items-start gap-2">
            <Zap size={14} className="shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
            <div>
              <span className="font-semibold text-foreground">반도체 3종목 비교 결론: </span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">삼성전자</strong>는 안정성+배당+HBM 수혜의 균형,
                <strong className="text-foreground"> SK하이닉스</strong>는 HBM 순도 최고이나 변동성 큼,
                <strong className="text-foreground"> 반도체ETF</strong>는 섹터 전체를 분산 투자하는 방식.
                셋 중 하나만 고른다면 <strong style={{ color: '#00ff88' }}>삼성전자</strong>를 추천합니다.
                <strong className="text-foreground"> KB금융</strong>은 현재 포트폴리오에 없는 고배당 가치주 역할로 의미 있는 추가입니다.
              </span>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { key: 'all', label: '전체' },
            { key: 'semiconductor', label: '반도체' },
            { key: 'finance', label: '금융' },
            { key: 'defense', label: '방산' },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => setActiveFilter(key as any)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                activeFilter === key
                  ? 'text-background font-semibold'
                  : 'text-muted-foreground hover:text-foreground border border-border'
              }`}
              style={activeFilter === key ? { background: '#f59e0b' } : {}}>
              {label}
            </button>
          ))}
        </div>

        {/* Stock Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(stock => (
            <StockCard key={stock.id} stock={stock} />
          ))}
        </div>
      </div>
    </section>
  );
}
