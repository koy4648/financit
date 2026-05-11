// DESIGN: Dark Quant Terminal - Market Analysis Section
// 5-year index comparison + sector performance + global events timeline

import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { ANNUAL_RETURNS, SECTOR_PERFORMANCE, GLOBAL_EVENTS } from '@/lib/portfolioData';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const COLORS = {
  sp500: '#00d4ff',
  nasdaq: '#7c3aed',
  kospi: '#ff6b35',
  kosdaq: '#f59e0b',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="quant-card p-3 text-xs font-mono min-w-[160px]">
      <div className="text-muted-foreground mb-2">{label}년</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className={p.value >= 0 ? 'text-gain' : 'text-loss'}>
            {p.value >= 0 ? '+' : ''}{p.value}%
          </span>
        </div>
      ))}
    </div>
  );
};

const SectorTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="quant-card p-3 text-xs font-mono">
      <div className="text-muted-foreground mb-2">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className={p.value >= 0 ? 'text-gain' : 'text-loss'}>
            {p.value >= 0 ? '+' : ''}{p.value}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default function MarketAnalysis() {
  const [activeChart, setActiveChart] = useState<'annual' | 'sector'>('annual');

  return (
    <section id="market" className="py-12">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #00d4ff, #00ff88)' }} />
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              시장 분석 <span className="text-muted-foreground font-normal text-lg">2021 – 2026</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">최근 5년 주요 지수 성과 및 한국 섹터별 흐름</p>
          </div>
        </div>

        {/* Chart Toggle */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'annual', label: '연간 수익률 비교' },
            { key: 'sector', label: '한국 섹터 성과' },
          ].map(({ key, label }) => (
            <button key={key}
              onClick={() => setActiveChart(key as any)}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
                activeChart === key
                  ? 'text-background font-semibold'
                  : 'text-muted-foreground hover:text-foreground border border-border hover:border-border/80'
              }`}
              style={activeChart === key ? { background: '#00d4ff' } : {}}>
              {label}
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="quant-card p-5 mb-6">
          {activeChart === 'annual' ? (
            <>
              <div className="text-sm text-muted-foreground mb-4 font-mono">주요 지수 연간 수익률 (%)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={ANNUAL_RETURNS} barGap={2} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 255)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'JetBrains Mono' }} />
                  <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
                  <Bar dataKey="sp500" name="S&P 500" fill={COLORS.sp500} radius={[3, 3, 0, 0]} opacity={0.85} />
                  <Bar dataKey="nasdaq" name="NASDAQ" fill={COLORS.nasdaq} radius={[3, 3, 0, 0]} opacity={0.85} />
                  <Bar dataKey="kospi" name="KOSPI" fill={COLORS.kospi} radius={[3, 3, 0, 0]} opacity={0.85} />
                  <Bar dataKey="kosdaq" name="KOSDAQ" fill={COLORS.kosdaq} radius={[3, 3, 0, 0]} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 rounded text-xs text-muted-foreground font-mono"
                style={{ background: 'oklch(0.16 0.015 255)', border: '1px solid oklch(0.22 0.02 255)' }}>
                💡 2025년 KOSPI +75.6% — 글로벌 주요 지수 중 최고 수익률 달성. AI 반도체(HBM) 수요 폭발 + 밸류업 프로그램 효과.
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4 font-mono">한국 섹터별 수익률 (%)</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={SECTOR_PERFORMANCE} barGap={2} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.02 255)" vertical={false} />
                  <XAxis dataKey="sector" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'Noto Sans KR' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<SectorTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Noto Sans KR' }} />
                  <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
                  <Bar dataKey="return2025" name="2025년" radius={[3, 3, 0, 0]} opacity={0.85}>
                    {SECTOR_PERFORMANCE.map((entry, i) => (
                      <Cell key={i} fill={entry.return2025 >= 0 ? '#00d4ff' : '#ef4444'} />
                    ))}
                  </Bar>
                  <Bar dataKey="return2026ytd" name="2026 YTD" radius={[3, 3, 0, 0]} opacity={0.85}>
                    {SECTOR_PERFORMANCE.map((entry, i) => (
                      <Cell key={i} fill={entry.return2026ytd >= 0 ? '#00ff88' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 rounded text-xs text-muted-foreground font-mono"
                style={{ background: 'oklch(0.16 0.015 255)', border: '1px solid oklch(0.22 0.02 255)' }}>
                💡 방산(+220%)·반도체(+180%) 2025년 압도적 성과. 2026년에도 지정학적 리스크 지속으로 두 섹터 강세 유지 중.
              </div>
            </>
          )}
        </div>

        {/* Global Events Timeline */}
        <div>
          <h3 className="text-base font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            글로벌 주요 이벤트 타임라인
          </h3>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[88px] top-0 bottom-0 w-px"
              style={{ background: 'linear-gradient(to bottom, #00d4ff44, #00ff8844, transparent)' }} />
            <div className="space-y-4">
              {GLOBAL_EVENTS.map((ev, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-[80px] shrink-0 text-right">
                    <span className="font-mono text-xs text-muted-foreground">{ev.date}</span>
                  </div>
                  {/* Dot */}
                  <div className="relative z-10 mt-1.5 shrink-0">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      ev.impact === 'positive' ? 'border-green-500 bg-green-500/30' :
                      ev.impact === 'negative' ? 'border-red-500 bg-red-500/30' :
                      'border-amber-500 bg-amber-500/30'
                    }`} />
                  </div>
                  <div className="quant-card flex-1 p-3 hover:border-border/80 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{ev.title}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                        ev.impact === 'positive' ? 'bg-green-500/10 text-green-400' :
                        ev.impact === 'negative' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {ev.impact === 'positive' ? '긍정' : ev.impact === 'negative' ? '부정' : '혼조'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{ev.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
