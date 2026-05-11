// DESIGN: Dark Quant Terminal - Portfolio Section
// DB 기반 포트폴리오 + 실시간 현재가·수익률·환율·AI진단·섹터경고 통합

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { trpc } from '@/lib/trpc';
import { formatKRW, formatUSD, getBuyFrequencyLabel, BuyFrequency, AssetType } from '@/lib/portfolioData';
import {
  Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp,
  Zap, BookOpen, TrendingUp, TrendingDown, Brain, AlertTriangle,
  RefreshCw, DollarSign, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import AutoAccumulateModal from './AutoAccumulateModal';
import BuyRecordModal from './BuyRecordModal';
import { useMarketPrices } from '@/hooks/useMarketPrices';
import { Streamdown } from 'streamdown';

const PIE_COLORS = ['#00d4ff', '#7c3aed', '#ff6b35', '#f59e0b', '#00ff88', '#ef4444', '#1e90ff', '#9370db', '#20b2aa'];

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  'us-stock': '미국 개별주',
  'kr-stock': '국내 개별주',
  'etf': 'ETF',
  'commodity': '원자재/채권',
};

const FREQ_OPTIONS: { value: BuyFrequency; label: string }[] = [
  { value: 'daily', label: '매일' },
  { value: 'weekly', label: '매주' },
  { value: 'monthly', label: '매월' },
];

type ItemFormData = {
  ticker: string; name: string; nameKr: string; type: AssetType;
  currency: 'KRW' | 'USD'; avgCost: number; shares: number;
  buyAmount: number; buyFrequency: BuyFrequency; sector: string; memo: string;
};

const EMPTY_FORM: ItemFormData = {
  ticker: '', name: '', nameKr: '', type: 'us-stock', currency: 'USD',
  avgCost: 0, shares: 0, buyAmount: 1000, buyFrequency: 'daily', sector: '', memo: '',
};

