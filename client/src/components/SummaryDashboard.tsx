// 종합 요약 대시보드 — 전체 자산 현황 (계좌별 합계, 실현손익, 총 원금 대비 수익률)
import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3, PiggyBank, Activity } from "lucide-react";

function formatKRW(n: number) {
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(2)}억`;
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}

const ACCOUNT_COLORS: Record<string, string> = {
  isa: "#22d3ee",
  pension: "#34d399",
  irp: "#a78bfa",
  general: "#fbbf24",
  shinhan: "#60a5fa",
  koreainvest: "#fb923c",
  mirae: "#facc15",
};
const ACCOUNT_LABELS: Record<string, string> = {
  isa: "중개형ISA", pension: "연금저축", irp: "IRP", general: "일반계좌",
  shinhan: "신한투자", koreainvest: "한국투자", mirae: "미래에셋",
};

export default function SummaryDashboard() {
  const { data: portfolioItems = [] } = trpc.portfolio.list.useQuery();
  const { data: principalRecords = [] } = trpc.principal.list.useQuery();
  const { data: realizedGains = [] } = trpc.realizedGain.list.useQuery({});
  const { data: exchangeRateData } = trpc.market.exchangeRate.useQuery();
  const exchangeRate = exchangeRateData?.rate ?? 1380;

  // 현재가 조회를 위한 ticker 목록
  const tickerInputs = useMemo(
    () => portfolioItems
      .filter(item => item.ticker && typeof item.ticker === 'string' && item.ticker.trim() !== "" && item.type !== 'savings' && item.type !== 'note')
      .map(item => ({ ticker: item.currency === "KRW" ? `${item.ticker}.KS` : item.ticker, currency: item.currency })),
    [portfolioItems]
  );
  const { data: priceMap = {} } = trpc.market.prices.useQuery(tickerInputs, {
    enabled: tickerInputs.length > 0,
    staleTime: 60_000,
  });

  // 총 원금 (principalRecords 합계)
  const totalPrincipal = useMemo(
    () => principalRecords.reduce((s, r) => s + r.amount, 0),
    [principalRecords]
  );

  // 계좌별 투자금액(평단가×수량) 및 현재 평가금액
  const { accountInvestedTotals, accountCurrentTotals, totalInvested, liquidAssets, lockedAssets } = useMemo(() => {
    const invested: Record<string, number> = {};
    const current: Record<string, number> = {};
    let liquid = 0;
    let locked = 0;

    portfolioItems.forEach(item => {
      const type = (item.accountType ?? "general") as string;
      const investedKRW = item.currency === "USD"
        ? item.avgCost * item.shares * exchangeRate
        : item.avgCost * item.shares;

      const yahooTicker = item.currency === "KRW" ? `${item.ticker}.KS` : item.ticker;
      const priceData = priceMap[yahooTicker];
      const currentPrice = priceData?.price ?? item.avgCost;
      const currentKRW = item.currency === "USD"
        ? currentPrice * item.shares * exchangeRate
        : currentPrice * item.shares;

      invested[type] = (invested[type] ?? 0) + investedKRW;
      current[type] = (current[type] ?? 0) + currentKRW;

      // 가용/묶인 자금 구분 (주식/ETF/원자재/발행어음은 묶인 돈, 적금은 묶인 돈, 현금성? 일단 적금/어음/주식 모두 묶인 돈으로 취급하되 principal에서 남은 돈을 가용으로?)
      // 여기서는 종목 타입에 따라 구분
      if (item.type === "savings" || item.type === "note" || item.type === "us-stock" || item.type === "kr-stock" || item.type === "etf" || item.type === "commodity") {
        locked += currentKRW;
      } else {
        liquid += currentKRW;
      }
    });

    const investedTotal = Object.values(invested).reduce((sum, value) => sum + value, 0);

    // 총 원금에서 총 투자금액을 뺀 나머지를 가용 자금(현금)으로 간주
    const cash = Math.max(0, totalPrincipal - investedTotal);
    liquid += cash;

    return {
      accountInvestedTotals: invested,
      accountCurrentTotals: current,
      totalInvested: investedTotal,
      liquidAssets: liquid,
      lockedAssets: locked,
    };
  }, [portfolioItems, priceMap, exchangeRate, totalPrincipal]);

  const totalCurrent = useMemo(() => Object.values(accountCurrentTotals).reduce((s, v) => s + v, 0), [accountCurrentTotals]);

  // 미실현 손익
  const unrealizedGain = totalCurrent - totalInvested;
  const unrealizedRate = totalInvested > 0 ? (unrealizedGain / totalInvested) * 100 : 0;

  // 총 실현손익 (KRW 기준)
  const totalRealizedGain = useMemo(() => {
    return realizedGains.reduce((s, r) => {
      const gain = (r.sellPrice - r.buyPrice) * r.shares + r.dividendTotal;
      const gainKRW = r.currency === "USD" ? gain * exchangeRate : gain;
      return s + gainKRW;
    }, 0);
  }, [realizedGains, exchangeRate]);

  // 원금 대비 총 수익률 (미실현 + 실현)
  const totalGain = unrealizedGain + totalRealizedGain;
  const totalReturnRate = totalPrincipal > 0
    ? (totalGain / totalPrincipal) * 100
    : totalInvested > 0
    ? (unrealizedGain / totalInvested) * 100
    : 0;

  // 계좌별 파이차트 데이터 (현재 평가금액 기준)
  const pieData = Object.entries(accountCurrentTotals)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: ACCOUNT_LABELS[key], value, color: ACCOUNT_COLORS[key] }));

  const isPositive = totalReturnRate >= 0;
  const isUnrealizedPositive = unrealizedGain >= 0;

  return (
    <section className="py-8 px-4 max-w-6xl mx-auto">
      {/* 상단 요약 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* 총 납입 원금 */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <PiggyBank className="w-3.5 h-3.5 text-cyan-400" />
            총 납입 원금
          </div>
          <div className="text-white font-bold text-lg">{formatKRW(totalPrincipal)}</div>
          <div className="text-gray-500 text-xs">{principalRecords.length}건 입금</div>
        </div>

        {/* 총 평가금액 (현재가 기준) */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            총 평가금액
          </div>
          <div className="text-white font-bold text-lg">{formatKRW(totalCurrent + (totalPrincipal - totalInvested))}</div>
          <div className="flex justify-between items-center mt-1">
            <div className="text-[10px] text-gray-500">가용: {formatKRW(liquidAssets)}</div>
            <div className="text-[10px] text-gray-500">묶인: {formatKRW(lockedAssets)}</div>
          </div>
        </div>

        {/* 총 실현손익 */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <BarChart3 className="w-3.5 h-3.5 text-violet-400" />
            총 실현손익
          </div>
          <div className={`font-bold text-lg ${totalRealizedGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalRealizedGain >= 0 ? "+" : ""}{formatKRW(totalRealizedGain)}
          </div>
          <div className="text-gray-500 text-xs">{realizedGains.length}건 매도</div>
        </div>

        {/* 총 수익률 */}
        <div className={`bg-[#0d1117] border rounded-xl p-4 flex flex-col gap-1.5 ${isPositive ? "border-emerald-500/30" : "border-red-500/30"}`}>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            {isPositive
              ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              : <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
            종합 수익률
          </div>
          <div className={`font-bold text-lg ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{totalReturnRate.toFixed(2)}%
          </div>
          <div className="text-gray-500 text-xs">
            {totalPrincipal > 0
              ? `원금 ${formatKRW(totalPrincipal)} 기준`
              : totalInvested > 0
              ? `투자금 ${formatKRW(totalInvested)} 기준`
              : "데이터 없음"}
          </div>
        </div>
      </div>

      {/* 계좌별 비중 파이차트 */}
      {pieData.length > 0 && (
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4">
          <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            계좌별 평가금액 비중
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="shrink-0">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "8px" }}
                    formatter={(v: number) => [formatKRW(v), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 flex-1 w-full">
              {pieData.map((d, i) => {
                const pct = totalCurrent > 0 ? (d.value / totalCurrent) * 100 : 0;
                const accountKey = Object.keys(ACCOUNT_LABELS).find(k => ACCOUNT_LABELS[k] === d.name) ?? "";
                const investedVal = accountInvestedTotals[accountKey] ?? 0;
                const gainVal = d.value - investedVal;
                const gainPct = investedVal > 0 ? (gainVal / investedVal) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                    <span className="text-gray-400 text-xs w-20 shrink-0">{d.name}</span>
                    <div className="flex-1 bg-[#161b22] rounded-full h-1.5">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
                    </div>
                    <span className="text-white text-xs font-semibold w-20 text-right">{formatKRW(d.value)}</span>
                    <span className={`text-xs w-16 text-right ${gainVal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {gainVal >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
