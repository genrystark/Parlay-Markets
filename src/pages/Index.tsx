import { useState } from "react";
import { Header } from "@/components/Header";
import { CategoryTabs } from "@/components/CategoryTabs";
import { MarketGrid } from "@/components/MarketGrid";
import { MarketModal } from "@/components/MarketModal";
import { ParlayPanel } from "@/components/ParlayPanel";
import { ParlayProvider } from "@/context/ParlayContext";
import { usePolymarketData } from "@/hooks/usePolymarketData";
import { mockMarkets } from "@/data/mockMarkets";
import { Market } from "@/types/market";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function MarketPage() {
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch real data from Polymarket API
  const { markets: liveMarkets, loading, error, meta, refetch } = usePolymarketData({
    category: activeCategory,
    limit: 50,
    refreshInterval: 30000,
    includeCharts: true, // Включаем графики для модалки
  });

  // Use live data if available, otherwise fallback to mock data
  const markets = liveMarkets.length > 0 ? liveMarkets : mockMarkets;

  const handleOpenModal = (market: Market) => {
    setSelectedMarket(market);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryTabs
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      <main className="mx-auto max-w-[1320px] px-6 py-6">
        {/* Status bar */}
        {meta && (
          <div className="flex items-center justify-between mb-4 text-xs text-muted-foreground">
            <span>
              {meta.filtered} markets • {meta.fromCache ? "Cached" : "Live"} data
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={refetch}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
        )}

        {/* Error state */}
        {error && !loading && liveMarkets.length === 0 && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{error} - Showing demo data</span>
          </div>
        )}

        <div className="flex gap-6">
          {/* Market Grid */}
          <div className="flex-1 min-w-0">
            {loading && markets.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <MarketGrid markets={markets} onOpenModal={handleOpenModal} />
            )}
          </div>

          {/* Parlay Panel */}
          <aside className="hidden lg:block flex-shrink-0">
            <ParlayPanel />
          </aside>
        </div>
      </main>

      <MarketModal
        market={selectedMarket}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}

export default function Index() {
  return (
    <ParlayProvider>
      <MarketPage />
    </ParlayProvider>
  );
}
