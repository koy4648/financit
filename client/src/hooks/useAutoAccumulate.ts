// 야후파이낸스 공개 API를 통해 과거 종가를 가져와
// 적립 시작일부터 오늘까지 빠진 날짜를 자동으로 채우는 훅

import { useState, useCallback } from 'react';
import {
  PortfolioItem, BuyRecord,
  loadBuyRecords, saveBuyRecords, recalcFromRecords,
} from '@/lib/portfolioData';

export interface AccumulateSettings {
  portfolioItemId: string;
  startDate: string;       // YYYY-MM-DD
  buyAmount: number;       // 1회 매수금액(원)
  frequency: 'daily' | 'weekly' | 'monthly';
  defaultExchangeRate: number;
}

export interface AccumulateResult {
  added: number;
  skipped: number;
  avgCost: number;
  totalShares: number;
  totalInvestedKRW: number;
}

// 야후파이낸스 v8 API (CORS 우회용 프록시 포함)
async function fetchHistoricalPrices(
  ticker: string,
  currency: 'KRW' | 'USD',
  startDate: string,
  endDate: string
): Promise<Record<string, number>> {
  // 야후 파이낸스 티커 변환 (한국 주식은 .KS 접미사)
  const yahooTicker = currency === 'KRW'
    ? `${ticker}.KS`
    : ticker;

  const start = Math.floor(new Date(startDate).getTime() / 1000);
  const end = Math.floor(new Date(endDate).getTime() / 1000) + 86400;

  // CORS 우회를 위해 allorigins 프록시 사용
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
      const dateStr = new Date(ts * 1000).toISOString().slice(0, 10);
      priceMap[dateStr] = closes[i];
    }
  });

  return priceMap;
}

// 주어진 주기에 따라 날짜 목록 생성
function generateDates(
  startDate: string,
  endDate: string,
  frequency: 'daily' | 'weekly' | 'monthly'
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 주말 제외 (토=6, 일=0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(current.toISOString().slice(0, 10));
    }
    if (frequency === 'daily') {
      current.setDate(current.getDate() + 1);
    } else if (frequency === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }
  return dates;
}

export function useAutoAccumulate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAccumulate = useCallback(async (
    item: PortfolioItem,
    settings: AccumulateSettings,
    onComplete: (avgCost: number, shares: number) => void
  ): Promise<AccumulateResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().slice(0, 10);
      const endDate = today;

      // 기존 기록 확인 → 마지막 기록 날짜 이후부터만 추가
      const allRecords = loadBuyRecords();
      const existingForItem = allRecords.filter(r => r.portfolioItemId === item.id);
      const lastDate = existingForItem.length > 0
        ? existingForItem.sort((a, b) => b.date.localeCompare(a.date))[0].date
        : null;

      // 시작일: 마지막 기록 다음날 or 설정된 시작일
      const fetchStart = lastDate
        ? new Date(new Date(lastDate).getTime() + 86400000).toISOString().slice(0, 10)
        : settings.startDate;

      if (fetchStart > endDate) {
        return { added: 0, skipped: 0, avgCost: 0, totalShares: 0, totalInvestedKRW: 0 };
      }

      // 야후 파이낸스에서 종가 데이터 가져오기
      const priceMap = await fetchHistoricalPrices(
        item.ticker,
        item.currency,
        fetchStart,
        endDate
      );

      // 매수 날짜 목록 생성
      const targetDates = generateDates(fetchStart, endDate, settings.frequency);

      let added = 0;
      let skipped = 0;
      const newRecords: BuyRecord[] = [];

      for (const date of targetDates) {
        // 해당 날짜 종가 찾기 (없으면 가장 가까운 이전 날짜)
        let price = priceMap[date];
        if (!price) {
          // 가장 가까운 이전 거래일 종가 사용
          const sortedDates = Object.keys(priceMap).sort();
          const prev = sortedDates.filter(d => d <= date).pop();
          if (prev) price = priceMap[prev];
        }

        if (!price) { skipped++; continue; }

        const rate = settings.defaultExchangeRate;
        const shares = item.currency === 'KRW'
          ? settings.buyAmount / price
          : settings.buyAmount / (price * rate);

        newRecords.push({
          id: `auto-${item.id}-${date}`,
          portfolioItemId: item.id,
          date,
          price: Math.round(price * 10000) / 10000,
          amount: settings.buyAmount,
          shares: Math.round(shares * 1000000) / 1000000,
          exchangeRate: item.currency === 'USD' ? rate : undefined,
          memo: '자동 적립',
        });
        added++;
      }

      const updatedAll = [...allRecords, ...newRecords];
      saveBuyRecords(updatedAll);

      const { avgCost, shares: totalShares, totalInvestedKRW } = recalcFromRecords(
        updatedAll, item.id, item.currency
      );

      onComplete(avgCost, totalShares);

      return { added, skipped, avgCost, totalShares, totalInvestedKRW };
    } catch (e: any) {
      setError(e.message || '데이터를 가져오는 중 오류가 발생했습니다');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { runAccumulate, loading, error };
}
