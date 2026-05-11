// DESIGN: Dark Quant Terminal - Buy Record Modal
// 날짜별 매수가·금액 입력 → 평단가·보유수량 자동 재계산
// 매수 히스토리 목록 + 삭제 기능

import { useState, useEffect } from 'react';
import {
  BuyRecord, PortfolioItem,
  loadBuyRecords, saveBuyRecords, recalcFromRecords,
  formatKRW, formatUSD,
} from '@/lib/portfolioData';
import { X, Plus, Trash2, TrendingUp, Calendar, DollarSign, Hash } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  item: PortfolioItem;
  onClose: () => void;
  onRecalc: (itemId: string, avgCost: number, shares: number) => void;
}

const DEFAULT_EXCHANGE_RATE = 1380;

export default function BuyRecordModal({ item, onClose, onRecalc }: Props) {
  const [records, setRecords] = useState<BuyRecord[]>(() =>
    loadBuyRecords().filter(r => r.portfolioItemId === item.id)
  );

  // 새 매수 입력 폼
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today,
    price: '',          // 매수가 (USD or KRW)
    amount: String(item.buyAmount),  // 매수금액(원), 기본값은 설정된 1회 매수금액
    exchangeRate: String(DEFAULT_EXCHANGE_RATE),
    memo: '',
  });

  // 계산된 수량 미리보기
  const previewShares = (() => {
    const price = parseFloat(form.price);
    const amount = parseFloat(form.amount);
    const rate = parseFloat(form.exchangeRate) || DEFAULT_EXCHANGE_RATE;
    if (!price || !amount) return null;
    if (item.currency === 'KRW') return amount / price;
    return amount / (price * rate);
  })();

  // 전체 매수 기록 (이 종목)
  const allRecords = loadBuyRecords();

  const handleAdd = () => {
    const price = parseFloat(form.price);
    const amount = parseFloat(form.amount);
    const rate = parseFloat(form.exchangeRate) || DEFAULT_EXCHANGE_RATE;

    if (!form.date) { toast.error('날짜를 입력해주세요.'); return; }
    if (!price || price <= 0) { toast.error('매수가를 입력해주세요.'); return; }
    if (!amount || amount <= 0) { toast.error('매수금액을 입력해주세요.'); return; }

    const shares = item.currency === 'KRW'
      ? amount / price
      : amount / (price * rate);

    const newRecord: BuyRecord = {
      id: Date.now().toString(),
      portfolioItemId: item.id,
      date: form.date,
      price,
      amount,
      shares: Math.round(shares * 1000000) / 1000000,
      exchangeRate: item.currency === 'USD' ? rate : undefined,
      memo: form.memo || undefined,
    };

    const updated = [...allRecords, newRecord];
    saveBuyRecords(updated);

    const thisItemRecords = updated.filter(r => r.portfolioItemId === item.id);
    setRecords(thisItemRecords);

    // 평단가·수량 재계산 후 부모에 전달
    const { avgCost, shares: newShares } = recalcFromRecords(updated, item.id, item.currency);
    onRecalc(item.id, avgCost, newShares);

    toast.success(`${form.date} 매수 기록 추가 완료! 평단가 재계산됨`);
    setForm(f => ({ ...f, price: '', memo: '', date: today }));
  };

  const handleDelete = (recordId: string) => {
    const updated = allRecords.filter(r => r.id !== recordId);
    saveBuyRecords(updated);
    const thisItemRecords = updated.filter(r => r.portfolioItemId === item.id);
    setRecords(thisItemRecords);

    // 기록 삭제 후 재계산
    if (thisItemRecords.length > 0) {
      const { avgCost, shares } = recalcFromRecords(updated, item.id, item.currency);
      onRecalc(item.id, avgCost, shares);
    }
    toast.success('매수 기록 삭제됨');
  };

  // 현재 집계 통계
  const { avgCost, shares: totalShares, totalInvestedKRW } = recalcFromRecords(
    [...allRecords],
    item.id,
    item.currency
  );

  const inputCls = "w-full bg-input border border-border rounded px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono";
  const labelCls = "block text-xs text-muted-foreground mb-1 font-mono";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="quant-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid rgba(0,212,255,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color: '#00d4ff' }} />
            <div>
              <div className="font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
                매수 기록 — <span className="ticker-badge">{item.ticker}</span>
                <span className="ml-2 text-sm font-normal text-muted-foreground">{item.nameKr || item.name}</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                매수할 때마다 기록하면 평단가와 보유수량이 자동으로 재계산됩니다
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        {/* 현재 집계 */}
        {records.length > 0 && (
          <div className="grid grid-cols-3 gap-3 p-4 border-b border-border/40"
            style={{ background: 'oklch(0.11 0.015 255)' }}>
            <div>
              <div className="text-xs text-muted-foreground font-mono mb-0.5">기록 기반 평단가</div>
              <div className="text-base font-bold font-mono" style={{ color: '#00d4ff' }}>
                {item.currency === 'USD' ? formatUSD(avgCost) : formatKRW(avgCost)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-mono mb-0.5">총 보유수량</div>
              <div className="text-base font-bold font-mono text-foreground">
                {totalShares.toFixed(6)}주
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-mono mb-0.5">총 투자금액</div>
              <div className="text-base font-bold font-mono text-gain">
                {formatKRW(totalInvestedKRW)}
              </div>
            </div>
          </div>
        )}

        {/* 새 매수 입력 폼 */}
        <div className="p-4 border-b border-border/40">
          <div className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'Space Grotesk' }}>
            새 매수 기록 추가
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className={labelCls}>
                <Calendar size={10} className="inline mr-1" />날짜
              </label>
              <input type="date" className={inputCls} value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>
                <DollarSign size={10} className="inline mr-1" />
                매수가 ({item.currency})
              </label>
              <input type="number" step="0.0001" className={inputCls}
                placeholder={item.currency === 'USD' ? '예: 115.50' : '예: 75400'}
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>매수금액 (원)</label>
              <input type="number" className={inputCls}
                placeholder="1000"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            {item.currency === 'USD' && (
              <div>
                <label className={labelCls}>환율 (원/달러)</label>
                <input type="number" className={inputCls}
                  placeholder="1380"
                  value={form.exchangeRate}
                  onChange={e => setForm(f => ({ ...f, exchangeRate: e.target.value }))} />
              </div>
            )}
            <div className={item.currency === 'USD' ? 'col-span-2 md:col-span-4' : 'col-span-2'}>
              <label className={labelCls}>메모 (선택)</label>
              <input type="text" className={inputCls}
                placeholder="예: 실적 발표 전 추가 매수"
                value={form.memo}
                onChange={e => setForm(f => ({ ...f, memo: e.target.value }))} />
            </div>
          </div>

          {/* 수량 미리보기 */}
          {previewShares !== null && (
            <div className="flex items-center gap-2 mb-3 p-2.5 rounded text-xs font-mono"
              style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <Hash size={11} style={{ color: '#00d4ff' }} />
              <span className="text-muted-foreground">이번 매수 수량:</span>
              <span style={{ color: '#00d4ff' }} className="font-semibold">
                {previewShares.toFixed(6)}주
              </span>
              {item.currency === 'USD' && (
                <span className="text-muted-foreground ml-1">
                  (환율 {parseFloat(form.exchangeRate || '1380').toLocaleString()}원 기준)
                </span>
              )}
            </div>
          )}

          <button onClick={handleAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium text-background transition-all hover:opacity-90"
            style={{ background: '#00d4ff' }}>
            <Plus size={14} /> 매수 기록 추가
          </button>
        </div>

        {/* 매수 히스토리 */}
        <div className="p-4">
          <div className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: 'Space Grotesk' }}>
            매수 히스토리
            <span className="ml-2 text-xs font-normal text-muted-foreground font-mono">
              총 {records.length}건
            </span>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm font-mono"
              style={{ border: '1px dashed oklch(0.25 0.02 255)', borderRadius: '0.5rem' }}>
              아직 매수 기록이 없습니다.<br />
              위에서 첫 번째 매수 기록을 추가해보세요!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {[...records]
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((r, idx) => (
                  <div key={r.id}
                    className="flex items-center gap-3 p-2.5 rounded hover:bg-white/[0.02] transition-colors"
                    style={{ border: '1px solid oklch(0.2 0.02 255)' }}>
                    <div className="font-mono text-xs text-muted-foreground w-[90px] shrink-0">
                      {r.date}
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2 text-xs font-mono">
                      <div>
                        <span className="text-muted-foreground">매수가 </span>
                        <span className="text-foreground">
                          {item.currency === 'USD' ? formatUSD(r.price) : formatKRW(r.price)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">금액 </span>
                        <span style={{ color: '#00d4ff' }}>{formatKRW(r.amount)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">수량 </span>
                        <span className="text-gain">+{r.shares.toFixed(6)}</span>
                      </div>
                    </div>
                    {r.memo && (
                      <div className="text-xs text-muted-foreground font-mono hidden md:block max-w-[100px] truncate">
                        {r.memo}
                      </div>
                    )}
                    <button onClick={() => handleDelete(r.id)}
                      className="p-1 text-muted-foreground hover:text-loss transition-colors rounded hover:bg-white/5 shrink-0">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
