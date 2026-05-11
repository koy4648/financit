// DESIGN: Dark Quant Terminal - Auto Accumulate Modal
// 적립 시작일 설정 → 야후파이낸스 종가 자동 반영 → 평단가 재계산

import { useState } from 'react';
import { PortfolioItem, formatKRW, formatUSD, loadBuyRecords } from '@/lib/portfolioData';
import { useAutoAccumulate, AccumulateSettings } from '@/hooks/useAutoAccumulate';
import { X, Zap, RefreshCw, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  item: PortfolioItem;
  onClose: () => void;
  onRecalc: (itemId: string, avgCost: number, shares: number) => void;
}

export default function AutoAccumulateModal({ item, onClose, onRecalc }: Props) {
  const { runAccumulate, loading, error } = useAutoAccumulate();

  const [settings, setSettings] = useState<Omit<AccumulateSettings, 'portfolioItemId'>>({
    startDate: '2025-01-01',
    buyAmount: item.buyAmount,
    frequency: item.buyFrequency,
    defaultExchangeRate: 1380,
  });

  const [result, setResult] = useState<{
    added: number; skipped: number; avgCost: number;
    totalShares: number; totalInvestedKRW: number;
  } | null>(null);

  // 기존 기록 수
  const existingCount = loadBuyRecords().filter(r => r.portfolioItemId === item.id).length;

  const handleRun = async () => {
    const res = await runAccumulate(
      item,
      { ...settings, portfolioItemId: item.id },
      (avgCost, shares) => onRecalc(item.id, avgCost, shares)
    );
    if (res) {
      setResult(res);
      if (res.added > 0) {
        toast.success(`${res.added}건 자동 반영 완료! 평단가 재계산됨`);
      } else {
        toast.info('새로 추가할 기록이 없습니다 (이미 최신 상태)');
      }
    }
  };

  const inputCls = "w-full bg-input border border-border rounded px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono";
  const labelCls = "block text-xs text-muted-foreground mb-1 font-mono";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="quant-card w-full max-w-lg"
        style={{ border: '1px solid rgba(0,255,136,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: '#00ff88' }} />
            <div>
              <div className="font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
                자동 적립 반영 — <span className="ticker-badge">{item.ticker}</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">
                야후 파이낸스 종가 기준으로 매수 기록을 자동 생성합니다
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-white/5">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 기존 기록 안내 */}
          {existingCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded text-xs font-mono"
              style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <CheckCircle size={12} style={{ color: '#00d4ff' }} />
              <span className="text-muted-foreground">
                기존 기록 <span style={{ color: '#00d4ff' }}>{existingCount}건</span> 있음 —
                마지막 기록 이후 날짜부터 자동으로 추가됩니다
              </span>
            </div>
          )}

          {/* 설정 폼 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>
                <Calendar size={10} className="inline mr-1" />
                적립 시작일
              </label>
              <input type="date" className={inputCls}
                value={settings.startDate}
                onChange={e => setSettings(s => ({ ...s, startDate: e.target.value }))} />
              <div className="text-[10px] text-muted-foreground font-mono mt-1">
                {existingCount > 0 ? '기존 기록 있으면 마지막 날짜 이후부터 반영' : '이 날짜부터 오늘까지 전부 반영'}
              </div>
            </div>

            <div>
              <label className={labelCls}>1회 매수금액 (원)</label>
              <input type="number" className={inputCls}
                value={settings.buyAmount}
                onChange={e => setSettings(s => ({ ...s, buyAmount: parseInt(e.target.value) || 1000 }))} />
            </div>

            <div>
              <label className={labelCls}>매수 주기</label>
              <select className={inputCls}
                value={settings.frequency}
                onChange={e => setSettings(s => ({ ...s, frequency: e.target.value as any }))}>
                <option value="daily">매일 (영업일 기준)</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
              </select>
            </div>

            {item.currency === 'USD' && (
              <div>
                <label className={labelCls}>평균 환율 (원/달러)</label>
                <input type="number" className={inputCls}
                  value={settings.defaultExchangeRate}
                  onChange={e => setSettings(s => ({ ...s, defaultExchangeRate: parseInt(e.target.value) || 1380 }))} />
              </div>
            )}
          </div>

          {/* 예상 안내 */}
          <div className="p-3 rounded text-xs font-mono space-y-1"
            style={{ background: 'oklch(0.14 0.015 255)', border: '1px solid oklch(0.2 0.02 255)' }}>
            <div className="text-muted-foreground">📌 동작 방식</div>
            <div className="text-foreground">• 야후 파이낸스에서 {item.ticker} 과거 종가 자동 조회</div>
            <div className="text-foreground">• 주말·공휴일은 직전 거래일 종가 사용</div>
            <div className="text-foreground">• 기존 기록과 중복 없이 빠진 날짜만 추가</div>
            <div className="text-foreground">• 추가 후 평단가·보유수량 자동 재계산</div>
            {item.currency === 'KRW' && (
              <div className="text-muted-foreground mt-1">
                ⚠ 국내 주식은 야후 티커({item.ticker}.KS) 기준. 일부 종목은 데이터 없을 수 있음
              </div>
            )}
          </div>

          {/* 오류 표시 */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded text-xs font-mono"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={12} className="text-loss shrink-0 mt-0.5" />
              <div>
                <div className="text-loss font-semibold mb-0.5">오류 발생</div>
                <div className="text-muted-foreground">{error}</div>
                <div className="text-muted-foreground mt-1">
                  야후 파이낸스 API가 일시적으로 불안정할 수 있습니다. 잠시 후 다시 시도해주세요.
                </div>
              </div>
            </div>
          )}

          {/* 결과 표시 */}
          {result && !error && (
            <div className="p-3 rounded text-xs font-mono"
              style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle size={12} style={{ color: '#00ff88' }} />
                <span className="font-semibold" style={{ color: '#00ff88' }}>반영 완료</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground">추가된 기록: </span>
                  <span style={{ color: '#00ff88' }}>{result.added}건</span>
                </div>
                <div>
                  <span className="text-muted-foreground">건너뜀: </span>
                  <span className="text-foreground">{result.skipped}건</span>
                </div>
                <div>
                  <span className="text-muted-foreground">재계산 평단가: </span>
                  <span style={{ color: '#00d4ff' }}>
                    {item.currency === 'USD' ? formatUSD(result.avgCost) : formatKRW(result.avgCost)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">총 보유수량: </span>
                  <span className="text-foreground">{result.totalShares.toFixed(6)}주</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">총 투자금액: </span>
                  <span className="text-gain">{formatKRW(result.totalInvestedKRW)}</span>
                </div>
              </div>
            </div>
          )}

          {/* 실행 버튼 */}
          <button onClick={handleRun} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: loading ? '#374151' : '#00ff88' }}>
            {loading ? (
              <><RefreshCw size={14} className="animate-spin" /> 야후 파이낸스에서 데이터 가져오는 중...</>
            ) : (
              <><Zap size={14} /> 자동 적립 반영 실행</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
