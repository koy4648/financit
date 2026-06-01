// DESIGN: Dark Quant Terminal - Auth Gate
// 로그인한 사용자만 포트폴리오 섹션에 접근 가능
// 미로그인 시 로그인 유도 화면 표시

import { useAuth } from '@/_core/hooks/useAuth';
import { Lock, LogIn, Shield, Loader2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface PinLockProps {
  children: React.ReactNode;
}

export default function PinLock({ children }: PinLockProps) {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onAuthSuccess = async (message: string) => {
    toast.success(message);
    await utils.auth.me.invalidate();
  };

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => onAuthSuccess('로그인되었습니다'),
    onError: (error) => toast.error(error.message),
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => onAuthSuccess('회원가입이 완료되었습니다'),
    onError: (error) => toast.error(error.message),
  });

  const pending = loginMutation.isPending || signupMutation.isPending;

  const submitAuth = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === 'signup') {
      signupMutation.mutate({ name, email, password });
      return;
    }

    loginMutation.mutate({ email, password });
  };

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

              <div className="flex rounded border border-border/60 p-1 mb-4 bg-background/40">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="flex-1 rounded py-1.5 text-xs font-mono transition-colors"
                  style={mode === 'login' ? { background: '#00d4ff', color: '#071018' } : undefined}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="flex-1 rounded py-1.5 text-xs font-mono transition-colors"
                  style={mode === 'signup' ? { background: '#00d4ff', color: '#071018' } : undefined}
                >
                  회원가입
                </button>
              </div>

              <form onSubmit={submitAuth} className="space-y-3">
                {mode === 'signup' && (
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={80}
                    placeholder="이름"
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-cyan-400"
                  />
                )}
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  type="email"
                  maxLength={320}
                  placeholder="이메일"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-cyan-400"
                />
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  type="password"
                  minLength={8}
                  maxLength={128}
                  placeholder="비밀번호 (8자 이상)"
                  className="w-full rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#00d4ff' }}
                >
                  {pending ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                  {mode === 'signup' ? '회원가입' : '로그인'}
                </button>
              </form>

              <p className="text-[10px] text-muted-foreground font-mono mt-3">
                회원 정보는 이 서비스의 데이터 저장용으로만 사용됩니다.
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
