// DESIGN: Dark Quant Terminal - Auth Gate
// 로그인한 사용자만 포트폴리오 섹션에 접근 가능
// 미로그인 시 로그인 유도 화면 표시

import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { Lock, LogIn, Shield, Loader2 } from 'lucide-react';

interface PinLockProps {
  children: React.ReactNode;
}

export default function PinLock({ children }: PinLockProps) {
  const { isAuthenticated, loading } = useAuth();

  // 로딩 중
  if (loading) {
    return (
      <section id="portfolio" className="py-12 border-t border-border/40">
        <div className="container">
          <div className="max-w-sm mx-auto">
            <div className="quant-card p-8 text-center">
              <Loader2 size={28} className="animate-spin mx-auto mb-3" style={{ color: '#00d4ff' }} />
              <p className="text-sm text-muted-foreground font-mono">인증 확인 중...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 미로그인 → 로그인 유도
  if (!isAuthenticated) {
    return (
      <section id="portfolio" className="py-12 border-t border-border/40">
        <div className="container">
          <div className="max-w-sm mx-auto">
            <div className="quant-card p-8 text-center"
              style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                <Lock size={28} style={{ color: '#00d4ff' }} />
              </div>

              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                내 포트폴리오
              </h3>
              <p className="text-sm text-muted-foreground font-mono mb-2 leading-relaxed">
                로그인하면 포트폴리오를 저장하고<br />
                어느 기기에서든 확인할 수 있습니다.
              </p>
              <p className="text-xs text-muted-foreground font-mono mb-6 leading-relaxed"
                style={{ color: 'rgba(0,212,255,0.7)' }}>
                공유받은 사람은 이 섹션을 볼 수 없습니다.
              </p>

              <div className="space-y-2 text-left mb-6 p-3 rounded"
                style={{ background: 'oklch(0.14 0.015 255)', border: '1px solid oklch(0.2 0.02 255)' }}>
                {[
                  '종목별 평단가 · 보유수량 자동 추적',
                  '야후파이낸스 연동 자동 적립 기록',
                  '멀티기기 동기화 (PC · 모바일)',
                  '다른 사용자와 완전히 분리된 데이터',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                    <Shield size={10} style={{ color: '#00ff88' }} className="shrink-0" />
                    {item}
                  </div>
                ))}
              </div>

              <a href={getLoginUrl()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold text-background transition-all hover:opacity-90"
                style={{ background: '#00d4ff' }}>
                <LogIn size={14} /> Manus 계정으로 로그인
              </a>

              <p className="text-[10px] text-muted-foreground font-mono mt-3">
                Manus 계정이 없으면 무료로 가입할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 로그인 완료 → 포트폴리오 표시
  return <>{children}</>;
}
