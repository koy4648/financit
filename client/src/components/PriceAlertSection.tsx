// 목표가 알림 섹션 — 목표가 설정 + 브라우저 알림
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { formatKRW, formatUSD } from '@/lib/portfolioData';
import { Bell, BellOff, Plus, Trash2, Target } from 'lucide-react';
import { toast } from 'sonner';

type Alert = {
  id: string;
  ticker: string;
  name: string;
  targetPrice: number;
  direction: 'above' | 'below';
  currency: 'KRW' | 'USD';
  triggered: boolean;
};

const STORAGE_KEY = 'priceAlerts_v1';

function loadAlerts(): Alert[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAlerts(alerts: Alert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export default function PriceAlertSection() {
  const { data: items = [] } = trpc.portfolio.list.useQuery();
  const [alerts, setAlerts] = useState<Alert[]>(loadAlerts);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ticker: '', targetPrice: '', direction: 'above' as 'above' | 'below' });

  useEffect(() => {
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    saveAlerts(alerts);
  }, [alerts]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') toast.success('알림이 활성화되었습니다!');
    else toast.error('알림 권한이 거부되었습니다.');
  };

  const addAlert = () => {
    if (!form.ticker || !form.targetPrice) {
      toast.error('티커와 목표가를 입력해주세요.');
      return;
    }
    const item = items.find(i => i.ticker === form.ticker);
    const newAlert: Alert = {
      id: Date.now().toString(),
      ticker: form.ticker,
      name: item?.nameKr || item?.name || form.ticker,
      targetPrice: parseFloat(form.targetPrice),
      direction: form.direction,
      currency: (item?.currency as 'KRW' | 'USD') || 'USD',
      triggered: false,
    };
    setAlerts(prev => [...prev, newAlert]);
    setForm({ ticker: '', targetPrice: '', direction: 'above' });
    setAdding(false);
    toast.success('알림이 설정되었습니다!');
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const formatPrice = (price: number, currency: 'KRW' | 'USD') =>
    currency === 'USD' ? formatUSD(price) : formatKRW(price);

  const inputCls = "bg-input border border-border rounded px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary font-mono";

  return (
    <section id="alerts" className="py-12 border-t border-border/40">
      <div className="container">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ background: 'linear-gradient(to bottom, #ef4444, #f59e0b)' }} />
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>목표가 알림</h2>
              <p className="text-sm text-muted-foreground mt-0.5 font-mono">
                {alerts.length}개 알림 설정됨
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notifPermission !== 'granted' ? (
              <button onClick={requestPermission}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 transition-colors">
                <Bell size={14} />
                알림 권한 허용
              </button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-green-400 font-mono">
                <Bell size={12} />
                알림 활성화됨
              </div>
            )}
            <button onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium text-background"
              style={{ background: '#00d4ff' }}>
              <Plus size={14} />
              알림 추가
            </button>
          </div>
        </div>

        {/* 알림 추가 폼 */}
        {adding && (
          <div className="quant-card p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">종목 선택</label>
                <select className={`w-full ${inputCls}`} value={form.ticker}
                  onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))}>
                  <option value="">선택...</option>
                  {items.map(item => (
                    <option key={item.id} value={item.ticker}>{item.ticker} ({item.nameKr || item.name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">목표가</label>
                <input type="number" className={`w-full ${inputCls}`} placeholder="0"
                  value={form.targetPrice} onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">조건</label>
                <select className={`w-full ${inputCls}`} value={form.direction}
                  onChange={e => setForm(f => ({ ...f, direction: e.target.value as 'above' | 'below' }))}>
                  <option value="above">이상 (목표가 돌파)</option>
                  <option value="below">이하 (손절가 하회)</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={addAlert}
                  className="flex-1 px-3 py-1.5 rounded text-sm font-medium text-background"
                  style={{ background: '#00d4ff' }}>
                  저장
                </button>
                <button onClick={() => setAdding(false)}
                  className="px-3 py-1.5 rounded text-sm border border-border text-muted-foreground hover:text-foreground">
                  취소
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              * 브라우저 탭이 열려 있을 때만 알림이 동작합니다. 알림 권한을 허용해 주세요.
            </p>
          </div>
        )}

        {/* 알림 목록 */}
        {alerts.length === 0 ? (
          <div className="quant-card p-8 text-center">
            <Target size={32} className="mx-auto mb-3 text-muted-foreground opacity-40" />
            <div className="text-sm text-muted-foreground font-mono">설정된 목표가 알림이 없습니다</div>
            <div className="text-xs text-muted-foreground font-mono mt-1">목표가 또는 손절가를 설정하면 도달 시 알림을 받을 수 있습니다</div>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className={`quant-card p-3 flex items-center gap-3 ${alert.triggered ? 'opacity-60' : ''}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${alert.direction === 'above' ? 'bg-green-400' : 'bg-red-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="ticker-badge">{alert.ticker}</span>
                    <span className="text-sm text-foreground">{alert.name}</span>
                    {alert.triggered && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">도달</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">
                    {alert.direction === 'above' ? '▲ 목표가' : '▼ 손절가'} {formatPrice(alert.targetPrice, alert.currency)} {alert.direction === 'above' ? '이상' : '이하'} 시 알림
                  </div>
                </div>
                <button onClick={() => removeAlert(alert.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors rounded hover:bg-white/5 shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 안내 */}
        <div className="mt-4 quant-card p-3 flex items-start gap-2">
          <BellOff size={14} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground font-mono">
            목표가 알림은 대시보드가 열려 있는 동안 1분마다 현재가를 확인합니다. 
            브라우저를 닫으면 알림이 동작하지 않으므로, 중요한 목표가는 증권사 앱 알림과 함께 사용하세요.
          </p>
        </div>
      </div>
    </section>
  );
}
