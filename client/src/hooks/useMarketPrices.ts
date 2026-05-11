// 실시간 현재가·환율 조회 훅
import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';

export interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export interface PortfolioWithPrice {
  id: number;
  ticker: string;
  name: string;
  nameKr: string | null;
  currency: 'KRW' | 'USD';
  avgCost: number;
  shares: number;
  sector: string | null;
  type: string;
  buyAmount: number;
  buyFrequency: string;
  memo: string | null;
  // 계산된 필드
  currentPrice?: number;
  changePercent?: number;
  gainPercent?: number;       // 수익률 %
  gainAmount?: number;        // 평가손익 (해당 통화)
  valueKRW?: number;          // 원화 평가금액
  investedKRW?: number;       // 원화 투자금액 (avgCost * shares * rate)
  weight?: number;            // 포트폴리오 비중 %
}

export function useMarketPrices(items: Array<{
  id: number; ticker: string; currency: 'KRW' | 'USD';
  avgCost: number; shares: number; name: string; nameKr: string | null;
  sector: string | null; type: string; buyAmount: number; buyFrequency: string; memo: string | null;
}>) {
  const tickers = useMemo(() =>
    items.map(i => ({ ticker: i.ticker, currency: i.currency })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items.map(i => i.ticker).join(',')]
  );

  const { data: prices, isLoading: pricesLoading } = trpc.market.prices.useQuery(
    tickers,
    { enabled: tickers.length > 0, staleTime: 60_000, refetchInterval: 120_000 }
  );

  const { data: rateData, isLoading: rateLoading } = trpc.market.exchangeRate.useQuery(
    undefined,
    { staleTime: 300_000, refetchInterval: 300_000 }
  );

  const exchangeRate = rateData?.rate ?? 1380;

  const enriched: PortfolioWithPrice[] = useMemo(() => {
    if (!items.length) return [];

    const withPrices = items.map(item => {
      const priceInfo = prices?.[item.ticker];
      const currentPrice = priceInfo?.price;

      let gainPercent: number | undefined;
      let gainAmount: number | undefined;
      let valueKRW: number | undefined;
      let investedKRW: number | undefined;

      if (currentPrice && item.avgCost > 0) {
        gainPercent = ((currentPrice - item.avgCost) / item.avgCost) * 100;
        gainAmount = (currentPrice - item.avgCost) * item.shares;
      }

      if (currentPrice) {
        valueKRW = item.currency === 'KRW'
          ? currentPrice * item.shares
          : currentPrice * item.shares * exchangeRate;
      } else {
        // 현재가 없으면 평단가 기준
        valueKRW = item.currency === 'KRW'
          ? item.avgCost * item.shares
          : item.avgCost * item.shares * exchangeRate;
      }

      investedKRW = item.currency === 'KRW'
        ? item.avgCost * item.shares
        : item.avgCost * item.shares * exchangeRate;

      return {
        ...item,
        currentPrice,
        changePercent: priceInfo?.changePercent,
        gainPercent,
        gainAmount,
        valueKRW,
        investedKRW,
      };
    });

    // 총 평가금액 계산 후 비중 계산
    const totalValue = withPrices.reduce((s, i) => s + (i.valueKRW ?? 0), 0);
    return withPrices.map(i => ({
      ...i,
      weight: totalValue > 0 ? ((i.valueKRW ?? 0) / totalValue) * 100 : 0,
    }));
  }, [items, prices, exchangeRate]);

  const totalValueKRW = enriched.reduce((s, i) => s + (i.valueKRW ?? 0), 0);
  const totalInvestedKRW = enriched.reduce((s, i) => s + (i.investedKRW ?? 0), 0);
  const totalGainPercent = totalInvestedKRW > 0
    ? ((totalValueKRW - totalInvestedKRW) / totalInvestedKRW) * 100
    : 0;

  return {
    enriched,
    exchangeRate,
    totalValueKRW,
    totalInvestedKRW,
    totalGainPercent,
    isLoading: pricesLoading || rateLoading,
  };
}
