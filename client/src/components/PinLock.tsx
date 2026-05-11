// DESIGN: Dark Quant Terminal - PIN Lock Component
// 포트폴리오 섹션 PIN 잠금/해제 + 최초 PIN 설정

import { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Eye, EyeOff, Shield, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const PIN_KEY = 'portfolio_pin_hash';
const SESSION_KEY = 'portfolio_unlocked_session';

// 단순 해시 (보안용이 아닌 간단한 난독화)
function simpleHash(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

function getStoredHash(): string | null {
  return localStorage.getItem(PIN_KEY);
}

function setStoredHash(pin: string) {
  localStorage.setItem(PIN_KEY, simpleHash(pin));
}

function checkPin(pin: string): boolean {
  const stored = getStoredHash();
  if (!stored) return false;
  return simpleHash(pin) === stored;
}

function isSessionUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

function setSessionUnlocked() {
  sessionStorage.setItem(SESSION_KEY, '1');
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

interface PinLockProps {
  children: React.ReactNode;
}

export default function PinLock({ children }: PinLockProps) {
  const hasPinSet = !!getStoredHash();
  const [mode, setMode] = useState<'locked' | 'unlocked' | 'setup'>(
    !hasPinSet ? 'setup' : isSessionUnlocked() ? 'unlocked' : 'locked'
  );
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === 'locked' || mode === 'setup') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [mode]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // PIN 설정 (최초)
  const handleSetup = () => {
    if (pin.length < 4) {
      toast.error('PIN은 4자리 이상이어야 합니다');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PIN이 일치하지 않습니다');
      triggerShake();
      setConfirmPin('');
      return;
    }
    setStoredHash(pin);
    setSessionUnlocked();
    setMode('unlocked');
    setPin('');
    setConfirmPin('');
    toast.success('PIN이 설정되었습니다. 포트폴리오가 잠금 해제되었습니다.');
  };

  // PIN 입력 → 잠금 해제
  const handleUnlock = () => {
    if (checkPin(pin)) {
      setSessionUnlocked();
      setMode('unlocked');
      setPin('');
      setAttempts(0);
      toast.success('잠금 해제되었습니다');
    } else {
      const next = attempts + 1;
      setAttempts(next);
      triggerShake();
      setPin('');
      if (next >= 5) {
        toast.error('시도 횟수를 초과했습니다. 페이지를 새로고침 해주세요.');
      } else {
        toast.error(`PIN이 틀렸습니다 (${next}/5)`);
      }
    }
  };

  // 잠금
  const handleLock = () => {
    clearSession();
    setMode('locked');
    setPin('');
    toast.info('포트폴리오가 잠겼습니다');
  };

  // PIN 변경 (재설정)
  const handleResetPin = () => {
    localStorage.removeItem(PIN_KEY);
    clearSession();
    setMode('setup');
    setPin('');
    setConfirmPin('');
  };

  // 잠금 해제 상태: 자물쇠 아이콘 + children 표시
  if (mode === 'unlocked') {
    return (
      <div className="relative">
        {/* 잠금 버튼 (우측 상단 고정) */}
        <div className="flex justify-end mb-2 px-4 md:px-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetPin}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-muted-foreground hover:text-foreground border border-border/40 hover:border-border transition-colors font-mono"
            >
              <RotateCcw size={11} /> PIN 변경
            </button>
            <button
              onClick={handleLock}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', color: '#00d4ff' }}
            >
              <Unlock size={11} /> 잠금
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // PIN 설정 화면 (최초)
  if (mode === 'setup') {
    return (
      <section id="portfolio" className="py-12 border-t border-border/40">
        <div className="container">
          <div className="max-w-sm mx-auto">
            <div className="quant-card p-6 text-center"
              style={{ border: '1px solid rgba(0,255,136,0.25)' }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
                <Shield size={24} style={{ color: '#00ff88' }} />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                포트폴리오 PIN 설정
              </h3>
              <p className="text-xs text-muted-foreground font-mono mb-5">
                나만 볼 수 있도록 PIN을 설정하세요.<br />
                공유받은 사람은 이 섹션을 볼 수 없습니다.
              </p>

              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-xs text-muted-foreground font-mono mb-1">새 PIN (4자리 이상)</label>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type={showPin ? 'text' : 'password'}
                      className="w-full bg-input border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary tracking-widest"
                      placeholder="••••"
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      onKeyDown={e => e.key === 'Enter' && inputRef.current?.blur()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className={shake ? 'animate-shake' : ''}>
                  <label className="block text-xs text-muted-foreground font-mono mb-1">PIN 확인</label>
                  <input
                    type={showPin ? 'text' : 'password'}
                    className="w-full bg-input border border-border rounded px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-primary tracking-widest"
                    placeholder="••••"
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    onKeyDown={e => e.key === 'Enter' && handleSetup()}
                  />
                </div>
              </div>

              <button
                onClick={handleSetup}
                disabled={pin.length < 4 || confirmPin.length < 4}
                className="w-full mt-4 py-2 rounded text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-40 font-mono"
                style={{ background: '#00ff88' }}>
                PIN 설정 완료
              </button>

              <p className="text-[10px] text-muted-foreground font-mono mt-3">
                PIN은 이 브라우저에만 저장됩니다. 잊어버리면 재설정이 필요합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 잠금 화면
  return (
    <section id="portfolio" className="py-12 border-t border-border/40">
      <div className="container">
        <div className="max-w-sm mx-auto">
          <div className={`quant-card p-6 text-center ${shake ? 'animate-shake' : ''}`}
            style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <Lock size={24} style={{ color: '#00d4ff' }} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>
              내 포트폴리오
            </h3>
            <p className="text-xs text-muted-foreground font-mono mb-5">
              PIN을 입력해 잠금을 해제하세요
            </p>

            <div className="relative mb-4">
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                className="w-full bg-input border border-border rounded px-3 py-2.5 text-center text-lg font-mono text-foreground focus:outline-none focus:border-primary tracking-[0.5em]"
                placeholder="••••"
                value={pin}
                disabled={attempts >= 5}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            {attempts > 0 && attempts < 5 && (
              <p className="text-xs text-loss font-mono mb-3">
                PIN이 틀렸습니다 ({attempts}/5회 시도)
              </p>
            )}
            {attempts >= 5 && (
              <p className="text-xs text-loss font-mono mb-3">
                시도 횟수 초과. 페이지를 새로고침 해주세요.
              </p>
            )}

            <button
              onClick={handleUnlock}
              disabled={pin.length < 4 || attempts >= 5}
              className="w-full py-2 rounded text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-40 font-mono"
              style={{ background: '#00d4ff' }}>
              잠금 해제
            </button>

            <button
              onClick={handleResetPin}
              className="w-full mt-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground transition-colors font-mono flex items-center justify-center gap-1">
              <RotateCcw size={10} /> PIN 잊어버렸어요 (재설정)
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
