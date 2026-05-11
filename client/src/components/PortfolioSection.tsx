// DESIGN: Dark Quant Terminal - Portfolio Section
// Personal portfolio tracker with add/edit/delete + avg cost + buy frequency

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  PortfolioItem, loadPortfolio, savePortfolio,
  formatKRW, formatUSD, getBuyFrequencyLabel, BuyFrequency, AssetType
} from '@/lib/portfolioData';
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

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

const EMPTY_ITEM: Omit<PortfolioItem, 'id'> = {
  ticker: '',
  name: '',
  nameKr: '',
  type: 'us-stock',
  avgCost: 0,
  currency: 'USD',
  shares: 0,
  buyAmount: 1000,
  buyFrequency: 'daily',
  sector: '',
  memo: '',
};

function ItemForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<PortfolioItem, 'id'>;
  onSave: (item: Omit<PortfolioItem, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const set = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));

  const inputCls = "w-full bg-input border border-border rounded px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono";
  const labelCls = "block text-xs text-muted-foreground mb-1";

  return (
    <div className="quant-card p-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className={labelCls}>티커 심볼</label>
          <input className={inputCls} placeholder="NVDA / 005930" value={form.ticker}
            onChange={e => set('ticker', e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className={labelCls}>종목명 (영문)</label>
          <input className={inputCls} placeholder="NVIDIA" value={form.name}
            onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>종목명 (한글)</label>
          <input className={inputCls} placeholder="엔비디아" value={form.nameKr}
            onChange={e => set('nameKr', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>섹터</label>
          <input className={inputCls} placeholder="AI 반도체" value={form.sector}
            onChange={e => set('sector', e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>자산 유형</label>
          <select className={inputCls} value={form.type} onChange={e => set('type', e.target.value as AssetType)}>
            {Object.entries(ASSET_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>통화</label>
          <select className={inputCls} value={form.currency} onChange={e => set('currency', e.target.value as 'KRW' | 'USD')}>
            <option value="USD">USD (달러)</option>
            <option value="KRW">KRW (원화)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>평균 매수가</label>
          <input className={inputCls} type="number" placeholder="115.00" value={form.avgCost || ''}
            onChange={e => set('avgCost', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelCls}>보유 수량</label>
          <input className={inputCls} type="number" step="0.0001" placeholder="0.5" value={form.shares || ''}
            onChange={e => set('shares', parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelCls}>1회 매수금액 (원)</label>
          <input className={inputCls} type="number" placeholder="1000" value={form.buyAmount || ''}
            onChange={e => set('buyAmount', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className={labelCls}>매수 주기</label>
          <select className={inputCls} value={form.buyFrequency} onChange={e => set('buyFrequency', e.target.value as BuyFrequency)}>
            {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>메모 (선택)</label>
          <input className={inputCls} placeholder="투자 이유 등..." value={form.memo || ''}
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

export default function PortfolioSection() {
  const [items, setItems] = useState<PortfolioItem[]>(() => loadPortfolio());
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { savePortfolio(items); }, [items]);

  const addItem = (data: Omit<PortfolioItem, 'id'>) => {
    const newItem = { ...data, id: Date.now().toString() };
    setItems(prev => [...prev, newItem]);
    setAdding(false);
    toast.success(`${data.nameKr || data.name} 추가 완료!`);
  };

  const updateItem = (id: string, data: Omit<PortfolioItem, 'id'>) => {
    setItems(prev => prev.map(it => it.id === id ? { ...data, id } : it));
    setEditingId(null);
    toast.success('종목 정보가 업데이트되었습니다.');
  };

  const deleteItem = (id: string, name: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
    toast.success(`${name} 삭제 완료`);
  };

  // 월간 투자금 계산
  const monthlyTotal = items.reduce((sum, it) => {
    const monthly = it.buyFrequency === 'daily' ? it.buyAmount * 22
      : it.buyFrequency === 'weekly' ? it.buyAmount * 4
      : it.buyAmount;
    return sum + monthly;
  }, 0);

  // 파이 차트 데이터 (자산 유형별)
  const pieData = Object.entries(
    items.reduce((acc, it) => {
      const label = ASSET_TYPE_LABELS[it.type];
      const monthly = it.buyFrequency === 'daily' ? it.buyAmount * 22
        : it.buyFrequency === 'weekly' ? it.buyAmount * 4
        : it.buyAmount;
      acc[label] = (acc[label] || 0) + monthly;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="quant-card p-2 text-xs font-mono">
        <div className="text-foreground">{payload[0].name}</div>
        <div style={{ color: '#00d4ff' }}>월 {formatKRW(payload[0].value)}</div>
        <div className="text-muted-foreground">{((payload[0].value / monthlyTotal) * 100).toFixed(1)}%</div>
      </div>
    );
  };

  return (
    <section id="portfolio" className="py-12 border-t border-border/40">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #7c3aed, #00d4ff)' }} />
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                내 포트폴리오
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">평단가·보유수량·매수주기 직접 입력 및 관리</p>
            </div>
          </div>
          <button onClick={() => { setAdding(true); setEditingId(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-background transition-all hover:opacity-90"
            style={{ background: '#00d4ff' }}>
            <Plus size={14} /> 종목 추가
          </button>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: '월 총 투자금', value: formatKRW(monthlyTotal), color: '#00d4ff' },
            { label: '보유 종목 수', value: `${items.length}개`, color: '#00ff88' },
            { label: '미국 자산 비중', value: `${Math.round(items.filter(i => i.currency === 'USD').reduce((s, i) => s + (i.buyFrequency === 'daily' ? i.buyAmount * 22 : i.buyFrequency === 'weekly' ? i.buyAmount * 4 : i.buyAmount), 0) / monthlyTotal * 100)}%`, color: '#7c3aed' },
            { label: '국내 자산 비중', value: `${Math.round(items.filter(i => i.currency === 'KRW').reduce((s, i) => s + (i.buyFrequency === 'daily' ? i.buyAmount * 22 : i.buyFrequency === 'weekly' ? i.buyAmount * 4 : i.buyAmount), 0) / monthlyTotal * 100)}%`, color: '#ff6b35' },
          ].map(({ label, value, color }) => (
            <div key={label} className="quant-card p-3">
              <div className="text-xs text-muted-foreground font-mono mb-1">{label}</div>
              <div className="text-xl font-bold font-mono" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Add Form */}
        {adding && (
          <div className="mb-4">
            <ItemForm initial={EMPTY_ITEM} onSave={addItem} onCancel={() => setAdding(false)} />
          </div>
        )}

        {/* Portfolio Table + Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Table */}
          <div className="lg:col-span-2 space-y-2">
            {items.map((item, idx) => {
              const isEditing = editingId === item.id;
              const isExpanded = expandedId === item.id;
              const monthlyAmt = item.buyFrequency === 'daily' ? item.buyAmount * 22
                : item.buyFrequency === 'weekly' ? item.buyAmount * 4
                : item.buyAmount;
              const totalInvested = item.avgCost * item.shares;

              return (
                <div key={item.id}>
                  {isEditing ? (
                    <ItemForm
                      initial={{ ticker: item.ticker, name: item.name, nameKr: item.nameKr, type: item.type, avgCost: item.avgCost, currency: item.currency, shares: item.shares, buyAmount: item.buyAmount, buyFrequency: item.buyFrequency, sector: item.sector, memo: item.memo }}
                      onSave={(data) => updateItem(item.id, data)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="quant-card overflow-hidden">
                      {/* Main Row */}
                      <div className="flex items-center gap-3 p-3 hover:bg-white/[0.02] transition-colors">
                        <div className="w-6 text-center font-mono text-xs text-muted-foreground">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="ticker-badge">{item.ticker}</span>
                            <span className="text-sm font-medium text-foreground truncate">{item.nameKr || item.name}</span>
                            <span className="hidden sm:inline text-xs px-1.5 py-0.5 rounded text-muted-foreground"
                              style={{ background: 'oklch(0.18 0.02 255)', border: '1px solid oklch(0.25 0.02 255)' }}>
                              {item.sector}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-mono">
                            <span>평단 {item.currency === 'USD' ? formatUSD(item.avgCost) : formatKRW(item.avgCost)}</span>
                            <span>·</span>
                            <span>{item.shares}주</span>
                            <span>·</span>
                            <span style={{ color: '#00d4ff' }}>{getBuyFrequencyLabel(item.buyFrequency)} {formatKRW(item.buyAmount)}</span>
                          </div>
                        </div>
                        <div className="hidden sm:block text-right shrink-0">
                          <div className="text-sm font-mono text-foreground">
                            월 {formatKRW(monthlyAmt)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {item.currency === 'USD' ? formatUSD(totalInvested) : formatKRW(totalInvested)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-white/5">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <button onClick={() => { setEditingId(item.id); setAdding(false); }}
                            className="p-1.5 text-muted-foreground hover:text-cyan transition-colors rounded hover:bg-white/5">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteItem(item.id, item.nameKr || item.name)}
                            className="p-1.5 text-muted-foreground hover:text-loss transition-colors rounded hover:bg-white/5">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <div className="border-t border-border/40 px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono"
                          style={{ background: 'oklch(0.11 0.015 255)' }}>
                          <div>
                            <div className="text-muted-foreground mb-0.5">자산 유형</div>
                            <div className="text-foreground">{ASSET_TYPE_LABELS[item.type]}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">총 투자금액</div>
                            <div style={{ color: '#00d4ff' }}>
                              {item.currency === 'USD' ? formatUSD(totalInvested) : formatKRW(totalInvested)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">월 투자금</div>
                            <div style={{ color: '#00ff88' }}>{formatKRW(monthlyAmt)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-0.5">매수 주기</div>
                            <div className="text-foreground">{getBuyFrequencyLabel(item.buyFrequency)} {formatKRW(item.buyAmount)}</div>
                          </div>
                          {item.memo && (
                            <div className="col-span-4">
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

          {/* Pie Chart */}
          <div className="quant-card p-4">
            <div className="text-sm font-semibold mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>자산 유형별 배분</div>
            <div className="text-xs text-muted-foreground font-mono mb-4">월 투자금 기준</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.85} />
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
                  <div className="flex gap-2">
                    <span className="text-foreground">{formatKRW(d.value)}</span>
                    <span className="text-muted-foreground">{((d.value / monthlyTotal) * 100).toFixed(0)}%</span>
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
