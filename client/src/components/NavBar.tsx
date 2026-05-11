// DESIGN: Dark Quant Terminal - Navigation Bar
// Sticky top nav with neon accent, section links, live clock

import { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, PieChart, Star, Menu, X, LogOut } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'market', label: '시장 분석', icon: BarChart2 },
  { id: 'portfolio', label: '내 포트폴리오', icon: PieChart },
  { id: 'recommend', label: '국내주식 추천', icon: Star },
  { id: 'exit', label: '매도 전략', icon: LogOut },
];

export default function NavBar() {
  const [time, setTime] = useState(new Date());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 backdrop-blur-md"
      style={{ background: 'oklch(0.09 0.015 255 / 0.92)' }}>
      <div className="container flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00d4ff22, #00ff8822)', border: '1px solid #00d4ff44' }}>
            <TrendingUp size={14} style={{ color: '#00d4ff' }} />
          </div>
          <span className="font-bold text-sm tracking-wide" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <span style={{ color: '#00d4ff' }}>QUANT</span>
            <span className="text-foreground/80"> DASHBOARD</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-muted-foreground hover:text-foreground transition-colors hover:bg-white/5">
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Clock + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: '#00ff88' }} />
            <span>{time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <button className="md:hidden p-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(v => !v)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 py-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5">
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
