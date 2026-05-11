// DESIGN: Dark Quant Terminal - Auto Accumulate Modal (DB-backed)
// 적립 시작일 설정 → 야후파이낸스 종가 자동 반영 → DB에 저장 → 평단가 재계산

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { formatKRW, formatUSD } from '@/lib/portfolioData';
import { X, Zap, RefreshCw, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface ModalItem {
  id: string; ticker: string; name: string; nameKr: string;
  currency: 'KRW' | 'USD'; buyAmount: number; buyFrequency: string;
  avgCost: number; shares: number; type: string; sector: string; memo: string;
}

interface Props {
  item: ModalItem;
  onClose: () => void;
  onRecalc: (itemId: string, avgCost: number, shares: number) => void;
}

type Frequency = 'daily' | 'weekly' | 'monthly';

async function fetchHistoricalPrices(
  ticker: string, currency: 'KRW' | 'USD', startDate: string, endDate: string
): Promise<Record<string, number>> {
  const yahooTicker = currency === 'KRW' ? `${ticker}.KS` : ticker;
  const start = Math.floor(new Date(startDate).getTime() / 1000);
  const end = Math.floor(new Date(endDate).getTime() / 1000) + 86400;
  const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?period1=${start}&period2=${end}&interval=1d`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) throw new Error(`API 요청 실패: ${res.status}`);
  const wrapper = await res.json();
  const data = JSON.parse(wrapper.contents);
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`${ticker} 데이터를 찾을 수 없습니다`);
  const timestamps: number[] = result.timestamp || [];
  const closes: number[] = result.indicators?.quote?.[0]?.close || [];
  const priceMap: Record<string, number> = {};
  timestamps.forEach((ts, i) => {
    if (closes[i] != null) {
      priceMap[new Date(ts * 1000).toISOString().slice(0, 10)] = closes[i];
    }
  });
  return priceMap;
}

function generateDates(startDate: string, endDate: string, frequency: Frequency): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) dates.push(current.toISOString().slice(0, 10));
    if (frequency === 'daily') current.setDate(current.getDate() + 1);
    else if (frequency === 'weekly') current.setDate(current.getDate() + 7);
    else current.setMonth(current.getMonth() + 1);
  }
  return dates;
}

export default function AutoAccumulateModal({ item, onClose, onRecalc }: Props) {
  const itemId = parseInt(item.id);
  const utils = trpc.useUtils();

  const { data: lastDateData } = trpc.buyRecord.lastDate.useQuery({ portfolioItemId: itemId });
  const { data: existingRecords = [] } = trpc.buyRecord.list.useQuery({ portfolioItemId: itemId });
  const createBatch = trpc.buyRecord.createBatch.useMutation({
    onSuccess: (data) => {
      utils.buyRecord.list.invalidate({ portfolioItemId: itemId });
    },
    onError: (e) => toast.error(e.message),
  });
  const updateItem = trpc.portfolio.update.useMutation({
    onSuccess: () => utils.portfolio.list.invalidate(),
  });

  const [settings, setSettings] = useState({
    startDate: '2025-01-01',
    buyAmount: item.buyAmount,
    frequency: (item.buyFrequency as Frequency) || 'daily',
    defaultExchangeRate: 1380,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ added: number; skipped: number; avgCost: number; totalShares: number; totalInvestedKRW: number } | null>(null);

  const existingCount = existingRecords.length;

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const fetchStart = lastDateData
        ? new Date(new Date(lastDateData).getTime() + 86400000).toISOString().slice(0, 10)
        : settings.startDate;

      if (fetchStart > today) {
        setResult({ added: 0, skipped: 0, avgCost: item.avgCost, totalShares: item.shares, totalInvestedKRW: 0 });
        toast.info('새로 추가할 기록이 없습니다 (이미 최신 상태)');
        setLoading(false);
        return;
      }

      const priceMap = await fetchHistoricalPrices(item.ticker, item.currency, fetchStart, today);
      const targetDates = generateDates(fetchStart, today, settings.frequency);

      let added = 0; let skipped = 0;
      const newRecords: Array<{ portfolioItemId: number; date: string; price: number; amount: number; shares: number; exchangeRate?: number; memo?: string }> = [];

      for (const date of targetDates) {
        let price = priceMap[date];
        if (!price) {
          const prev = Object.keys(priceMap).sort().filter(d => d <= date).pop();
          if (prev) price = priceMap[prev];
        }
        if (!price) { skipped++; continue; }

        const rate = settings.defaultExchangeRate;
        const shares = item.currency === 'KRW' ? settings.buyAmount / price : settings.buyAmount / (price * rate);
        newRecords.push({
          portfolioItemId: itemId, date,
          price: Math.round(price * 10000) / 10000,
          amount: settings.buyAmount,
          shares: Math.round(shares * 1000000) / 1000000,
          exchangeRate: item.currency === 'USD' ? rate : undefined,
          memo: '자동 적립',
        });
        added++;
      }

      if (newRecords.length > 0) await createBatch.mutateAsync(newRecords);

      // 전체 기록 기반 평단가 재계산
      const allRecs = [...existingRecords, ...newRecords.map((r, i) => ({ ...r, id: -(i + 1), userId: 0, createdAt: new Date() }))];
      const totalShares = allRecs.reduce((s, r) => s + r.shares, 0);
      const totalInvestedKRW = allRecs.reduce((s, r) => s + r.amount, 0);
      let avgCost = 0;
      if (item.currency === 'KRW') {
        avgCost = totalShares > 0 ? totalInvestedKRW / totalShares : 0;
      } else {
        const totalUSD = allRecs.reduce((s, r) => s + r.shares * r.price, 0);
        avgCost = totalShares > 0 ? totalUSD / totalShares : 0;
      }
      avgCost = Math.round(avgCost * 10000) / 10000;
      const roundedShares = Math.round(totalShares * 100000) / 100000;

      await updateItem.mutateAsync({ id: itemId, data: { avgCost, shares: roundedShares } });
      onRecalc(item.id, avgCost, roundedShares);

      setResult({ added, skipped, avgCost, totalShares: roundedShares, totalInvestedKRW });
      if (added > 0) toast.success(`${added}건 자동 반영 완료! 평단가 재계산됨`);
      else toast.info('새로 추가할 기록이 없습니다 (이미 최신 상태)');
    } catch (e: any) {
      setError(e.message || '데이터를 가져오는 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-input border border-border rounded px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary font-mono";
  const labelCls = "block text-xs text-muted-foreground mb-1 font-mono";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="quant-card w-full max-w-lg" style={{ border: '1px solid rgba(0,255,136,0.3)' }}>
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: '#00ff88' }} />
            <div>
              <div className="font-semibold text-foreground" style={{ fontFamily: 'Space Grotesk' }}>
                자동 적립 반영 — <span className="ticker-badge">{item.ticker}</span>
              </div>
              <div className="text-xs text-muted-foreground font-mono mt-0.5">야후 파이낸스 종가 기준 · 서버 DB 저장</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-white/5"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-4">
          {existingCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded text-xs font-mono"
              style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <CheckCircle size={12} style={{ color: '#00d4ff' }} />
              <span className="text-muted-foreground">
                기존 기록 <span style={{ color: '#00d4ff' }}>{existingCount}건</span> 있음 — 마지막 기록 이후 날짜부터 자동으로 추가됩니다
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}><Calendar size={10} className="inline mr-1" />적립 시작일</label>
              <input type="date" className={inputCls} value={settings.startDate}
                onChange={e => setSettings(s => ({ ...s, startDate: e.target.value }))} />
              <div className="text-[10px] text-muted-foreground font-mono mt-1">
                {existingCount > 0 ? '기존 기록 있으면 마지막 날짜 이후부터 반영' : '이 날짜부터 오늘까지 전부 반영'}
              </div>
            </div>
            <div>
              <label className={labelCls}>1회 매수금액 (원)</label>
              <input type="number" className={inputCls} value={settings.buyAmount}
                onChange={e => setSettings(s => ({ ...s, buyAmount: parseInt(e.target.value) || 1000 }))} />
            </div>
            <div>
              <label className={labelCls}>매수 주기</label>
              <select className={inputCls} value={settings.frequency}
                onChange={e => setSettings(s => ({ ...s, frequency: e.target.value as Frequency }))}>
                <option value="daily">매일 (영업일 기준)</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
              </select>
            </div>
            {item.currency === 'USD' && (
              <div>
                <label className={labelCls}>평균 환율 (원/달러)</label>
                <input type="number" className={inputCls} value={settings.defaultExchangeRate}
                  onChange={e => setSettings(s => ({ ...s, defaultExchangeRate: parseInt(e.target.value) || 1380 }))} />
              </div>
            )}
          </div>

          <div className="p-3 rounded text-xs font-mono space-y-1"
            style={{ background: 'oklch(0.14 0.015 255)', border: '1px solid oklch(0.2 0.02 255)' }}>
            <div className="text-muted-foreground">📌 동작 방식</div>
            <div className="text-foreground">• 야후 파이낸스에서 {item.ticker} 과거 종가 자동 조회</div>
            <div className="text-foreground">• 주말·공휴일은 직전 거래일 종가 사용</div>
            <div className="text-foreground">• 기존 기록과 중복 없이 빠진 날짜만 추가</div>
            <div className="text-foreground">• 서버 DB에 저장 → 어느 기기에서든 동기화</div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded text-xs font-mono"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <AlertTriangle size={12} className="text-loss shrink-0 mt-0.5" />
              <div>
                <div className="text-loss font-semibold mb-0.5">오류 발생</div>
                <div className="text-muted-foreground">{error}</div>
              </div>
            </div>
          )}

          {result && !error && (
            <div className="p-3 rounded text-xs font-mono"
              style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckCircle size={12} style={{ color: '#00ff88' }} />
                <span className="font-semibold" style={{ color: '#00ff88' }}>반영 완료</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">추가된 기록: </span><span style={{ color: '#00ff88' }}>{result.added}건</span></div>
                <div><span className="text-muted-foreground">건너뜀: </span><span className="text-foreground">{result.skipped}건</span></div>
                <div><span className="text-muted-foreground">재계산 평단가: </span>
                  <span style={{ color: '#00d4ff' }}>{item.currency === 'USD' ? formatUSD(result.avgCost) : formatKRW(result.avgCost)}</span></div>
                <div><span className="text-muted-foreground">총 보유수량: </span><span className="text-foreground">{result.totalShares.toFixed(6)}주</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">총 투자금액: </span><span className="text-gain">{formatKRW(result.totalInvestedKRW)}</span></div>
              </div>
            </div>
          )}

          <button onClick={handleRun} disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: loading ? '#374151' : '#00ff88' }}>
            {loading ? <><RefreshCw size={14} className="animate-spin" /> 야후 파이낸스에서 데이터 가져오는 중...</>
              : <><Zap size={14} /> 자동 적립 반영 실행</>}
          </button>
        </div>
      </div>
    </div>
  );
}
