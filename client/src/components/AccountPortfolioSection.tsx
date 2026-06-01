import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Wallet, Building2, Shield, Briefcase } from "lucide-react";

const ACCOUNT_LABELS: Record<string, { label: string; desc: string; icon: React.ReactNode; color: string }> = {
  isa: { label: "중개형 ISA", desc: "비과세 혜택, 연 2000만원 한도", icon: <Shield className="w-4 h-4" />, color: "text-cyan-400" },
  pension: { label: "연금저축펀드", desc: "세액공제 400만원, 55세 이후 수령", icon: <Building2 className="w-4 h-4" />, color: "text-emerald-400" },
  irp: { label: "개인형 IRP", desc: "세액공제 300만원 추가, 퇴직금 통합", icon: <Wallet className="w-4 h-4" />, color: "text-violet-400" },
  general: { label: "일반 주식계좌", desc: "자유로운 매매, 양도세 적용", icon: <Briefcase className="w-4 h-4" />, color: "text-amber-400" },
  "shinhan": { label: "신한투자증권", desc: "주식/발행어음 계좌", icon: <Briefcase className="w-4 h-4" />, color: "text-blue-400" },
  "koreainvest": { label: "한국투자증권", desc: "주식/발행어음 계좌", icon: <Briefcase className="w-4 h-4" />, color: "text-orange-400" },
  "mirae": { label: "미래에셋증권", desc: "주식/발행어음 계좌", icon: <Briefcase className="w-4 h-4" />, color: "text-yellow-400" },
};

const ACCOUNT_TYPES = Object.keys(ACCOUNT_LABELS);

function formatKRW(n: number) {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}억`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}만원`;
  return `${n.toLocaleString()}원`;
}

