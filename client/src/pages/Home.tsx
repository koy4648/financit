// DESIGN: Dark Quant Terminal - Home Page
// Assembles all sections: NavBar → Hero → Market Analysis → Portfolio → Recommend → Exit Strategy → Footer

import NavBar from '@/components/NavBar';
import HeroSection from '@/components/HeroSection';
import MarketAnalysis from '@/components/MarketAnalysis';
import PortfolioSection from '@/components/PortfolioSection';
import RecommendSection from '@/components/RecommendSection';
import ExitStrategySection from '@/components/ExitStrategySection';

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
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <HeroSection />
      <MarketAnalysis />
      <PortfolioSection />
      <RecommendSection />
      <ExitStrategySection />
      <Footer />
    </div>
  );
}
