// DESIGN: Dark Quant Terminal - Hero Section
// Full-width hero with background image, animated stats, key market indicators

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663037673521/TNgU9ndkzcn3xBu5JAHWWW/hero_bg-4gWVtSCwUGJWjoUYaUYTXS.webp';

const MARKET_TICKERS = [
  { label: 'S&P 500', value: '5,814', change: '+1.23%', up: true },
  { label: 'NASDAQ', value: '18,432', change: '+1.87%', up: true },
  { label: 'KOSPI', value: '3,421', change: '+0.54%', up: true },
  { label: 'KOSDAQ', value: '1,124', change: '-0.32%', up: false },
  { label: 'NVIDIA', value: '$1,087', change: '+2.14%', up: true },
  { label: '금 (Gold)', value: '$3,312', change: '+0.78%', up: true },
  { label: 'USD/KRW', value: '1,382', change: '-0.21%', up: false },
];

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

export default function HeroSection() {
  const totalAssets = useCountUp(460000);
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => (i + 1) % MARKET_TICKERS.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-[420px] flex flex-col justify-end overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={HERO_BG} alt="market bg" className="w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, oklch(0.09 0.015 255 / 0.3) 0%, oklch(0.09 0.015 255 / 0.7) 60%, oklch(0.09 0.015 255) 100%)'
        }} />
        <div className="absolute inset-0 grid-bg opacity-20" />
      </div>

      {/* Content */}
      <div className="relative container pb-10 pt-16">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: '#00ff88' }} />
            <span className="font-mono text-xs" style={{ color: '#00ff88' }}>LIVE DASHBOARD · 2026.05.11</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            글로벌 투자 전략
            <br />
            <span style={{ color: '#00d4ff' }}>대시보드</span>
          </h1>
          <p className="text-muted-foreground text-base mb-6 max-w-xl">
            최근 5년 한국·미국 시장 분석 · 국제 정세 리스크 점검 · 개인 포트폴리오 추적
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4">
            <div className="quant-card px-4 py-3 glow-cyan">
              <div className="text-xs text-muted-foreground mb-1 font-mono">월 총 투자금</div>
              <div className="text-2xl font-bold font-mono" style={{ color: '#00d4ff' }}>
                ₩{totalAssets.toLocaleString()}
              </div>
            </div>
            <div className="quant-card px-4 py-3">
              <div className="text-xs text-muted-foreground mb-1 font-mono">보유 종목 수</div>
              <div className="text-2xl font-bold font-mono text-foreground">9</div>
            </div>
            <div className="quant-card px-4 py-3 glow-mint">
              <div className="text-xs text-muted-foreground mb-1 font-mono">2025 KOSPI</div>
              <div className="text-2xl font-bold font-mono text-gain">+75.6%</div>
            </div>
            <div className="quant-card px-4 py-3">
              <div className="text-xs text-muted-foreground mb-1 font-mono">2025 S&P500</div>
              <div className="text-2xl font-bold font-mono text-gain">+23.3%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticker Tape */}
      <div className="relative border-t border-border/40 bg-black/30 backdrop-blur-sm py-2">
        <div className="container overflow-hidden">
          <div className="flex gap-8 overflow-x-auto scrollbar-none pb-0.5">
            {MARKET_TICKERS.map((t, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-xs text-muted-foreground">{t.label}</span>
                <span className="font-mono text-xs font-semibold text-foreground">{t.value}</span>
                <span className={`font-mono text-xs flex items-center gap-0.5 ${t.up ? 'text-gain' : 'text-loss'}`}>
                  {t.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {t.change}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
