// DESIGN: Dark Quant Terminal - Geopolitics & Portfolio Impact Section
// 현재 국제 정세 요약 + 보유 종목별 영향도 분석

import { useState } from 'react';
import { loadPortfolio } from '@/lib/portfolioData';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Globe, Zap } from 'lucide-react';

// 현재 주요 국제 정세 이슈
const GEOPOLITICS = [
  {
    id: 'trade-war',
    title: '미·중 관세 전쟁',
    date: '2025.04 ~',
    status: 'ongoing',
    severity: 'high',
    summary: '트럼프 2기 행정부가 중국산 제품에 최대 145% 관세 부과. 중국은 125% 보복 관세로 맞대응. 양국 협상이 단기적으로 타결되더라도 구조적 디커플링은 지속.',
    affectedTickers: ['NVDA', 'AAPL', 'TSLA', '000660', '005930'],
    impact: {
      'NVDA': { direction: 'negative', reason: '중국 수출 제한 지속, H20 칩 판매 금지로 중국 매출 타격' },
      'AAPL': { direction: 'negative', reason: '중국 생산 비중 높아 관세 직격탄, 아이폰 가격 인상 압력' },
      'TSLA': { direction: 'mixed', reason: '중국 공장 생산 리스크 vs 미국 내 EV 보조금 수혜' },
      '000660': { direction: 'positive', reason: 'HBM 수요는 미국 AI 기업 중심, 중국 의존도 낮음' },
      '005930': { direction: 'mixed', reason: '반도체 수출 일부 제한 우려 vs 메모리 공급 재편 수혜' },
    },
  },
  {
    id: 'ai-boom',
    title: 'AI 인프라 투자 붐',
    date: '2024 ~',
    status: 'ongoing',
    severity: 'opportunity',
    summary: '빅테크 4사(MS·구글·아마존·메타)의 2025년 AI 인프라 투자 합계 3,200억 달러 돌파. GPU·HBM·전력 인프라 수요 폭발적 증가. 2026년에도 투자 사이클 지속 전망.',
    affectedTickers: ['NVDA', '000660', '005930'],
    impact: {
      'NVDA': { direction: 'positive', reason: 'AI GPU 독점적 공급자, Blackwell 아키텍처 수요 폭발' },
      '000660': { direction: 'positive', reason: 'HBM3E 독점 공급, AI 서버 메모리 핵심 부품' },
      '005930': { direction: 'positive', reason: 'HBM 후발 진입 + DRAM·낸드 전반적 수요 증가' },
    },
  },
  {
    id: 'defense-boom',
    title: '유럽·아시아 방위비 급증',
    date: '2024 ~',
    status: 'ongoing',
    severity: 'opportunity',
    summary: '러·우 전쟁 장기화 및 북핵 위협으로 NATO·한국·일본 방위비 GDP 대비 2~3% 목표. 한국 방산 수출 2025년 사상 최대 170억 달러 달성. K-방산 글로벌 수주 확대.',
    affectedTickers: ['LMT', '012450'],
    impact: {
      'LMT': { direction: 'positive', reason: 'F-35, 미사일 방어 시스템 수요 증가, 미 국방 예산 확대' },
      '012450': { direction: 'positive', reason: 'K9 자주포·천무 다연장로켓 수출 급증, 폴란드·루마니아 대규모 계약' },
    },
  },
  {
    id: 'gold-rally',
    title: '금값 사상 최고치',
    date: '2025.03 ~',
    status: 'ongoing',
    severity: 'opportunity',
    summary: '달러 약세·지정학 리스크·중앙은행 매입 급증으로 금값 온스당 $3,300 돌파. 안전자산 선호 심리 강화. 연준 금리 인하 기대감도 금 강세 지지.',
    affectedTickers: ['ACE금현물'],
    impact: {
      'ACE금현물': { direction: 'positive', reason: '금 현물 직접 추적 ETF, 금값 상승 그대로 수혜' },
    },
  },
  {
    id: 'rate-cut',
    title: '연준 금리 인하 사이클',
    date: '2024.09 ~',
    status: 'ongoing',
    severity: 'mixed',
    summary: '연준이 2024년 9월 금리 인하 시작. 2026년 현재 기준금리 4.25~4.50%. 관세 인플레 재점화로 추가 인하 속도 조절 중. 채권 가격 변동성 확대.',
    affectedTickers: ['미국30년국채커버드콜'],
    impact: {
      '미국30년국채커버드콜': { direction: 'mixed', reason: '금리 인하 시 채권 가격 상승 유리, 커버드콜로 상승 제한되나 월배당 안정적' },
    },
  },
];

const SEVERITY_STYLES = {
  high: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#ef4444', label: '고위험', dot: '#ef4444' },
  medium: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', text: '#f59e0b', label: '중위험', dot: '#f59e0b' },
  opportunity: { bg: 'rgba(0,255,136,0.06)', border: 'rgba(0,255,136,0.2)', text: '#00ff88', label: '기회', dot: '#00ff88' },
  mixed: { bg: 'rgba(0,212,255,0.06)', border: 'rgba(0,212,255,0.2)', text: '#00d4ff', label: '혼조', dot: '#00d4ff' },
};