function ItemForm({ initial, onSave, onCancel }: {
  initial: ItemFormData;
  onSave: (data: ItemFormData) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof ItemFormData, v: any) => setForm(f => ({ ...f, [k]: v }));
  const inputCls = "w-full bg-input border border-border rounded px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono";
  const labelCls = "block text-xs text-muted-foreground mb-1";

  return (
    <div className="quant-card p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>티커 *</label>
          <input className={inputCls} placeholder="NVDA / 005930" value={form.ticker}
            onChange={e => set('ticker', e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className={labelCls}>종목명 *</label>
          <input className={inputCls} placeholder="NVIDIA" value={form.name}
            onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>한글명</label>
          <input className={inputCls} placeholder="엔비디아" value={form.nameKr}
            onChange={e => set('nameKr', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>자산 유형</label>
          <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value as AssetType)}>
            {Object.entries(ASSET_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>통화</label>
          <select className={inputCls} value={form.currency} onChange={e => set('currency', e.target.value as 'KRW' | 'USD')}>
            <option value="USD">USD (달러)</option>
            <option value="KRW">KRW (원)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>평단가</label>
          <input type="number" className={inputCls} value={form.avgCost}
            onChange={e => set('avgCost', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelCls}>보유수량 (주)</label>
          <input type="number" className={inputCls} value={form.shares}
            onChange={e => set('shares', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelCls}>섹터</label>
          <input className={inputCls} placeholder="반도체" value={form.sector}
            onChange={e => set('sector', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>1회 매수금액 (원)</label>
          <input type="number" className={inputCls} value={form.buyAmount}
            onChange={e => set('buyAmount', parseInt(e.target.value) || 1000)} />
        </div>
        <div>
          <label className={labelCls}>매수 주기</label>
          <select className={inputCls} value={form.buyFrequency} onChange={e => set('buyFrequency', e.target.value as BuyFrequency)}>
            {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>메모 (선택)</label>
          <input className={inputCls} placeholder="투자 이유 등..." value={form.memo}
            onChange={e => set('memo', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground border border-border hover:border-border/80 transition-colors">
          <X size={13} /> 취소
        </button>
        <button onClick={() => {
          if (!form.ticker || !form.name) { toast.error('티커와 종목명은 필수입니다.'); return; }
          onSave(form);
        }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-background transition-colors"
          style={{ background: '#00d4ff' }}>
          <Check size={13} /> 저장
        </button>
      </div>
    </div>
  );
}

function toModalItem(item: any) {
  return {
    id: String(item.id),
    ticker: item.ticker,
    name: item.name,
    nameKr: item.nameKr || '',
    type: item.type,
    currency: item.currency,
    avgCost: item.avgCost,
    shares: item.shares,
    buyAmount: item.buyAmount,
    buyFrequency: item.buyFrequency,
    sector: item.sector || '',
    memo: item.memo || '',
  };
}

// 섹터 집중도 분석
function SectorWarning({ items }: { items: any[] }) {
  const sectorMap = items.reduce((acc, item) => {
    const s = item.sector || '기타';
    acc[s] = (acc[s] || 0) + (item.valueKRW ?? item.avgCost * item.shares);
    return acc;
  }, {} as Record<string, number>);

  const total: number = (Object.values(sectorMap) as number[]).reduce((a, b) => a + b, 0);
  const warnings = Object.entries(sectorMap)
    .map(([sector, val]) => ({ sector, pct: total > 0 ? ((val as number) / total) * 100 : 0 }))
    .filter(s => s.pct > 40)
    .sort((a, b) => b.pct - a.pct);

  if (warnings.length === 0) return null;

  return (
    <div className="quant-card p-3 border-l-2 mb-4" style={{ borderLeftColor: '#f59e0b' }}>
      <div className="flex items-center gap-2 text-sm font-medium mb-1" style={{ color: '#f59e0b' }}>
        <AlertTriangle size={14} />
        섹터 집중도 경고
      </div>
      <div className="text-xs text-muted-foreground font-mono">
        {warnings.map(w => (
          <span key={w.sector} className="mr-3">
            <span style={{ color: '#f59e0b' }}>{w.sector}</span> {w.pct.toFixed(1)}% 집중
          </span>
        ))}
        — 분산 투자를 고려해 보세요.
      </div>
    </div>
  );
}

// 배당금 추적 (간단 버전 — 섹터별 예상 배당수익률 기반)
const DIVIDEND_YIELD: Record<string, number> = {
  'KB금융': 0.058, '삼성전자': 0.025, '한화에어로스페이스': 0.005,
  'NVDA': 0.001, 'TSLA': 0, 'LLY': 0.007, 'LMT': 0.027, 'AAPL': 0.005,
};

function DividendTracker({ items }: { items: any[] }) {
  const dividendItems = items.filter(item => {
    const yield_ = DIVIDEND_YIELD[item.ticker] ?? DIVIDEND_YIELD[item.name] ?? 0;
    return yield_ > 0 && item.valueKRW && item.valueKRW > 0;
  });

  if (dividendItems.length === 0) return null;

  const totalAnnual = dividendItems.reduce((sum, item) => {
    const yield_ = DIVIDEND_YIELD[item.ticker] ?? DIVIDEND_YIELD[item.name] ?? 0;
    return sum + (item.valueKRW ?? 0) * yield_;
  }, 0);

  return (
    <div className="quant-card p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <DollarSign size={14} style={{ color: '#00ff88' }} />
        <span className="text-sm font-medium">예상 배당금 추적</span>
        <span className="text-xs text-muted-foreground font-mono">(배당수익률 기준 추정치)</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {dividendItems.map(item => {
          const yield_ = DIVIDEND_YIELD[item.ticker] ?? DIVIDEND_YIELD[item.name] ?? 0;
          const annual = (item.valueKRW ?? 0) * yield_;
          return (
            <div key={item.id} className="text-xs font-mono">
              <div className="text-muted-foreground">{item.ticker}</div>
              <div style={{ color: '#00ff88' }}>연 {formatKRW(Math.round(annual))}</div>
              <div className="text-muted-foreground">{(yield_ * 100).toFixed(1)}% 수익률</div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-border/40 pt-2 flex justify-between text-xs font-mono">
        <span className="text-muted-foreground">연간 예상 배당 합계</span>
        <span style={{ color: '#00ff88' }} className="font-semibold">{formatKRW(Math.round(totalAnnual))}</span>
      </div>
    </div>
  );
}

// AI 진단 패널
function AIDiagnosis({ items, totalValueKRW }: { items: any[]; totalValueKRW: number }) {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const diagnose = trpc.ai.diagnose.useMutation({
    onSuccess: (data) => setAnalysis(typeof data.analysis === 'string' ? data.analysis : ''),
    onError: (e) => toast.error('AI 분석 실패: ' + e.message),
  });

  const handleDiagnose = () => {
    setOpen(true);
    setAnalysis('');
    diagnose.mutate({
      portfolio: items.map(item => ({
        ticker: item.ticker,
        name: item.nameKr || item.name,
        sector: item.sector || '기타',
        currency: item.currency,
        avgCost: item.avgCost,
        shares: item.shares,
        currentPrice: item.currentPrice,
        gainPercent: item.gainPercent,
        valueKRW: item.valueKRW,
        weight: item.weight,
      })),
      totalValueKRW,
    });
  };

  return (
    <>
      <button onClick={handleDiagnose}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium border border-violet-500/50 text-violet-300 hover:bg-violet-500/10 transition-colors">
        <Brain size={14} />
        AI 포트폴리오 진단
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="quant-card w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Brain size={18} style={{ color: '#7c3aed' }} />
                <span className="font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>AI 포트폴리오 진단</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            {diagnose.isPending ? (
              <div className="flex items-center gap-3 py-8 justify-center text-muted-foreground font-mono text-sm">
                <RefreshCw size={16} className="animate-spin" />
                AI가 포트폴리오를 분석 중입니다...
              </div>
            ) : analysis ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <Streamdown>{analysis}</Streamdown>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

// 자산 성장 그래프
function GrowthChart({ userId }: { userId: number }) {
  const [days, setDays] = useState(90);
  const { data: snapshots = [] } = trpc.snapshot.list.useQuery({ days });

  if (snapshots.length < 2) return null;

  const chartData = snapshots.map((s: any) => ({
    date: s.date.slice(5), // MM-DD
    value: Math.round(s.totalKRW / 10000),
    invested: Math.round(s.totalInvestedKRW / 10000),
  }));

  return (
    <div className="quant-card p-4 mt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} style={{ color: '#00d4ff' }} />
          <span className="text-sm font-medium">자산 성장 추이</span>
        </div>
        <div className="flex gap-1">
          {[30, 90, 180].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className="px-2 py-0.5 rounded text-xs font-mono transition-colors"
              style={days === d
                ? { background: '#00d4ff', color: '#000' }
                : { color: 'var(--muted-foreground)', border: '1px solid var(--border)' }}>
              {d}일
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="investedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'monospace' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)', fontFamily: 'monospace' }}
            tickFormatter={v => `${v}만`} />
          <Tooltip
            contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}
            formatter={(v: any, name: string) => [`${v}만원`, name === 'value' ? '평가금액' : '투자금액']}
          />
          <Area type="monotone" dataKey="invested" stroke="#7c3aed" strokeWidth={1.5} fill="url(#investedGrad)" />
          <Area type="monotone" dataKey="value" stroke="#00d4ff" strokeWidth={2} fill="url(#valueGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PortfolioSection() {
  const utils = trpc.useUtils();
  const { data: rawItems = [], isLoading } = trpc.portfolio.list.useQuery();
  const { data: authUser } = trpc.auth.me.useQuery();

  const createMutation = trpc.portfolio.create.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success('종목이 추가되었습니다!'); setAdding(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.portfolio.update.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success('종목 정보가 업데이트되었습니다.'); setEditingId(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.portfolio.delete.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success('삭제 완료'); },
    onError: (e) => toast.error(e.message),
  });
  const saveSnapshotMutation = trpc.snapshot.save.useMutation();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [autoAccumulateItem, setAutoAccumulateItem] = useState<any | null>(null);
  const [buyRecordItem, setBuyRecordItem] = useState<any | null>(null);

  // 실시간 현재가·수익률·환율 훅
  const { enriched: items, exchangeRate, totalValueKRW, totalInvestedKRW, totalGainPercent, isLoading: pricesLoading } = useMarketPrices(rawItems as any);

  // 스냅샷 자동 저장 (대시보드 열 때마다 오늘 1회)
  useEffect(() => {
    if (items.length > 0 && totalValueKRW > 0) {
      const today = new Date().toISOString().slice(0, 10);
      const lastSnap = localStorage.getItem('lastSnapshotDate');
      if (lastSnap !== today) {
        saveSnapshotMutation.mutate({
          totalKRW: totalValueKRW,
          totalInvestedKRW,
          items: items.map(i => ({
            ticker: i.ticker,
            valueKRW: i.valueKRW ?? 0,
            gainPercent: i.gainPercent ?? 0,
          })),
        });
        localStorage.setItem('lastSnapshotDate', today);
      }
    }
  }, [totalValueKRW]);

  const handleRecalc = (itemId: string, avgCost: number, shares: number) => {
    const numId = parseInt(itemId);
    if (avgCost > 0 && shares > 0) {
      updateMutation.mutate({ id: numId, data: { avgCost, shares } });
    }
  };

  const monthlyTotal = rawItems.reduce((sum, it) => {
    const monthly = it.buyFrequency === 'daily' ? it.buyAmount * 22
      : it.buyFrequency === 'weekly' ? it.buyAmount * 4
      : it.buyAmount;
    return sum + monthly;
  }, 0);

  // 파이차트 — 평가금액 기준
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(it => {
      const label = ASSET_TYPE_LABELS[it.type as AssetType] ?? it.type;
      map[label] = (map[label] || 0) + (it.valueKRW ?? 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="quant-card p-2 text-xs font-mono">
        <div className="text-foreground">{payload[0].name}</div>
        <div style={{ color: '#00d4ff' }}>{formatKRW(Math.round(payload[0].value))}</div>
        <div className="text-muted-foreground">{((payload[0].value / totalValueKRW) * 100).toFixed(1)}%</div>
      </div>
    );
  };

  return (
    <section id="portfolio" className="py-12 border-t border-border/40">
      <div className="container">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #00d4ff, #7c3aed)' }} />
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>내 포트폴리오</h2>
              <p className="text-sm text-muted-foreground mt-0.5 font-mono">
                {isLoading ? '불러오는 중...' : `${rawItems.length}개 종목 · 월 ${formatKRW(monthlyTotal)} · USD/KRW ${exchangeRate.toFixed(0)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {items.length > 0 && authUser && (
              <AIDiagnosis items={items} totalValueKRW={totalValueKRW} />
            )}
            <button onClick={() => { setAdding(true); setEditingId(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-background transition-colors hover:opacity-90"
              style={{ background: '#00d4ff' }}>
              <Plus size={14} /> 종목 추가
            </button>
          </div>
        </div>

        {/* 총 평가금액 요약 */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="quant-card p-3">
              <div className="text-xs text-muted-foreground font-mono mb-1">총 평가금액</div>
              <div className="text-lg font-bold font-mono" style={{ color: '#00d4ff' }}>
                {formatKRW(Math.round(totalValueKRW))}
              </div>
            </div>
            <div className="quant-card p-3">
              <div className="text-xs text-muted-foreground font-mono mb-1">총 투자금액</div>
              <div className="text-lg font-bold font-mono text-foreground">
                {formatKRW(Math.round(totalInvestedKRW))}
              </div>
            </div>
            <div className="quant-card p-3">
              <div className="text-xs text-muted-foreground font-mono mb-1">총 수익률</div>
              <div className={`text-lg font-bold font-mono flex items-center gap-1 ${totalGainPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalGainPercent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {totalGainPercent >= 0 ? '+' : ''}{totalGainPercent.toFixed(2)}%
              </div>
            </div>
            <div className="quant-card p-3">
              <div className="text-xs text-muted-foreground font-mono mb-1">평가손익</div>
              <div className={`text-lg font-bold font-mono ${(totalValueKRW - totalInvestedKRW) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {(totalValueKRW - totalInvestedKRW) >= 0 ? '+' : ''}
                {formatKRW(Math.round(totalValueKRW - totalInvestedKRW))}
              </div>
            </div>
          </div>
        )}

        {/* 섹터 집중도 경고 */}
        {items.length > 0 && <SectorWarning items={items} />}

        {/* 추가 폼 */}
        {adding && (
          <div className="mb-4">
            <ItemForm initial={EMPTY_FORM} onSave={(data) => createMutation.mutate(data)} onCancel={() => setAdding(false)} />
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground font-mono text-sm">
            포트폴리오 불러오는 중...
          </div>
        )}

        {!isLoading && rawItems.length === 0 && !adding && (
          <div className="text-center py-12 quant-card">
            <div className="text-muted-foreground font-mono text-sm mb-3">아직 등록된 종목이 없습니다</div>
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium text-background mx-auto"
              style={{ background: '#00d4ff' }}>
              <Plus size={14} /> 첫 종목 추가하기
            </button>
          </div>
        )}

        {/* 종목 목록 + 파이차트 */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-2">
              {items.map((item, idx) => {
                const isEditing = editingId === item.id;
                const isExpanded = expandedId === item.id;
                const monthlyAmt = item.buyFrequency === 'daily' ? item.buyAmount * 22
                  : item.buyFrequency === 'weekly' ? item.buyAmount * 4
                  : item.buyAmount;
                const hasPrice = item.currentPrice !== undefined;
                const gainColor = (item.gainPercent ?? 0) >= 0 ? '#00ff88' : '#ef4444';

                return (
                  <div key={item.id}>
                    {isEditing ? (
                      <ItemForm
                        initial={{
                          ticker: item.ticker, name: item.name, nameKr: item.nameKr || '',
                          type: item.type as AssetType, currency: item.currency as 'KRW' | 'USD',
                          avgCost: item.avgCost, shares: item.shares, buyAmount: item.buyAmount,
                          buyFrequency: item.buyFrequency as BuyFrequency,
                          sector: item.sector || '', memo: item.memo || '',
                        }}
                        onSave={(data) => updateMutation.mutate({ id: item.id, data })}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="quant-card overflow-hidden">
                        <div className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors">
                          <div className="w-6 text-center font-mono text-xs text-muted-foreground">{idx + 1}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="ticker-badge">{item.ticker}</span>
                              <span className="text-sm font-medium text-foreground truncate">{item.nameKr || item.name}</span>
                              {item.sector && (
                                <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded text-muted-foreground"
                                  style={{ background: 'oklch(0.18 0.02 255)', border: '1px solid oklch(0.25 0.02 255)' }}>
                                  {item.sector}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono flex-wrap">
                              <span>평단 {item.currency === 'USD' ? formatUSD(item.avgCost) : formatKRW(item.avgCost)}</span>
                              {hasPrice && (
                                <>
                                  <span>·</span>
                                  <span>현재 {item.currency === 'USD' ? formatUSD(item.currentPrice!) : formatKRW(item.currentPrice!)}</span>
                                  <span>·</span>
                                  <span style={{ color: gainColor }} className="font-semibold">
                                    {(item.gainPercent ?? 0) >= 0 ? '+' : ''}{(item.gainPercent ?? 0).toFixed(2)}%
                                  </span>
                                </>
                              )}
                              {pricesLoading && !hasPrice && (
                                <span className="text-muted-foreground/50">시세 조회 중...</span>
                              )}
                            </div>
                          </div>
                          {/* 오른쪽 — 평가금액 */}
                          <div className="hidden sm:block text-right shrink-0">
                            <div className="text-sm font-mono" style={{ color: '#00d4ff' }}>
                              {formatKRW(Math.round(item.valueKRW ?? 0))}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              비중 {(item.weight ?? 0).toFixed(1)}%
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-white/5">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button onClick={() => setAutoAccumulateItem(toModalItem(item))}
                              title="자동 적립 반영"
                              className="p-1.5 text-muted-foreground hover:text-green-400 transition-colors rounded hover:bg-white/5">
                              <Zap size={14} />
                            </button>
                            <button onClick={() => setBuyRecordItem(toModalItem(item))}
                              title="매수 기록 보기"
                              className="p-1.5 text-muted-foreground hover:text-cyan-400 transition-colors rounded hover:bg-white/5">
                              <BookOpen size={14} />
                            </button>
                            <button onClick={() => { setEditingId(item.id); setAdding(false); }}
                              className="p-1.5 text-muted-foreground hover:text-cyan transition-colors rounded hover:bg-white/5">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => deleteMutation.mutate({ id: item.id })}
                              className="p-1.5 text-muted-foreground hover:text-loss transition-colors rounded hover:bg-white/5">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-border/40 px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono"
                            style={{ background: 'oklch(0.11 0.015 255)' }}>
                            <div>
                              <div className="text-muted-foreground mb-0.5">평가금액 (원화)</div>
                              <div style={{ color: '#00d4ff' }} className="font-semibold">
                                {formatKRW(Math.round(item.valueKRW ?? 0))}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-0.5">평가손익</div>
                              <div style={{ color: gainColor }} className="font-semibold">
                                {(item.gainPercent ?? 0) >= 0 ? '+' : ''}
                                {item.currency === 'USD'
                                  ? formatUSD(item.gainAmount ?? 0)
                                  : formatKRW(Math.round(item.gainAmount ?? 0))}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-0.5">월 투자금</div>
                              <div style={{ color: '#00d4ff' }} className="font-semibold">{formatKRW(monthlyAmt)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-0.5">포트폴리오 비중</div>
                              <div className="text-foreground font-semibold">{(item.weight ?? 0).toFixed(2)}%</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-0.5">보유수량</div>
                              <div className="text-foreground">{Number(item.shares).toFixed(4)}주</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-0.5">자산 유형</div>
                              <div className="text-foreground">{ASSET_TYPE_LABELS[item.type as AssetType]}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground mb-0.5">통화</div>
                              <div className="text-foreground">{item.currency} {item.currency === 'USD' && `(×${exchangeRate.toFixed(0)})`}</div>
                            </div>
                            {item.memo && (
                              <div className="col-span-2 md:col-span-4">
                                <div className="text-muted-foreground mb-0.5">메모</div>
                                <div className="text-foreground">{item.memo}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 파이차트 + 요약 */}
            <div className="space-y-4">
              <div className="quant-card p-4">
                <div className="text-xs text-muted-foreground font-mono mb-3">평가금액 비중</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                      dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {totalValueKRW > 0 ? ((d.value / totalValueKRW) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 자산 성장 그래프 */}
        {authUser && <GrowthChart userId={authUser.id} />}

        {/* 배당금 추적 */}
        {items.length > 0 && <DividendTracker items={items} />}
      </div>

      {/* 자동 적립 모달 */}
      {autoAccumulateItem && (
        <AutoAccumulateModal
          item={autoAccumulateItem}
          onClose={() => setAutoAccumulateItem(null)}
          onRecalc={handleRecalc}
        />
      )}

      {/* 매수 기록 모달 */}
      {buyRecordItem && (
        <BuyRecordModal
          item={buyRecordItem}
          onClose={() => setBuyRecordItem(null)}
          onRecalc={handleRecalc}
        />
      )}
    </section>
  );
}
