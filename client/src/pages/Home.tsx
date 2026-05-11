// DESIGN: Dark Quant Terminal - Home Page
// 로그인 여부에 따라 공개/개인 대시보드 분기
// 공개: 급등 종목 + 시장 정세 + 시장 분석 + 추천 + 매도 전략
// 로그인: 국제 정세 + 포트폴리오 + 매수 캘린더 + 목표가 알림 + 시장 분석 + 추천 + 매도 전략

import { useAuth } from '@/_core/hooks/useAuth';
import NavBar from '@/components/NavBar';
import HeroSection from '@/components/HeroSection';
import GeopoliticsSection from '@/components/GeopoliticsSection';
import PortfolioSection from '@/components/PortfolioSection';
import MarketAnalysis from '@/components/MarketAnalysis';
import RecommendSection from '@/components/RecommendSection';
import ExitStrategySection from '@/components/ExitStrategySection';
import PublicDashboard from '@/components/PublicDashboard';
import BuyCalendar from '@/components/BuyCalendar';
import PriceAlertSection from '@/components/PriceAlertSection';

function Footer() {
  return (
    <footer className="border-t border-border/40 py-8 mt-8">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <span style={{ color: '#00d4ff' }}>QUANT</span>
              <span className="text-muted-foreground"> DASHBOARD</span>
            </span>
          </div>
          <div className="text-xs text-muted-foreground font-mono text-center">
            본 대시보드는 투자 참고용 정보를 제공하며, 투자 손익에 대한 책임은 투자자 본인에게 있습니다.
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            2026.05.11 · Manus AI
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <HeroSection />

      <div className="container py-8">
        {/* 로딩 중 스켈레톤 */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-muted-foreground font-mono text-sm gap-2">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            불러오는 중...
          </div>
        )}

        {/* 비로그인 공개 대시보드 */}
        {!loading && !isAuthenticated && (
          <PublicDashboard />
        )}
      </div>

      {/* 로그인 사용자 전용 섹션 */}
      {!loading && isAuthenticated && (
        <>
          <GeopoliticsSection />
          <PortfolioSection />
          <BuyCalendar />
          <PriceAlertSection />
        </>
      )}

      {/* 공통 섹션 — 로그인 여부 무관 */}
      {!loading && (
        <>
          <MarketAnalysis />
          <RecommendSection />
          <ExitStrategySection />
        </>
      )}

      <Footer />
    </div>
  );
}
