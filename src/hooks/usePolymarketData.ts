import { useState, useEffect, useCallback } from "react";
import { invokeFunction } from "@/lib/api-client";
import { Market, ChartPoint } from "@/types/market";

interface PolymarketOutcomes {
  yes: {
    price: number;
    probability: number;
    odds: number;
  };
  no: {
    price: number;
    probability: number;
    odds: number;
  };
}

interface PolymarketMarket {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  tags: string[];
  outcomes: PolymarketOutcomes;
  volume24h: number;
  totalVolume: number;
  liquidity: number;
  endDate: string;
  conditionId: string;
  active: boolean;
  isNew: boolean;
  chart?: ChartPoint[];
}

interface ApiResponse {
  success: boolean;
  data?: PolymarketMarket[];
  meta?: {
    total: number;
    filtered: number;
    fromCache: boolean;
    cacheAge: number;
    categoryCounts: Record<string, number>;
    categories: string[];
  };
  error?: string;
}

// Format volume for display
export function formatVolume(vol: number): string {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(0)}k`;
  return `$${vol.toFixed(0)}`;
}

// Format date for display
function formatDate(dateStr: string): string {
  if (!dateStr) return "TBD";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "TBD";
  }
}

// Convert Polymarket API data to our Market format
function convertToMarket(pm: PolymarketMarket): Market {
  const yesProb = Math.round(pm.outcomes.yes.probability);
  
  // Determine special tags
  let tag: string | undefined;
  if (pm.isNew) tag = "NEW";
  else if (pm.volume24h > 50000) tag = "HOT";

  // Check date proximity
  const endDate = pm.endDate ? new Date(pm.endDate) : null;
  const now = new Date();
  const isMonthly = endDate ? endDate.getMonth() === now.getMonth() && endDate.getFullYear() === now.getFullYear() : false;
  const isWeekly = endDate ? (endDate.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000 && endDate > now : false;

  return {
    id: pm.id,
    title: pm.title,
    description: pm.description,
    image: pm.image || "https://polymarket.com/images/default-market.png",
    category: pm.category,
    tag,
    tags: pm.tags,
    outcomes: [
      {
        id: `${pm.id}-yes`,
        name: "Yes",
        probability: yesProb,
      },
    ],
    volume: formatVolume(pm.volume24h),
    volume24h: pm.volume24h,
    totalVolume: pm.totalVolume,
    liquidity: pm.liquidity,
    endDate: formatDate(pm.endDate),
    conditionId: pm.conditionId,
    isNew: pm.isNew,
    isMonthly,
    isWeekly,
    rawOutcomes: pm.outcomes,
    chart: pm.chart,
  };
}

interface UsePolymarketDataOptions {
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
  refreshInterval?: number;
  includeCharts?: boolean;
}

interface UsePolymarketDataReturn {
  markets: Market[];
  loading: boolean;
  error: string | null;
  meta: ApiResponse["meta"] | null;
  refetch: () => Promise<void>;
}

export function usePolymarketData(options: UsePolymarketDataOptions = {}): UsePolymarketDataReturn {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);

  const { 
    category, 
    search, 
    sort, 
    limit = 100, 
    refreshInterval = 30000,
    includeCharts = false 
  } = options;

  const fetchMarkets = useCallback(async () => {
    try {
      console.log("Fetching markets from polymarket edge function...");
      
      // Build request body
      const requestBody = {
        category: category && category !== "Trending" && category !== "All" ? category : undefined,
        search: search || undefined,
        sort: sort || undefined,
        limit,
        includeCharts
      };

        const data = await invokeFunction("polymarket", {
          body: requestBody,
        });

        console.log("Received response:", data?.success, "markets:", data?.data?.length);

        const response = data as ApiResponse;
      
        if (!response || !response.success) {
          throw new Error(response?.error || "API returned error");
        }

        if (response.data && response.data.length > 0) {
        let convertedMarkets = response.data.map(convertToMarket);
        
        // Apply client-side filtering as backup for categories
        if (category && category !== "Trending" && category !== "All" && category !== "Breaking" && category !== "New") {
          const categoryLower = category.toLowerCase();
          convertedMarkets = convertedMarkets.filter(m => 
            m.category.toLowerCase() === categoryLower
          );
        }
        
        if (search) {
          const searchLower = search.toLowerCase();
          convertedMarkets = convertedMarkets.filter(m => 
            m.title.toLowerCase().includes(searchLower) ||
            m.description?.toLowerCase().includes(searchLower) ||
            m.tags?.some(t => t.toLowerCase().includes(searchLower))
          );
        }
        
        console.log("Converted markets:", convertedMarkets.length);
        setMarkets(convertedMarkets.slice(0, limit));
        setMeta(response.meta || null);
        setError(null);
      } else {
        console.log("No markets returned from API");
        setError("No markets available");
      }
    } catch (err) {
      console.error("Error fetching markets:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch markets");
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, limit, includeCharts]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchMarkets();
  }, [fetchMarkets]);

  // Polling for updates
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(fetchMarkets, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMarkets, refreshInterval]);

  return {
    markets,
    loading,
    error,
    meta,
    refetch: fetchMarkets,
  };
}
