import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { formatKRW } from '@/lib/portfolioData';
import { CalendarDays } from 'lucide-react';

const DAY_LABELS = ['일','월','화','수','목','금','토'];
const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const COLORS = ['#00d4ff','#7c3aed','#ff6b35','#f59e0b','#00ff88','#ef4444','#1e90ff','#9370db'];

export default function BuyCalendar() {
  const { data: items = [] } = trpc.portfolio.list.useQuery();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const buySchedule = useMemo(() => {
    const schedule: Record<number, Array<{ ticker: string; amount: number; color: string }>> = {};
    items.forEach((item, idx) => {
      const color = COLORS[idx % COLORS.length];
      if (item.buyFrequency === 'daily') {
        for (let d = 1; d <= daysInMonth; d++) {
          const dow = new Date(year, month, d).getDay();
          if (dow !== 0 && dow !== 6) {
            if (!schedule[d]) schedule[d] = [];
            schedule[d].push({ ticker: item.ticker, amount: item.buyAmount, color });
          }
        }
      } else if (item.buyFrequency === 'weekly') {
        for (let d = 1; d <= daysInMonth; d++) {
          if (new Date(year, month, d).getDay() === 1) {
            if (!schedule[d]) schedule[d] = [];
            schedule[d].push({ ticker: item.ticker, amount: item.buyAmount, color });
          }
        }
      } else {
        if (!schedule[1]) schedule[1] = [];
        schedule[1].push({ ticker: item.ticker, amount: item.buyAmount, color });
      }
    });
    return schedule;
  }, [items, year, month, daysInMonth]);

  const monthTotal = useMemo(() =>
    Object.values(buySchedule).reduce((sum, dayItems) =>
      sum + dayItems.reduce((s, i) => s + i.amount, 0), 0), [buySchedule]);

  const todayItems = buySchedule[today] || [];
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <section id="calendar" className="py-12 border-t border-border/40">
      <div className="container">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #f59e0b, #ff6b35)' }} />
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>매수 캘린더</h2>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono">
              {year}년 {MONTH_LABELS[month]} · 이번 달 예정 {formatKRW(monthTotal)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 quant-card p-4">
            <div className="grid grid-cols-7 mb-2">
              {DAY_LABELS.map((d, i) => (
                <div key={d} className={`text-center text-xs font-mono py-1 ${i===0?'text-red-400':i===6?'text-blue-400':'text-muted-foreground'}`}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, idx) => {
                if (!day) return <div key={idx} className="aspect-square" />;
                const isToday = day === today;
                const isPast = day < today;
                const dayItems = buySchedule[day] || [];
                const dow = new Date(year, month, day).getDay();
                const totalAmt = dayItems.reduce((s, i) => s + i.amount, 0);
                return (
                  <div key={idx} className={`aspect-square rounded p-0.5 flex flex-col transition-colors relative group ${isToday?'ring-1 ring-cyan-400':''} ${isPast?'opacity-50':''} ${dayItems.length>0?'bg-white/[0.04] hover:bg-white/[0.07]':''}`}>
                    <div className={`text-xs font-mono leading-none mb-0.5 ${isToday?'font-bold':''} ${dow===0?'text-red-400':dow===6?'text-blue-400':'text-muted-foreground'}`}>{day}</div>
                    {dayItems.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 flex-1">
                        {dayItems.slice(0,3).map((item, i) => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                        ))}
                        {dayItems.length > 3 && <div className="text-[8px] text-muted-foreground font-mono">+{dayItems.length-3}</div>}
                      </div>
                    )}
                    {dayItems.length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-10 hidden group-hover:block w-36 quant-card p-2 text-xs font-mono shadow-lg">
                        {dayItems.map((item, i) => (
                          <div key={i} className="flex justify-between gap-1">
                            <span style={{ color: item.color }}>{item.ticker}</span>
                            <span className="text-muted-foreground">{formatKRW(item.amount)}</span>
                          </div>
                        ))}
                        <div className="border-t border-border/40 mt-1 pt-1 flex justify-between">
                          <span className="text-muted-foreground">합계</span>
                          <span style={{ color: '#00d4ff' }}>{formatKRW(totalAmt)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-4">
            <div className="quant-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={14} style={{ color: '#00d4ff' }} />
                <span className="text-sm font-medium">오늘 매수 예정</span>
                <span className="text-xs text-muted-foreground font-mono">{month+1}/{today}</span>
              </div>
              {todayItems.length === 0 ? (
                <div className="text-xs text-muted-foreground font-mono">오늘은 매수 예정이 없습니다</div>
              ) : (
                <div className="space-y-2">
                  {todayItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span style={{ color: item.color }}>{item.ticker}</span>
                      </div>
                      <span className="text-foreground">{formatKRW(item.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-border/40 pt-2 flex justify-between text-xs font-mono">
                    <span className="text-muted-foreground">합계</span>
                    <span style={{ color: '#00d4ff' }} className="font-semibold">{formatKRW(todayItems.reduce((s,i)=>s+i.amount,0))}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="quant-card p-4">
              <div className="text-xs text-muted-foreground font-mono mb-3">종목 범례</div>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const color = COLORS[idx % COLORS.length];
                  const freqLabel = item.buyFrequency==='daily'?'매일(평일)':item.buyFrequency==='weekly'?'매주 월':'매월 1일';
                  return (
                    <div key={item.id} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                        <span style={{ color }}>{item.ticker}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-foreground">{formatKRW(item.buyAmount)}</div>
                        <div className="text-muted-foreground">{freqLabel}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
