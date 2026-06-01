import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, PiggyBank, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

function formatKRW(n: number) {
  if (Math.abs(n) >= 100000000) return `${(n / 100000000).toFixed(2)}억`;
  if (Math.abs(n) >= 10000) return `${(n / 10000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}

const ACCOUNT_LABELS: Record<string, string> = {
  isa: "중개형ISA", pension: "연금저축", irp: "IRP", general: "일반계좌",
  shinhan: "신한투자", koreainvest: "한국투자", mirae: "미래에셋",
};

const ACCOUNT_TYPES = Object.keys(ACCOUNT_LABELS);

// ── 원금기록장 ─────────────────────────────────────────────────────────────────
function PrincipalSection() {
  const { data: records = [], isLoading } = trpc.principal.list.useQuery();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), accountType: "isa", amount: "", memo: "" });

  const createMutation = trpc.principal.create.useMutation({
    onSuccess: () => { utils.principal.list.invalidate(); toast.success("원금 기록 추가됨"); setOpen(false); setForm(p => ({ ...p, amount: "", memo: "" })); },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.principal.delete.useMutation({
    onSuccess: () => { utils.principal.list.invalidate(); toast.success("삭제됨"); },
  });

  // 월별 집계
  const monthlyMap: Record<string, Record<string, number>> = {};
  records.forEach(r => {
    const ym = r.date.slice(0, 7);
    if (!monthlyMap[ym]) monthlyMap[ym] = {};
    monthlyMap[ym][r.accountType] = (monthlyMap[ym][r.accountType] ?? 0) + r.amount;
  });
  const monthlyData = Object.entries(monthlyMap).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([ym, acc]) => {
    const data: any = { month: ym.slice(5) + "월" };
    ACCOUNT_TYPES.forEach(type => { data[type] = acc[type] ?? 0; });
    data.total = Object.values(acc).reduce((s, v) => s + v, 0);
    return data;
  });

  const totalByAccount: Record<string, number> = {};
  records.forEach(r => { totalByAccount[r.accountType] = (totalByAccount[r.accountType] ?? 0) + r.amount; });
  const grandTotal = Object.values(totalByAccount).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-4">
      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ACCOUNT_TYPES.map(type => (
          <div key={type} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">{ACCOUNT_LABELS[type]}</div>
            <div className="text-cyan-400 font-bold text-sm">{formatKRW(totalByAccount[type] ?? 0)}</div>
          </div>
        ))}
      </div>
      <div className="bg-[#161b22] border border-cyan-500/30 rounded-lg p-3 flex items-center justify-between">
        <span className="text-gray-400 text-sm">전체 누계 원금</span>
        <span className="text-cyan-400 font-bold text-xl">{formatKRW(grandTotal)}</span>
      </div>

      {/* 월별 차트 */}
      {monthlyData.length > 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="text-xs text-gray-400 mb-3">월별 입금액 (최근 12개월)</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0d1117", border: "1px solid #30363d", borderRadius: "8px" }}
                labelStyle={{ color: "#9ca3af" }}
                formatter={(v: number) => [formatKRW(v), ""]}
              />
              <Bar dataKey="isa" stackId="a" fill="#22d3ee" name="ISA" />
              <Bar dataKey="pension" stackId="a" fill="#34d399" name="연금저축" />
              <Bar dataKey="irp" stackId="a" fill="#a78bfa" name="IRP" />
              <Bar dataKey="general" stackId="a" fill="#fbbf24" name="일반" />
              <Bar dataKey="shinhan" stackId="a" fill="#60a5fa" name="신한" />
              <Bar dataKey="koreainvest" stackId="a" fill="#fb923c" name="한투" />
              <Bar dataKey="mirae" stackId="a" fill="#facc15" name="미래" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 추가 버튼 */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              <Plus className="w-3 h-3 mr-1" /> 입금 기록 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d1117] border-[#30363d] text-white max-w-sm">
            <DialogHeader><DialogTitle className="text-cyan-400">원금 입금 기록</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div>
                <Label className="text-xs text-gray-400">날짜</Label>
                <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="bg-[#161b22] border-[#30363d] text-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-400">계좌</Label>
                <Select value={form.accountType} onValueChange={v => setForm(p => ({ ...p, accountType: v }))}>
                  <SelectTrigger className="bg-[#161b22] border-[#30363d] text-white mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                    {ACCOUNT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{ACCOUNT_LABELS[type]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-400">입금액 (원)</Label>
                <Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="예: 100000" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-400">메모</Label>
                <Input value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))}
                  placeholder="선택사항" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
              </div>
              <Button onClick={() => createMutation.mutate({ date: form.date, accountType: form.accountType as any, amount: parseInt(form.amount), memo: form.memo || undefined })}
                disabled={createMutation.isPending || !form.amount}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                {createMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 기록 목록 */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {records.slice().reverse().map(r => (
          <div key={r.id} className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-mono">{r.date}</span>
              <Badge className="text-[10px] bg-[#0d1117] border-[#30363d] text-gray-400">{ACCOUNT_LABELS[r.accountType]}</Badge>
              {r.memo && <span className="text-xs text-gray-500">{r.memo}</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-semibold text-sm">{formatKRW(r.amount)}</span>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10"
                onClick={() => deleteMutation.mutate({ id: r.id })}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        {records.length === 0 && <p className="text-center text-gray-500 text-sm py-6">입금 기록이 없습니다</p>}
      </div>
    </div>
  );
}

// ── 외화내역 ───────────────────────────────────────────────────────────────────
function FxSection() {
  const { data: records = [] } = trpc.fx.list.useQuery();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), type: "buy", exchangeRate: "", usdAmount: "", krwAmount: "", memo: "" });

  const createMutation = trpc.fx.create.useMutation({
    onSuccess: () => { utils.fx.list.invalidate(); toast.success("외화 기록 추가됨"); setOpen(false); },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.fx.delete.useMutation({
    onSuccess: () => { utils.fx.list.invalidate(); toast.success("삭제됨"); },
  });

  // 평균 환전 환율 계산 (매수 기준)
  const buyRecords = records.filter(r => r.type === "buy");
  const totalKRW = buyRecords.reduce((s, r) => s + r.krwAmount, 0);
  const totalUSD = buyRecords.reduce((s, r) => s + r.usdAmount, 0);
  const avgRate = totalUSD > 0 ? totalKRW / totalUSD : 0;

  // 환율 자동 계산
  const handleRateChange = (rate: string, usd: string) => {
    const r = parseFloat(rate), u = parseFloat(usd);
    if (!isNaN(r) && !isNaN(u)) setForm(p => ({ ...p, exchangeRate: rate, usdAmount: usd, krwAmount: Math.round(r * u).toString() }));
    else setForm(p => ({ ...p, exchangeRate: rate, usdAmount: usd }));
  };

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">총 환전 원화</div>
          <div className="text-cyan-400 font-bold text-sm">{formatKRW(totalKRW)}</div>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">총 환전 달러</div>
          <div className="text-emerald-400 font-bold text-sm">${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="bg-[#161b22] border border-cyan-500/30 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">평균 환전 환율</div>
          <div className="text-white font-bold text-sm">{avgRate > 0 ? `₩${avgRate.toFixed(1)}` : "-"}</div>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              <Plus className="w-3 h-3 mr-1" /> 외화 기록 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d1117] border-[#30363d] text-white max-w-sm">
            <DialogHeader><DialogTitle className="text-cyan-400">외화 환전 기록</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-400">날짜</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="bg-[#161b22] border-[#30363d] text-white mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">구분</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="bg-[#161b22] border-[#30363d] text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                      <SelectItem value="buy">달러 매수</SelectItem>
                      <SelectItem value="sell">달러 매도</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-400">환율 (₩/USD)</Label>
                <Input type="number" value={form.exchangeRate}
                  onChange={e => handleRateChange(e.target.value, form.usdAmount)}
                  placeholder="예: 1380.5" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-400">달러 금액 ($)</Label>
                  <Input type="number" value={form.usdAmount}
                    onChange={e => handleRateChange(form.exchangeRate, e.target.value)}
                    placeholder="예: 100" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">원화 금액 (원)</Label>
                  <Input type="number" value={form.krwAmount} onChange={e => setForm(p => ({ ...p, krwAmount: e.target.value }))}
                    placeholder="자동 계산" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-400">메모</Label>
                <Input value={form.memo} onChange={e => setForm(p => ({ ...p, memo: e.target.value }))}
                  placeholder="선택사항" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
              </div>
              <Button onClick={() => createMutation.mutate({
                date: form.date, type: form.type as "buy" | "sell",
                exchangeRate: parseFloat(form.exchangeRate), usdAmount: parseFloat(form.usdAmount),
                krwAmount: parseInt(form.krwAmount), memo: form.memo || undefined,
              })} disabled={createMutation.isPending || !form.exchangeRate || !form.usdAmount || !form.krwAmount}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                {createMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {records.slice().reverse().map(r => (
          <div key={r.id} className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 font-mono">{r.date}</span>
              <Badge className={`text-[10px] ${r.type === "buy" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                {r.type === "buy" ? "매수" : "매도"}
              </Badge>
              <span className="text-xs text-gray-400">₩{r.exchangeRate.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-emerald-400 font-semibold text-sm">${r.usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-gray-500 text-xs">{formatKRW(r.krwAmount)}</div>
              </div>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10"
                onClick={() => deleteMutation.mutate({ id: r.id })}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
        {records.length === 0 && <p className="text-center text-gray-500 text-sm py-6">외화 기록이 없습니다</p>}
      </div>
    </div>
  );
}

// ── 실현손익 ───────────────────────────────────────────────────────────────────
function RealizedGainSection() {
  const { data: records = [] } = trpc.realizedGain.list.useQuery({});
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [activeMarket, setActiveMarket] = useState<"all" | "kr" | "us">("all");
  const [form, setForm] = useState({
    market: "kr" as "kr" | "us", buyDate: "", sellDate: "", ticker: "", name: "",
    buyPrice: "", sellPrice: "", shares: "", dividendTotal: "0",
    currency: "KRW" as "KRW" | "USD", memo: "",
  });

  const createMutation = trpc.realizedGain.create.useMutation({
    onSuccess: () => { utils.realizedGain.list.invalidate(); toast.success("실현손익 기록 추가됨"); setOpen(false); },
    onError: e => toast.error(e.message),
  });
  const deleteMutation = trpc.realizedGain.delete.useMutation({
    onSuccess: () => { utils.realizedGain.list.invalidate(); toast.success("삭제됨"); },
  });

  const filtered = activeMarket === "all" ? records : records.filter(r => r.market === activeMarket);

  // 수익률 계산
  const calcReturn = (r: typeof records[0]) => {
    const gain = (r.sellPrice - r.buyPrice) * r.shares + r.dividendTotal;
    const cost = r.buyPrice * r.shares;
    const absReturn = cost > 0 ? (gain / cost) * 100 : 0;
    const days = Math.max(1, (new Date(r.sellDate).getTime() - new Date(r.buyDate).getTime()) / 86400000);
    const totalReturn = cost > 0 ? ((r.sellPrice + (r.dividendTotal / r.shares)) / r.buyPrice - 1) * 100 : 0;
    return { gain, absReturn, days, totalReturn };
  };

  const totalGain = filtered.reduce((s, r) => s + calcReturn(r).gain, 0);

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-3">
        <span className="text-gray-400 text-sm">총 실현손익</span>
        <span className={`font-bold text-lg ${totalGain >= 0 ? "text-emerald-400" : "text-red-400"}`}>
          {totalGain >= 0 ? "+" : ""}{filtered[0]?.currency === "USD" ? `$${totalGain.toFixed(2)}` : formatKRW(totalGain)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "kr", "us"] as const).map(m => (
            <Button key={m} size="sm" variant={activeMarket === m ? "default" : "outline"}
              className={activeMarket === m ? "bg-cyan-500 text-black" : "border-[#30363d] text-gray-400 hover:bg-[#161b22]"}
              onClick={() => setActiveMarket(m)}>
              {m === "all" ? "전체" : m === "kr" ? "🇰🇷 한국" : "🇺🇸 미국"}
            </Button>
          ))}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              <Plus className="w-3 h-3 mr-1" /> 매도 기록 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0d1117] border-[#30363d] text-white max-w-md">
            <DialogHeader><DialogTitle className="text-cyan-400">실현손익 기록</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-400">시장</Label>
                  <Select value={form.market} onValueChange={v => setForm(p => ({ ...p, market: v as "kr" | "us", currency: v === "us" ? "USD" : "KRW" }))}>
                    <SelectTrigger className="bg-[#161b22] border-[#30363d] text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                      <SelectItem value="kr">🇰🇷 한국주식</SelectItem>
                      <SelectItem value="us">🇺🇸 미국주식</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-400">종목명 *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="예: 삼성전자" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
                </div>
              </div>
              {form.market === "us" && (
                <div>
                  <Label className="text-xs text-gray-400">티커 (미국)</Label>
                  <Input value={form.ticker} onChange={e => setForm(p => ({ ...p, ticker: e.target.value }))}
                    placeholder="예: NVDA" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-400">매수일</Label>
                  <Input type="date" value={form.buyDate} onChange={e => setForm(p => ({ ...p, buyDate: e.target.value }))}
                    className="bg-[#161b22] border-[#30363d] text-white mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">매도일</Label>
                  <Input type="date" value={form.sellDate} onChange={e => setForm(p => ({ ...p, sellDate: e.target.value }))}
                    className="bg-[#161b22] border-[#30363d] text-white mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-gray-400">매수단가</Label>
                  <Input type="number" value={form.buyPrice} onChange={e => setForm(p => ({ ...p, buyPrice: e.target.value }))}
                    placeholder="0" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">매도단가</Label>
                  <Input type="number" value={form.sellPrice} onChange={e => setForm(p => ({ ...p, sellPrice: e.target.value }))}
                    placeholder="0" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">수량</Label>
                  <Input type="number" value={form.shares} onChange={e => setForm(p => ({ ...p, shares: e.target.value }))}
                    placeholder="0" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-400">누적 배당금</Label>
                <Input type="number" value={form.dividendTotal} onChange={e => setForm(p => ({ ...p, dividendTotal: e.target.value }))}
                  placeholder="0" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
              </div>
              <Button onClick={() => createMutation.mutate({
                market: form.market, buyDate: form.buyDate, sellDate: form.sellDate,
                ticker: form.ticker || undefined, name: form.name,
                buyPrice: parseFloat(form.buyPrice), sellPrice: parseFloat(form.sellPrice),
                shares: parseFloat(form.shares), dividendTotal: parseFloat(form.dividendTotal) || 0,
                currency: form.currency, memo: form.memo || undefined,
              })} disabled={createMutation.isPending || !form.name || !form.buyDate || !form.sellDate || !form.buyPrice || !form.sellPrice || !form.shares}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
                {createMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 기록 목록 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#30363d] text-gray-500 text-xs">
              <th className="text-left pb-2 pr-3">종목</th>
              <th className="text-right pb-2 pr-3">매수가</th>
              <th className="text-right pb-2 pr-3">매도가</th>
              <th className="text-right pb-2 pr-3">수량</th>
              <th className="text-right pb-2 pr-3">차익</th>
              <th className="text-right pb-2 pr-3">수익률</th>
              <th className="text-right pb-2 pr-3">보유기간</th>
              <th className="text-right pb-2">삭제</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
              const { gain, absReturn, days } = calcReturn(r);
              const isProfit = gain >= 0;
              const curr = r.currency === "USD" ? "$" : "₩";
              return (
                <tr key={r.id} className="border-b border-[#30363d]/50 hover:bg-[#161b22]/50">
                  <td className="py-2 pr-3">
                    <div className="font-medium text-white text-xs">{r.name}</div>
                    {r.ticker && <div className="text-gray-500 text-[10px] font-mono">{r.ticker}</div>}
                    <div className="text-gray-600 text-[10px]">{r.buyDate} → {r.sellDate}</div>
                  </td>
                  <td className="text-right pr-3 text-gray-400 font-mono text-xs">{curr}{r.buyPrice.toLocaleString()}</td>
                  <td className="text-right pr-3 text-gray-400 font-mono text-xs">{curr}{r.sellPrice.toLocaleString()}</td>
                  <td className="text-right pr-3 text-gray-400 text-xs">{r.shares}</td>
                  <td className={`text-right pr-3 font-semibold text-xs ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                    {isProfit ? "+" : ""}{curr}{Math.abs(gain).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`text-right pr-3 font-semibold text-xs ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                    {isProfit ? "+" : ""}{absReturn.toFixed(2)}%
                  </td>
                  <td className="text-right pr-3 text-gray-400 text-xs">{days}일</td>
                  <td className="text-right">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteMutation.mutate({ id: r.id })}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-gray-500 text-sm py-6">매도 기록이 없습니다</p>}
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export default function FinanceRecordsSection() {
  return (
    <section id="finance-records" className="py-16 px-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">재무 기록</h2>
        <p className="text-gray-400 text-sm">원금기록장 · 외화내역 · 실현손익을 한 곳에서 관리하세요</p>
      </div>

      <Tabs defaultValue="principal" className="w-full">
        <TabsList className="bg-[#161b22] border border-[#30363d] p-1 mb-6">
          <TabsTrigger value="principal" className="data-[state=active]:bg-[#0d1117] data-[state=active]:text-cyan-400 text-gray-400 flex items-center gap-1.5">
            <PiggyBank className="w-3.5 h-3.5" /> 원금기록장
          </TabsTrigger>
          <TabsTrigger value="fx" className="data-[state=active]:bg-[#0d1117] data-[state=active]:text-cyan-400 text-gray-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5" /> 외화내역
          </TabsTrigger>
          <TabsTrigger value="realized" className="data-[state=active]:bg-[#0d1117] data-[state=active]:text-cyan-400 text-gray-400 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> 실현손익
          </TabsTrigger>
        </TabsList>

        <TabsContent value="principal">
          <Card className="bg-[#0d1117] border-[#30363d]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-cyan-400 flex items-center gap-2">
                <PiggyBank className="w-4 h-4" /> 원금기록장
              </CardTitle>
            </CardHeader>
            <CardContent><PrincipalSection /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fx">
          <Card className="bg-[#0d1117] border-[#30363d]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-emerald-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> 외화내역
              </CardTitle>
            </CardHeader>
            <CardContent><FxSection /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realized">
          <Card className="bg-[#0d1117] border-[#30363d]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-violet-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" /> 실현손익
              </CardTitle>
            </CardHeader>
            <CardContent><RealizedGainSection /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