function AddItemModal({ accountType, onSuccess }: { accountType: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    ticker: "", name: "", nameKr: "",
    type: "etf" as "us-stock" | "kr-stock" | "etf" | "commodity" | "savings" | "note",
    currency: "KRW" as "KRW" | "USD",
    avgCost: "", shares: "",
    buyAmount: "1000",
    buyFrequency: "monthly" as "daily" | "weekly" | "monthly",
    sector: "", memo: "",
    maturityDate: "",
    interestRate: "",
  });

  const utils = trpc.useUtils();
  const createMutation = trpc.portfolio.create.useMutation({
    onSuccess: () => {
      utils.portfolio.list.invalidate();
      toast.success("종목이 추가되었습니다");
      setOpen(false);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = () => {
    if (!form.ticker || !form.name || !form.avgCost || !form.shares) {
      toast.error("필수 항목을 입력해주세요");
      return;
    }
    createMutation.mutate({
      ticker: form.ticker.toUpperCase(),
      name: form.name,
      nameKr: form.nameKr || undefined,
      type: form.type,
      currency: form.currency,
      avgCost: parseFloat(form.avgCost),
      shares: parseFloat(form.shares),
      buyAmount: parseInt(form.buyAmount) || 0,
      buyFrequency: form.buyFrequency,
      sector: form.sector || undefined,
      memo: form.memo || undefined,
      maturityDate: form.maturityDate || undefined,
      interestRate: form.interestRate ? parseFloat(form.interestRate) : undefined,
      accountType,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
          <Plus className="w-3 h-3 mr-1" /> 종목 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#0d1117] border-[#30363d] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-cyan-400">{ACCOUNT_LABELS[accountType].label}에 종목 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">티커 *</Label>
              <Input value={form.ticker} onChange={e => setForm(p => ({ ...p, ticker: e.target.value }))}
                placeholder="예: NVDA, 005930" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">종목명 *</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="예: 엔비디아" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">유형</Label>
              <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v as typeof form.type }))}>
                <SelectTrigger className="bg-[#161b22] border-[#30363d] text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                  <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                    <SelectItem value="us-stock">미국주식</SelectItem>
                    <SelectItem value="kr-stock">한국주식</SelectItem>
                    <SelectItem value="etf">ETF</SelectItem>
                    <SelectItem value="commodity">원자재</SelectItem>
                    <SelectItem value="savings">적금</SelectItem>
                    <SelectItem value="note">발행어음</SelectItem>
                  </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-400">통화</Label>
              <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v as "KRW" | "USD" }))}>
                <SelectTrigger className="bg-[#161b22] border-[#30363d] text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                  <SelectItem value="KRW">KRW (원화)</SelectItem>
                  <SelectItem value="USD">USD (달러)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">평단가 *</Label>
              <Input type="number" value={form.avgCost} onChange={e => setForm(p => ({ ...p, avgCost: e.target.value }))}
                placeholder="0" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">보유수량 *</Label>
              <Input type="number" value={form.shares} onChange={e => setForm(p => ({ ...p, shares: e.target.value }))}
                placeholder="0" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-400">정기 매수금액 (원)</Label>
              <Input type="number" value={form.buyAmount} onChange={e => setForm(p => ({ ...p, buyAmount: e.target.value }))}
                placeholder="1000" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
            </div>
            <div>
              <Label className="text-xs text-gray-400">매수 주기</Label>
              <Select value={form.buyFrequency} onValueChange={v => setForm(p => ({ ...p, buyFrequency: v as typeof form.buyFrequency }))}>
                <SelectTrigger className="bg-[#161b22] border-[#30363d] text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d] text-white">
                  <SelectItem value="daily">매일</SelectItem>
                  <SelectItem value="weekly">매주</SelectItem>
                  <SelectItem value="monthly">매월</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(form.type === "savings" || form.type === "note") && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-400">만기일</Label>
                <Input type="date" value={form.maturityDate} onChange={e => setForm(p => ({ ...p, maturityDate: e.target.value }))}
                  className="bg-[#161b22] border-[#30363d] text-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-gray-400">이율 (%)</Label>
                <Input type="number" value={form.interestRate} onChange={e => setForm(p => ({ ...p, interestRate: e.target.value }))}
                  placeholder="0.0" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs text-gray-400">섹터</Label>
            <Input value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))}
              placeholder="예: 반도체, 금융" className="bg-[#161b22] border-[#30363d] text-white mt-1" />
          </div>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}
            className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-semibold">
            {createMutation.isPending ? "추가 중..." : "추가"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AccountPortfolioSection() {
  const { data: items = [], isLoading } = trpc.portfolio.list.useQuery();
  const { data: exchangeRateData } = trpc.market.exchangeRate.useQuery();
  const exchangeRate = exchangeRateData?.rate ?? 1380;

  const utils = trpc.useUtils();
  const deleteMutation = trpc.portfolio.delete.useMutation({
    onSuccess: () => { utils.portfolio.list.invalidate(); toast.success("종목 삭제됨"); },
  });

  // 계좌별 종목 분류
  const byAccount = (type: string) => items.filter(i => (i.accountType ?? "general") === type);

  // 계좌별 총 투자금액 (평단가 × 수량)
  const accountTotal = (type: string) => {
    return byAccount(type).reduce((sum, item) => {
      const valueKRW = item.currency === "USD"
        ? item.avgCost * item.shares * exchangeRate
        : item.avgCost * item.shares;
      return sum + valueKRW;
    }, 0);
  };

  const totalAll = ACCOUNT_TYPES.reduce(
    (sum, t) => sum + accountTotal(t), 0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full mr-2" />
        포트폴리오 불러오는 중...
      </div>
    );
  }

  return (
    <section id="accounts" className="py-16 px-4 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-1">계좌별 포트폴리오</h2>
        <p className="text-gray-400 text-sm">ISA · 연금저축 · IRP · 일반계좌를 분리하여 관리하세요</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2">
          <span className="text-gray-400 text-sm">전체 투자원금</span>
          <span className="text-cyan-400 font-bold text-lg">{formatKRW(totalAll)}</span>
        </div>
      </div>

      <Tabs defaultValue="isa" className="w-full">
        <TabsList className="bg-[#161b22] border border-[#30363d] p-1 mb-6 flex flex-wrap gap-1 h-auto">
          {ACCOUNT_TYPES.map(type => {
            const info = ACCOUNT_LABELS[type];
            const count = byAccount(type).length;
            const total = accountTotal(type);
            return (
              <TabsTrigger
                key={type}
                value={type}
                className="flex-1 min-w-[120px] data-[state=active]:bg-[#0d1117] data-[state=active]:text-cyan-400 text-gray-400 py-2"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <span className={info.color}>{info.icon}</span>
                    <span className="text-xs font-medium">{info.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-500">{count}종목 · {formatKRW(total)}</span>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {ACCOUNT_TYPES.map(type => {
          const info = ACCOUNT_LABELS[type];
          const accountItems = byAccount(type);
          return (
            <TabsContent key={type} value={type}>
              <Card className="bg-[#0d1117] border-[#30363d]">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-base flex items-center gap-2 ${info.color}`}>
                        {info.icon} {info.label}
                      </CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">{info.desc}</p>
                    </div>
                    <AddItemModal accountType={type} onSuccess={() => {}} />
                  </div>
                </CardHeader>
                <CardContent>
                  {accountItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <Wallet className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">아직 종목이 없습니다</p>
                      <p className="text-xs mt-1">위 "종목 추가" 버튼으로 추가해보세요</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#30363d] text-gray-500 text-xs">
                            <th className="text-left pb-2 pr-4">종목</th>
                            <th className="text-right pb-2 pr-4">평단가</th>
                            <th className="text-right pb-2 pr-4">수량</th>
                            <th className="text-right pb-2 pr-4">투자금액</th>
                            <th className="text-right pb-2 pr-4">매수주기</th>
                            <th className="text-right pb-2">관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accountItems.map(item => {
                            const valueKRW = item.currency === "USD"
                              ? item.avgCost * item.shares * exchangeRate
                              : item.avgCost * item.shares;
                            const freqLabel = { daily: "매일", weekly: "매주", monthly: "매월" }[item.buyFrequency];
                            const isSavings = item.type === "savings" || item.type === "note";
                            return (
                              <tr key={item.id} className="border-b border-[#30363d]/50 hover:bg-[#161b22]/50 transition-colors">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <div className="font-mono text-cyan-400 text-xs">{item.ticker}</div>
                                      <div className="text-white text-sm">{item.nameKr || item.name}</div>
                                      {isSavings && (
                                        <div className="text-[10px] text-gray-500">
                                          {item.maturityDate && `만기: ${item.maturityDate}`}
                                          {item.interestRate && ` · 이율: ${item.interestRate}%`}
                                        </div>
                                      )}
                                    </div>
                                    <Badge variant="outline" className="text-[10px] border-gray-600 text-gray-400 hidden sm:flex">
                                      {item.currency}
                                    </Badge>
                                  </div>
                                </td>
                                <td className="text-right pr-4 text-gray-300 font-mono text-xs">
                                  {item.currency === "USD"
                                    ? `$${item.avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `${item.avgCost.toLocaleString()}원`}
                                </td>
                                <td className="text-right pr-4 text-gray-300 font-mono text-xs">
                                  {item.shares.toFixed(4)}
                                </td>
                                <td className="text-right pr-4 text-white font-semibold text-xs">
                                  {formatKRW(valueKRW)}
                                </td>
                                <td className="text-right pr-4 text-xs">
                                  <Badge className="bg-[#161b22] text-gray-400 border-[#30363d] text-[10px]">
                                    {freqLabel} {item.buyAmount.toLocaleString()}원
                                  </Badge>
                                </td>
                                <td className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                                    onClick={() => {
                                      if (confirm(`${item.name}을 삭제할까요?`)) {
                                        deleteMutation.mutate({ id: item.id });
                                      }
                                    }}
                                  >
                                    ×
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-[#30363d] text-gray-400 text-xs">
                            <td colSpan={3} className="pt-2 text-gray-500">합계</td>
                            <td className="text-right pt-2 text-cyan-400 font-bold">
                              {formatKRW(accountTotal(type))}
                            </td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  );
}
