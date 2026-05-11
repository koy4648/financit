// DESIGN: Dark Quant Terminal - Navigation Bar
// Sticky top nav with neon accent, section links, live clock, login/logout

import { useState, useEffect } from 'react';
import { TrendingUp, BarChart2, PieChart, Star, Menu, X, LogOut, Globe, User, LogIn, CalendarDays, Bell } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

const PUBLIC_NAV = [
  { id: 'market', label: '시장 분석', icon: BarChart2 },
  { id: 'recommend', label: '국내주식 추천', icon: Star },
  { id: 'exit', label: '매도 전략', icon: LogOut },
];

const AUTH_NAV = [
  { id: 'geopolitics', label: '국제 정세', icon: Globe },
  { id: 'portfolio', label: '내 포트폴리오', icon: PieChart },
  { id: 'calendar', label: '매수 캘린더', icon: CalendarDays },
  { id: 'alerts', label: '목표가 알림', icon: Bell },
  { id: 'market', label: '시장 분석', icon: BarChart2 },
  { id: 'recommend', label: '국내주식 추천', icon: Star },
  { id: 'exit', label: '매도 전략', icon: LogOut },
];

export default function NavBar() {
  const [time, setTime] = useState(new Date());
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success('로그아웃되었습니다');
      window.location.reload();
    },
  });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileOpen(false);
  };

  const timeStr = time.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <nav className="sticky top-0 z-40 border-b border-border/40"
      style={{ background: 'oklch(0.10 0.018 255 / 0.95)', backdropFilter: 'blur(12px)' }}>
      <div className="container flex items-center justify-between h-12">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <TrendingUp size={16} style={{ color: '#00d4ff' }} />
          <span className="font-bold text-sm tracking-wider" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            <span style={{ color: '#00d4ff' }}>티끌모아</span>
            <span className="text-muted-foreground"> 태산</span>
          </span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {(isAuthenticated ? AUTH_NAV : PUBLIC_NAV).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors font-mono">
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Right: clock + auth */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:block text-xs font-mono text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full inline-block mr-1.5 animate-pulse" style={{ background: '#00ff88' }} />
            {timeStr}
          </span>

          {/* Auth 버튼 */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <User size={11} style={{ color: '#00d4ff' }} />
                <span style={{ color: '#00d4ff' }}>{user?.name || '사용자'}</span>
              </div>
              <button
                onClick={() => logoutMutation.mutate()}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-colors">
                <LogOut size={11} /> 로그아웃
              </button>
            </div>
          ) : (
            <a href={getLoginUrl()}
              className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold text-background transition-all hover:opacity-90"
              style={{ background: '#00d4ff' }}>
              <LogIn size={11} /> 로그인
            </a>
          )}

          {/* Mobile menu */}
          <button onClick={() => setMobileOpen(v => !v)}
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground">
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 py-2"
          style={{ background: 'oklch(0.10 0.018 255)' }}>
          {(isAuthenticated ? AUTH_NAV : PUBLIC_NAV).map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors font-mono">
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