const IMPACT_STYLES = {
  positive: { icon: TrendingUp, color: '#00ff88', label: '긍정적' },
  negative: { icon: TrendingDown, color: '#ef4444', label: '부정적' },
  mixed: { icon: Minus, color: '#f59e0b', label: '혼조' },
};

export default function GeopoliticsSection() {
  const portfolio = loadPortfolio();
  const myTickers = new Set(portfolio.map(p => p.ticker));
  const [expandedId, setExpandedId] = useState<string | null>('trade-war');

  // 내 포트폴리오에 영향 있는 이슈만 우선 표시
  const sortedIssues = [...GEOPOLITICS].sort((a, b) => {
    const aHasMyStock = Object.keys(a.impact).some(t => myTickers.has(t));
    const bHasMyStock = Object.keys(b.impact).some(t => myTickers.has(t));
    return (bHasMyStock ? 1 : 0) - (aHasMyStock ? 1 : 0);
  });

  return (
    <section id="geopolitics" className="py-10 border-t border-border/40">
      <div className="container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #ef4444, #f59e0b)' }} />
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              국제 정세 & 내 포트폴리오 영향
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              현재 진행 중인 주요 이슈가 보유 종목에 미치는 영향 분석
            </p>
          </div>
        </div>

        {/* 빠른 요약 배너 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: '진행 중 이슈', value: `${GEOPOLITICS.length}건`, color: '#f59e0b', icon: Globe },
            { label: '내 종목 영향', value: `${portfolio.filter(p => GEOPOLITICS.some(g => Object.keys(g.impact).includes(p.ticker))).length}개`, color: '#ef4444', icon: AlertTriangle },
            { label: '기회 요인', value: `${GEOPOLITICS.filter(g => g.severity === 'opportunity').length}건`, color: '#00ff88', icon: TrendingUp },
            { label: '리스크 요인', value: `${GEOPOLITICS.filter(g => g.severity === 'high').length}건`, color: '#ef4444', icon: TrendingDown },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="quant-card p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-mono">{label}</div>
                <div className="text-lg font-bold font-mono" style={{ color }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* 이슈 목록 */}
        <div className="space-y-3">
          {sortedIssues.map(issue => {
            const style = SEVERITY_STYLES[issue.severity as keyof typeof SEVERITY_STYLES];
            const isExpanded = expandedId === issue.id;
            const myAffected = Object.entries(issue.impact).filter(([t]) => myTickers.has(t));
            const hasMyStock = myAffected.length > 0;

            return (
              <div key={issue.id} className="quant-card overflow-hidden transition-all"
                style={hasMyStock ? { borderColor: style.border } : {}}>
                {/* Issue Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : issue.id)}
                  className="w-full flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left">
                  {/* Severity dot */}
                  <div className="mt-1 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full pulse-dot" style={{ background: style.dot }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                        {issue.title}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                        style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}>
                        {style.label}
                      </span>
                      {hasMyStock && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{ background: 'rgba(0,212,255,0.08)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
                          내 종목 {myAffected.length}개 영향
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">{issue.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {issue.summary}
                    </p>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {isExpanded ? <ChevronUp size={15} className="text-muted-foreground" /> : <ChevronDown size={15} className="text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded: 종목별 영향 */}
                {isExpanded && (
                  <div className="border-t border-border/40 p-4" style={{ background: 'oklch(0.11 0.015 255)' }}>
                    <div className="text-xs text-muted-foreground font-mono mb-3">보유 종목별 영향 분석</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(issue.impact).map(([ticker, info]) => {
                        const impactStyle = IMPACT_STYLES[info.direction as keyof typeof IMPACT_STYLES];
                        const Icon = impactStyle.icon;
                        const isMyStock = myTickers.has(ticker);
                        return (
                          <div key={ticker}
                            className={`flex items-start gap-2.5 p-2.5 rounded transition-all ${isMyStock ? 'ring-1' : 'opacity-50'}`}
                            style={{
                              background: isMyStock ? `${impactStyle.color}08` : 'oklch(0.14 0.015 255)',
                              border: `1px solid ${isMyStock ? impactStyle.color + '25' : 'oklch(0.2 0.02 255)'}`,
                            }}>
                            <Icon size={13} style={{ color: impactStyle.color }} className="shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="ticker-badge text-[10px]">{ticker}</span>
                                <span className="text-[10px] font-mono" style={{ color: impactStyle.color }}>
                                  {impactStyle.label}
                                </span>
                                {!isMyStock && (
                                  <span className="text-[10px] text-muted-foreground font-mono">(미보유)</span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{info.reason}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 업데이트 안내 */}
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <Zap size={11} style={{ color: '#f59e0b' }} />
          <span>국제 정세 분석은 2026년 5월 기준입니다. 상황 변화 시 수동 업데이트가 필요합니다.</span>
        </div>
      </div>
    </section>
  );
}
