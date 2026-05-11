// DESIGN: Dark Quant Terminal - Exit Strategy Section
// 목표가 설정, 매도 시그널 체크리스트, 적립식 투자 매도 원칙 가이드

import { useState, useEffect } from 'react';
import { loadPortfolio, PortfolioItem, formatKRW, formatUSD } from '@/lib/portfolioData';
import { Target, AlertTriangle, CheckCircle, XCircle, TrendingDown, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

// 매도 시그널 체크리스트 데이터
const SELL_SIGNALS = [
  {
    category: '목표 달성형 매도',
    color: '#00ff88',
    icon: '🎯',
    signals: [
      { id: 's1', label: '목표 수익률 달성 (예: +50%, +100%)', critical: true },
      { id: 's2', label: '목표 금액 달성 (예: 원금 2배)', critical: true },
      { id: 's3', label: '특정 생애 이벤트 자금 필요 (결혼, 집 구매 등)', critical: false },
    ],
  },
  {
    category: '리밸런싱형 매도',
    color: '#00d4ff',
    icon: '⚖️',
    signals: [
      { id: 'r1', label: '특정 종목 비중이 포트폴리오의 30% 초과', critical: false },
      { id: 'r2', label: '미국/국내 자산 비중이 목표 배분에서 20%p 이상 이탈', critical: false },
      { id: 'r3', label: '연 1회 정기 리밸런싱 시점 도래', critical: false },
    ],
  },
  {
    category: '펀더멘털 훼손형 매도',
    color: '#f59e0b',
    icon: '⚠️',
    signals: [
      { id: 'f1', label: '투자 thesis(투자 이유)가 완전히 무너진 경우', critical: true },
      { id: 'f2', label: '경쟁사에 핵심 기술 우위를 완전히 빼앗긴 경우', critical: true },
      { id: 'f3', label: '회계 부정, 경영진 비리 등 기업 신뢰 붕괴', critical: true },
      { id: 'f4', label: '3분기 연속 실적 컨센서스 대폭 하회 (20% 이상)', critical: false },
    ],
  },
  {
    category: '절대 매도하지 말아야 할 상황',
    color: '#ef4444',
    icon: '🚫',
    signals: [
      { id: 'n1', label: '단순히 주가가 많이 떨어졌을 때 (공포 매도)', critical: true },
      { id: 'n2', label: '뉴스 헤드라인만 보고 충동적으로 결정할 때', critical: true },
      { id: 'n3', label: '다른 종목이 더 많이 올랐다는 FOMO로 갈아탈 때', critical: true },
      { id: 'n4', label: '단기 수익률이 지수보다 낮다는 이유만으로', critical: false },
    ],
  },
];

// 적립식 투자 매도 전략 원칙
const EXIT_PRINCIPLES = [
  {
    title: '목표가 분할 매도 원칙',
    icon: Target,
    color: '#00ff88',
    description: '목표 수익률에 도달했을 때 한 번에 전량 매도하지 말고, 3~5회에 나눠 분할 매도하세요. 예: +50% 도달 시 30% 매도 → +80% 시 추가 30% 매도 → +100% 시 나머지 40% 매도.',
    example: '예시: NVIDIA 평단 $115 → $172(+50%) 시 1차 매도, $207(+80%) 시 2차, $230(+100%) 시 잔여 매도',
  },
  {
    title: '적립식 투자의 매도 타이밍',
    icon: TrendingDown,
    color: '#00d4ff',
    description: '매일/매월 꾸준히 사는 적립식 투자는 "언제 팔지"보다 "얼마나 오래 들고 있을지"가 더 중요합니다. 최소 3~5년 이상 보유를 전제로 하고, 단기 변동성에 흔들리지 마세요.',
    example: '원칙: 매수 주기(매일/매월)와 동일하게 매도도 분할로. 급락 시 오히려 매수 금액을 늘리는 것이 장기 수익률에 유리.',
  },
  {
    title: '손절 vs 버티기 판단 기준',
    icon: AlertTriangle,
    color: '#f59e0b',
    description: '주가 하락만으로는 손절하지 마세요. "내가 이 종목을 처음 산 이유가 아직 유효한가?"를 먼저 물어보세요. 투자 thesis가 살아있다면 하락은 더 싸게 살 기회입니다.',
    example: '체크: 삼성전자 HBM 경쟁력 유지? → 버티기. NVIDIA AI 독점 지위 흔들림? → 비중 축소 검토.',
  },
  {
    title: '세금 최적화 매도 타이밍',
    icon: Info,
    color: '#7c3aed',
    description: '국내주식은 대주주 요건(10억 이상) 해당 시 양도세 부과. 해외주식은 연간 250만원 기본공제 초과분에 22% 과세. 연말(12월) 전에 손실 종목을 매도해 수익과 상계하는 절세 전략을 활용하세요.',
    example: '절세 팁: 해외주식 수익 250만원 이하는 비과세. 수익 실현 시기를 연도별로 분산하면 세금 부담 최소화.',
  },
];

// 목표가 계산기 컴포넌트
function TargetPriceCalculator() {
  const [portfolio] = useState<PortfolioItem[]>(() => loadPortfolio());
  const [targets, setTargets] = useState<Record<string, { target50: number; target100: number; stopLoss: number }>>({});
  const [selectedId, setSelectedId] = useState<string>('');

  const selected = portfolio.find(p => p.id === selectedId);

  useEffect(() => {
    const t: typeof targets = {};
    portfolio.forEach(p => {
      t[p.id] = {
        target50: Math.round(p.avgCost * 1.5 * 100) / 100,
        target100: Math.round(p.avgCost * 2.0 * 100) / 100,
        stopLoss: Math.round(p.avgCost * 0.75 * 100) / 100,
      };
    });
    setTargets(t);
    if (portfolio.length > 0) setSelectedId(portfolio[0].id);
  }, []);

  const fmt = (v: number, cur: 'KRW' | 'USD') =>
    cur === 'USD' ? formatUSD(v) : formatKRW(v);

  return (
    <div className="quant-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Target size={16} style={{ color: '#00ff88' }} />
        <h3 className="font-semibold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          종목별 목표가 계산기
        </h3>
      </div>

      <div className="mb-4">
        <label className="block text-xs text-muted-foreground font-mono mb-1.5">종목 선택</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full bg-input border border-border rounded px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono">
          {portfolio.map(p => (
            <option key={p.id} value={p.id}>
              {p.ticker} — {p.nameKr || p.name}
            </option>
          ))}
        </select>
      </div>

      {selected && targets[selected.id] && (
        <>
          <div className="grid grid-cols-1 gap-2 mb-4">
            {/* 평단가 */}
            <div className="flex items-center justify-between p-3 rounded"
              style={{ background: 'oklch(0.16 0.015 255)', border: '1px solid oklch(0.22 0.02 255)' }}>
              <div>
                <div className="text-xs text-muted-foreground font-mono">내 평균 매수가</div>
                <div className="text-lg font-bold font-mono text-foreground mt-0.5">
                  {fmt(selected.avgCost, selected.currency)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-mono text-right">
                <div>보유 {selected.shares}주</div>
                <div>총 {fmt(selected.avgCost * selected.shares, selected.currency)}</div>
              </div>
            </div>

            {/* 목표가 +50% */}
            <div className="flex items-center justify-between p-3 rounded"
              style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div>
                <div className="text-xs font-mono" style={{ color: '#00ff88' }}>🎯 1차 목표가 (+50%)</div>
                <div className="text-xl font-bold font-mono mt-0.5" style={{ color: '#00ff88' }}>
                  {fmt(targets[selected.id].target50, selected.currency)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-mono">예상 수익</div>
                <div className="text-base font-bold font-mono text-gain">
                  +{fmt(selected.avgCost * selected.shares * 0.5, selected.currency)}
                </div>
              </div>
            </div>

            {/* 목표가 +100% */}
            <div className="flex items-center justify-between p-3 rounded"
              style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <div>
                <div className="text-xs font-mono" style={{ color: '#00d4ff' }}>🚀 2차 목표가 (+100%)</div>
                <div className="text-xl font-bold font-mono mt-0.5" style={{ color: '#00d4ff' }}>
                  {fmt(targets[selected.id].target100, selected.currency)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-mono">예상 수익</div>
                <div className="text-base font-bold font-mono text-gain">
                  +{fmt(selected.avgCost * selected.shares, selected.currency)}
                </div>
              </div>
            </div>

            {/* 손절가 -25% */}
            <div className="flex items-center justify-between p-3 rounded"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div>
                <div className="text-xs font-mono text-loss">⛔ 손절 참고가 (-25%)</div>
                <div className="text-xl font-bold font-mono mt-0.5 text-loss">
                  {fmt(targets[selected.id].stopLoss, selected.currency)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground font-mono">예상 손실</div>
                <div className="text-base font-bold font-mono text-loss">
                  -{fmt(selected.avgCost * selected.shares * 0.25, selected.currency)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded text-xs text-muted-foreground font-mono"
            style={{ background: 'oklch(0.14 0.015 255)', border: '1px solid oklch(0.2 0.02 255)' }}>
            💡 적립식 투자는 평단가가 계속 변합니다. 포트폴리오 탭에서 평단가를 업데이트하면 목표가도 자동 재계산됩니다.
          </div>
        </>
      )}
    </div>
  );
}

// 매도 시그널 체크리스트
function SellSignalChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ '목표 달성형 매도': true });

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSection = (cat: string) => setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));

  const totalChecked = Object.values(checked).filter(Boolean).length;
  const criticalChecked = SELL_SIGNALS.flatMap(s => s.signals)
    .filter(s => s.critical && checked[s.id]).length;

  return (
    <div className="quant-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} style={{ color: '#00d4ff' }} />
          <h3 className="font-semibold text-base" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            매도 시그널 체크리스트
          </h3>
        </div>
        {totalChecked > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{totalChecked}개 체크됨</span>
            {criticalChecked >= 2 && (
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                ⚠ 매도 검토 필요
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {SELL_SIGNALS.map(group => (
          <div key={group.category} className="rounded overflow-hidden"
            style={{ border: `1px solid ${group.color}22` }}>
            <button
              onClick={() => toggleSection(group.category)}
              className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
              style={{ background: `${group.color}08` }}>
              <div className="flex items-center gap-2">
                <span>{group.icon}</span>
                <span className="text-sm font-semibold" style={{ color: group.color, fontFamily: 'Space Grotesk' }}>
                  {group.category}
                </span>
              </div>
              {expanded[group.category] ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>

            {expanded[group.category] && (
              <div className="p-3 space-y-2">
                {group.signals.map(signal => (
                  <label key={signal.id}
                    className="flex items-start gap-2.5 cursor-pointer group">
                    <div className={`w-4 h-4 rounded shrink-0 mt-0.5 border flex items-center justify-center transition-all ${
                      checked[signal.id]
                        ? 'border-transparent'
                        : 'border-border group-hover:border-muted-foreground'
                    }`}
                      style={checked[signal.id] ? { background: group.color } : {}}
                      onClick={() => toggle(signal.id)}>
                      {checked[signal.id] && <CheckCircle size={10} className="text-background" />}
                    </div>
                    <span className={`text-xs transition-colors ${
                      checked[signal.id] ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {signal.label}
                      {signal.critical && (
                        <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded font-mono"
                          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                          핵심
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {totalChecked > 0 && (
        <div className="mt-4 p-3 rounded text-xs font-mono"
          style={{
            background: criticalChecked >= 2 ? 'rgba(239,68,68,0.08)' : 'rgba(0,212,255,0.06)',
            border: `1px solid ${criticalChecked >= 2 ? 'rgba(239,68,68,0.25)' : 'rgba(0,212,255,0.2)'}`,
            color: criticalChecked >= 2 ? '#ef4444' : '#00d4ff'
          }}>
          {criticalChecked >= 2
            ? `⚠ 핵심 시그널 ${criticalChecked}개 해당 — 해당 종목 매도 또는 비중 축소를 진지하게 검토하세요.`
            : `✓ 현재 ${totalChecked}개 시그널 체크. 핵심 시그널 2개 이상 해당 시 매도를 검토하세요.`}
        </div>
      )}
    </div>
  );
}

export default function ExitStrategySection() {
  const [expandedPrinciple, setExpandedPrinciple] = useState<number | null>(0);

  return (
    <section id="exit" className="py-12 border-t border-border/40">
      <div className="container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #ef4444, #f59e0b)' }} />
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              매도 전략
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">언제, 어떻게 팔아야 할까? — 적립식 투자자를 위한 매도 원칙</p>
          </div>
        </div>

        {/* Key Message Banner */}
        <div className="p-4 rounded mb-8"
          style={{ background: 'oklch(0.14 0.025 50 / 0.5)', border: '1px solid oklch(0.35 0.08 50 / 0.4)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: '#f59e0b' }} />
            <div className="text-sm">
              <div className="font-semibold text-foreground mb-1">적립식 투자에서 가장 비싼 실수는 "너무 일찍 파는 것"입니다</div>
              <div className="text-muted-foreground">
                매일 1,000원씩 모으는 전략의 핵심은 <strong className="text-foreground">시간</strong>입니다. 
                단기 변동성에 반응해 팔면 복리 효과가 사라집니다. 
                아래 원칙과 체크리스트를 활용해 감정이 아닌 <strong className="text-foreground">기준</strong>으로 매도 결정을 내리세요.
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <TargetPriceCalculator />
          <SellSignalChecklist />
        </div>

        {/* Exit Principles */}
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            매도 4대 원칙
          </h3>
          <div className="space-y-3">
            {EXIT_PRINCIPLES.map((p, i) => {
              const Icon = p.icon;
              const isOpen = expandedPrinciple === i;
              return (
                <div key={i} className="quant-card overflow-hidden">
                  <button
                    onClick={() => setExpandedPrinciple(isOpen ? null : i)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors text-left">
                    <div className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                      style={{ background: `${p.color}15`, border: `1px solid ${p.color}30` }}>
                      <Icon size={15} style={{ color: p.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
                        {p.title}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={15} className="text-muted-foreground shrink-0" /> : <ChevronDown size={15} className="text-muted-foreground shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-2" style={{ borderTop: `1px solid ${p.color}15` }}>
                      <p className="text-sm text-muted-foreground leading-relaxed pt-3">{p.description}</p>
                      <div className="p-3 rounded text-xs font-mono text-muted-foreground"
                        style={{ background: `${p.color}08`, border: `1px solid ${p.color}20`, color: p.color }}>
                        {p.example}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
