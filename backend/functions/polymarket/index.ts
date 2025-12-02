/**
 * Polymarket Backend Fetcher + API
 * 
 * Per spec requirements:
 * 1. Fetch markets from CLOB API: GET https://clob.polymarket.com/markets
 * 2. Normalize data: prob_yes = outcome.YES.price, odds_yes = 1/prob_yes
 * 3. Cache: markets 20-30s, charts 60s
 * 4. Categories with filters: /api/markets?category=Politics&search=trump&sort=volume
 * 5. Charts: GET https://polymarket.com/api/market/{conditionId}/history with downsampling
 * 6. Rate-limit protection: ~2 req/sec, ~120 req/min, retry on 429
 * 7. NO orderbook or trades endpoints (MVP doesn't need them)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= CACHE SYSTEM =============
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const marketCache: CacheEntry<NormalizedMarket[]> = { data: [], timestamp: 0 };
const chartCache: Map<string, CacheEntry<ChartPoint[]>> = new Map();

// Cache durations
const MARKET_CACHE_DURATION_MS = 25000; // 25 seconds (20-30 range)
const CHART_CACHE_DURATION_MS = 60000; // 60 seconds

// Rate limiting settings
const CHART_REQUEST_DELAY_MS = 250; // 250ms between chart requests (200-300 range)
const MAX_REQUESTS_PER_SECOND = 2;
const MAX_REQUESTS_PER_MINUTE = 120;
const MAX_CHARTS_PER_REQUEST = 10;

// Rate limiter state
let lastRequestTime = 0;
let requestsThisSecond = 0;
let requestsThisMinute = 0;
let secondStartTime = Date.now();
let minuteStartTime = Date.now();
let lastChartRequestTime = 0;

// ============= TYPES =============
interface CLOBMarket {
  id?: string;
  market?: string;
  question?: string;
  description?: string;
  conditionId?: string;
  outcomeTokens?: string[];
  outcomes?: Array<{
    token: string;
    outcome: string;
    price: number;
  }>;
  volume24h?: number;
  volume?: number;
  liquidity?: number;
  endDate?: string;
  endDateIso?: string;
  image?: string;
  tags?: Array<{ id: string; label: string; slug: string }>;
  created_at?: string;
  active?: boolean;
  closed?: boolean;
}

interface GammaMarket {
  id: string;
  condition_id?: string;
  question: string;
  description?: string;
  slug?: string;
  end_date_iso?: string;
  active: boolean;
  closed: boolean;
  clobTokenIds?: string[];
  outcomePrices?: string;
  outcomes?: string;
  volume?: string;
  volume_24hr?: number;
  liquidity?: string;
  image?: string;
  icon?: string;
  tags?: Array<{ id: string; label: string; slug: string }>;
  created_at?: string;
}

interface ChartPoint {
  t: number; // timestamp
  p: number; // price/probability
}

interface NormalizedMarket {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  tags: string[];
  outcomes: {
    yes: {
      p: number; // price/probability
      odds: number;
    };
    no: {
      p: number; // price/probability
      odds: number;
    };
  };
  volume: number;
  liquidity: number;
  endDate: string;
  conditionId: string;
  chart?: ChartPoint[];
}

// ============= RATE LIMITER =============
function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Reset second counter
  if (now - secondStartTime > 1000) {
    requestsThisSecond = 0;
    secondStartTime = now;
  }
  
  // Reset minute counter
  if (now - minuteStartTime > 60000) {
    requestsThisMinute = 0;
    minuteStartTime = now;
  }
  
  // Check limits
  if (requestsThisSecond >= MAX_REQUESTS_PER_SECOND) {
    console.log('Rate limit: Too many requests per second');
    return false;
  }
  
  if (requestsThisMinute >= MAX_REQUESTS_PER_MINUTE) {
    console.log('Rate limit: Too many requests per minute');
    return false;
  }
  
  return true;
}

async function rateLimitedFetch(url: string, retries: number = 3): Promise<Response | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    if (!checkRateLimit()) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
    
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minDelay = 1000 / MAX_REQUESTS_PER_SECOND; // 500ms between requests
    
    if (timeSinceLastRequest < minDelay) {
      await new Promise(resolve => setTimeout(resolve, minDelay - timeSinceLastRequest));
    }
    
    lastRequestTime = Date.now();
    requestsThisSecond++;
    requestsThisMinute++;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ParlayMarket/1.0',
        },
      });
      
      // Handle 429 rate limit response
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
        console.log(`Rate limited (429). Retrying after ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      console.error('Fetch error:', error);
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  return null;
}

// ============= CATEGORY INFERENCE =============
function inferCategory(market: CLOBMarket | GammaMarket): string {
  const question = 'question' in market ? market.question : market.market || '';
  const description = market.description || '';
  const tags = market.tags?.map(t => t.label.toLowerCase()) || [];
  const text = `${question} ${description} ${tags.join(' ')}`.toLowerCase();
  
  // Politics
  if (tags.some(t => t.includes('politic') || t.includes('election')) || 
      text.includes('trump') || text.includes('biden') || text.includes('harris') ||
      text.includes('election') || text.includes('president') || text.includes('congress') || 
      text.includes('senate') || text.includes('governor') || text.includes('democrat') ||
      text.includes('republican') || text.includes('vote') || text.includes('ballot')) {
    return 'Politics';
  }
  
  // Crypto
  if (tags.some(t => t.includes('crypto') || t.includes('defi')) || 
      text.includes('bitcoin') || text.includes('ethereum') || 
      text.includes('crypto') || text.includes('btc') || text.includes('eth') || 
      text.includes('bnb') || text.includes('solana') || text.includes('blockchain') ||
      text.includes('defi') || text.includes('nft') || text.includes('web3')) {
    return 'Crypto';
  }
  
  // Sports
  if (tags.some(t => t.includes('sport')) || 
      text.includes('nfl') || text.includes('nba') || text.includes('mlb') ||
      text.includes('soccer') || text.includes('football') || text.includes('basketball') ||
      text.includes('tennis') || text.includes('ufc') || text.includes('boxing') ||
      text.includes('f1') || text.includes('formula') || text.includes('world cup') ||
      text.includes('super bowl') || text.includes('champion')) {
    return 'Sports';
  }
  
  // Finance / Economy
  if (tags.some(t => t.includes('finance') || t.includes('economy')) ||
      text.includes('stock') || text.includes('market') || text.includes('fed') || 
      text.includes('interest rate') || text.includes('inflation') || text.includes('gdp') ||
      text.includes('recession') || text.includes('s&p') || text.includes('nasdaq') ||
      text.includes('dow') || text.includes('treasury') || text.includes('unemployment')) {
    return 'Finance';
  }
  
  // Geopolitics / World
  if (tags.some(t => t.includes('geopolitic') || t.includes('world')) ||
      text.includes('war') || text.includes('iran') || text.includes('israel') || 
      text.includes('ukraine') || text.includes('russia') || text.includes('china') ||
      text.includes('nato') || text.includes('military') || text.includes('sanctions') ||
      text.includes('invasion') || text.includes('conflict')) {
    return 'Geopolitics';
  }
  
  // Tech / AI
  if (tags.some(t => t.includes('tech') || t.includes('ai')) || 
      text.includes(' ai ') || text.includes('artificial intelligence') ||
      text.includes('openai') || text.includes('chatgpt') || text.includes('gpt') ||
      text.includes('google') || text.includes('apple') || text.includes('meta') ||
      text.includes('microsoft') || text.includes('elon') || text.includes('musk') || 
      text.includes('spacex') || text.includes('tesla') || text.includes('robot')) {
    return 'Tech';
  }
  
  // Culture / Entertainment
  if (tags.some(t => t.includes('culture') || t.includes('entertainment')) ||
      text.includes('movie') || text.includes('oscar') || text.includes('grammy') || 
      text.includes('celebrity') || text.includes('music') || text.includes('entertainment') ||
      text.includes('netflix') || text.includes('disney') || text.includes('award')) {
    return 'Culture';
  }
  
  // Science
  if (tags.some(t => t.includes('science')) ||
      text.includes('nasa') || text.includes('space') || text.includes('climate') ||
      text.includes('vaccine') || text.includes('research') || text.includes('discovery')) {
    return 'Science';
  }
  
  // Check if market is new (created within last 7 days)
  if (market.created_at) {
    const createdDate = new Date(market.created_at);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (createdDate > weekAgo) {
      return 'New';
    }
  }
  
  return 'Other';
}

// ============= NORMALIZE FROM CLOB =============
function normalizeFromCLOB(market: CLOBMarket): NormalizedMarket | null {
  try {
    // Extract YES/NO outcomes according to spec: prob_yes = outcome.YES.price
    let yesOutcome = market.outcomes?.find(o => 
      o.outcome === 'YES' || o.outcome === 'yes' || o.outcome === 'Yes'
    );
    let noOutcome = market.outcomes?.find(o => 
      o.outcome === 'NO' || o.outcome === 'no' || o.outcome === 'No'
    );
    
    // Fallback: use first two outcomes if YES/NO not found
    if (!yesOutcome && market.outcomes && market.outcomes.length >= 2) {
      yesOutcome = market.outcomes[0];
      noOutcome = market.outcomes[1];
    }
    
    // According to spec: prob_yes = outcome.YES.price, prob_no = outcome.NO.price
    const probYes = yesOutcome?.price ?? 0.5;
    const probNo = noOutcome?.price ?? 0.5;
    
    // Ensure probabilities are valid
    const probYesNormalized = Math.max(0.01, Math.min(0.99, probYes));
    const probNoNormalized = Math.max(0.01, Math.min(0.99, probNo));
    
    // According to spec: odds_yes = 1 / prob_yes, odds_no = 1 / prob_no
    const oddsYes = 1 / probYesNormalized;
    const oddsNo = 1 / probNoNormalized;
    
    const volume24h = market.volume24h || 0;
    const totalVolume = market.volume || 0;
    const liquidity = market.liquidity || 0;
    
    const endDate = market.endDateIso || market.endDate || '';
    
    // Check if market is new (created within last 3 days)
    let isNew = false;
    if (market.created_at) {
      const createdDate = new Date(market.created_at);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      isNew = createdDate > threeDaysAgo;
    }
    
    const image = market.image || 
      `https://polymarket.com/images/markets/${market.id || 'default'}.png`;
    
    const conditionId = market.conditionId || market.id || '';
    
    return {
      id: market.id || market.conditionId || '',
      title: market.question || market.market || 'Unknown Market',
      description: market.description || '',
      image,
      category: inferCategory(market),
      tags: market.tags?.map(t => t.label) || [],
      outcomes: {
        yes: {
          p: probYesNormalized,
          odds: Math.round(oddsYes * 100) / 100,
        },
        no: {
          p: probNoNormalized,
          odds: Math.round(oddsNo * 100) / 100,
        },
      },
      volume: volume24h || totalVolume,
      liquidity,
      endDate,
      conditionId,
    };
  } catch (error) {
    console.error('Error normalizing CLOB market:', error, market);
    return null;
  }
}

// ============= NORMALIZE FROM GAMMA (FALLBACK) =============
function normalizeFromGamma(market: GammaMarket): NormalizedMarket | null {
  try {
    let yesPrice = 0.5;
    let noPrice = 0.5;

    // Parse outcome prices according to spec: prob_yes = outcome.YES.price
    try {
      if (market.outcomePrices) {
        const prices = JSON.parse(market.outcomePrices);
        if (Array.isArray(prices) && prices.length >= 2) {
          // prices[0] is YES, prices[1] is NO
          yesPrice = parseFloat(prices[0]) || 0.5;
          noPrice = parseFloat(prices[1]) || 0.5;
        }
      }
    } catch (e) {
      // Silent fail, use defaults
    }

    // Ensure probabilities are valid
    yesPrice = Math.max(0.01, Math.min(0.99, yesPrice));
    noPrice = Math.max(0.01, Math.min(0.99, noPrice));

    // According to spec: odds_yes = 1 / prob_yes, odds_no = 1 / prob_no
    const yesOdds = 1 / yesPrice;
    const noOdds = 1 / noPrice;

    const volume24h = market.volume_24hr || 0;
    const totalVolume = parseFloat(market.volume || '0') || 0;
    const liquidity = parseFloat(market.liquidity || '0') || 0;

    let isNew = false;
    if (market.created_at) {
      const createdDate = new Date(market.created_at);
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      isNew = createdDate > threeDaysAgo;
    }

    const image = market.image || market.icon || 
      `https://polymarket.com/images/markets/${market.slug || market.id}.png`;

    return {
      id: market.id,
      title: market.question,
      description: market.description || '',
      image,
      category: inferCategory(market),
      tags: market.tags?.map(t => t.label) || [],
      outcomes: {
        yes: {
          p: yesPrice,
          odds: Math.round(yesOdds * 100) / 100,
        },
        no: {
          p: noPrice,
          odds: Math.round(noOdds * 100) / 100,
        },
      },
      volume: volume24h || totalVolume,
      liquidity,
      endDate: market.end_date_iso || '',
      conditionId: market.condition_id || market.id,
    };
  } catch (error) {
    console.error('Error normalizing Gamma market:', error, market.id);
    return null;
  }
}

// ============= MARKET FETCHING =============
// Per spec: GET https://clob.polymarket.com/markets
// - Update every 20-30 seconds
// - Do NOT fetch markets one by one
// - NO orderbook or trades endpoints (MVP doesn't need them)
async function fetchPolymarketData(): Promise<NormalizedMarket[]> {
  console.log('Fetching fresh data from Polymarket CLOB API...');
  
  try {
    // Try CLOB API first (as per spec: GET https://clob.polymarket.com/markets)
    // Note: CLOB API might return different structure, so we have fallback
    const clobResponse = await rateLimitedFetch('https://clob.polymarket.com/markets');
    
    if (clobResponse && clobResponse.ok) {
      const clobData = await clobResponse.json();
      console.log(`Received ${Array.isArray(clobData) ? clobData.length : 'non-array'} markets from CLOB API`);
      
      // Handle different possible response formats
      const marketsArray = Array.isArray(clobData) ? clobData : (clobData.data || []);
      
      if (marketsArray.length > 0) {
        const normalizedMarkets = marketsArray
          .map((m: CLOBMarket) => normalizeFromCLOB(m))
          .filter((m): m is NormalizedMarket => {
            if (m === null) return false;
            // Filter out markets with no volume or invalid prices
            const hasVolume = m.volume > 0;
            const hasValidPrices = m.outcomes.yes.p > 0.02 && m.outcomes.yes.p < 0.98;
            return hasVolume && hasValidPrices;
          })
          .sort((a, b) => b.volume - a.volume);
        
        console.log(`Normalized ${normalizedMarkets.length} markets from CLOB API`);
        if (normalizedMarkets.length > 0) {
          return normalizedMarkets;
        }
      }
    }
    
    // Fallback to Gamma API if CLOB fails or returns no valid markets
    // This is a more reliable source for market metadata
    console.log('CLOB API unavailable, using Gamma API as fallback...');
    const gammaResponse = await rateLimitedFetch(
      'https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=500'
    );
    
    if (gammaResponse && gammaResponse.ok) {
      const gammaData = await gammaResponse.json();
      console.log(`Received ${Array.isArray(gammaData) ? gammaData.length : 'non-array'} markets from Gamma API`);
      
      const markets: GammaMarket[] = Array.isArray(gammaData) ? gammaData : [];
      
      const normalizedMarkets = markets
        .map(normalizeFromGamma)
        .filter((m): m is NormalizedMarket => {
          if (m === null) return false;
          const hasVolume = m.volume > 0;
          const hasValidPrices = m.outcomes.yes.p > 0.02 && m.outcomes.yes.p < 0.98;
          return hasVolume && hasValidPrices;
        })
        .sort((a, b) => b.volume - a.volume);
      
      console.log(`Normalized ${normalizedMarkets.length} markets from Gamma API`);
      return normalizedMarkets;
    }
    
    throw new Error('Both CLOB and Gamma API failed');
  } catch (error) {
    console.error('Error fetching Polymarket data:', error);
    throw error;
  }
}

// Get markets with caching
async function getMarkets(): Promise<{ markets: NormalizedMarket[]; fromCache: boolean }> {
  const now = Date.now();
  
  if (marketCache.data.length > 0 && (now - marketCache.timestamp) < MARKET_CACHE_DURATION_MS) {
    console.log('Returning cached market data');
    return { markets: marketCache.data, fromCache: true };
  }

  try {
    const freshMarkets = await fetchPolymarketData();
    marketCache.data = freshMarkets;
    marketCache.timestamp = now;
    return { markets: freshMarkets, fromCache: false };
  } catch (error) {
    if (marketCache.data.length > 0) {
      console.log('API fetch failed, returning stale cache');
      return { markets: marketCache.data, fromCache: true };
    }
    throw error;
  }
}

// ============= CHART FETCHING =============
// Per spec: GET https://polymarket.com/api/market/{conditionId}/history
// - Limit: 24h or 7d
// - Downsample (compress points)
// - Stagger: 200-300ms delay between requests
// - Cache: 60 seconds
async function fetchChartData(conditionId: string): Promise<ChartPoint[]> {
  // Check cache first (60 second TTL per spec)
  const cached = chartCache.get(conditionId);
  if (cached && (Date.now() - cached.timestamp) < CHART_CACHE_DURATION_MS) {
    return cached.data;
  }
  
  try {
    // Fetch market history (24h limit per spec)
    const response = await rateLimitedFetch(
      `https://polymarket.com/api/market/${conditionId}/history?interval=24h`
    );
    
    if (!response || !response.ok) {
      // Return empty chart if fetch fails, but keep cached data if available
      return cached?.data || [];
    }
    
    const data = await response.json();
    
    // Parse history data and downsample
    let chartPoints: ChartPoint[] = [];
    
    if (Array.isArray(data)) {
      // Parse all points
      chartPoints = data
        .filter((point: any) => point.timestamp || point.t)
        .map((point: any) => {
          const timestamp = point.timestamp || point.t;
          const price = point.price || point.p || point.yesPrice || 0.5;
          return {
            t: typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime() / 1000,
            p: Math.max(0.01, Math.min(0.99, price)),
          };
        })
        .sort((a, b) => a.t - b.t); // Sort by timestamp
      
      // Downsample: compress points to max 48 for performance
      const MAX_POINTS = 48;
      if (chartPoints.length > MAX_POINTS) {
        const step = Math.ceil(chartPoints.length / MAX_POINTS);
        const downsampled: ChartPoint[] = [];
        for (let i = 0; i < chartPoints.length; i += step) {
          downsampled.push(chartPoints[i]);
        }
        // Always include last point
        if (chartPoints.length > 0 && downsampled[downsampled.length - 1]?.t !== chartPoints[chartPoints.length - 1]?.t) {
          downsampled.push(chartPoints[chartPoints.length - 1]);
        }
        chartPoints = downsampled.slice(0, MAX_POINTS);
      }
    }
    
    // Cache the result (60 second TTL per spec)
    chartCache.set(conditionId, { data: chartPoints, timestamp: Date.now() });
    
    return chartPoints;
  } catch (error) {
    console.error('Error fetching chart data:', error);
    // Return cached data if available, otherwise empty array
    return cached?.data || [];
  }
}

// Fetch charts for multiple markets with staggered requests
async function fetchChartsForMarkets(markets: NormalizedMarket[], maxCharts: number = MAX_CHARTS_PER_REQUEST): Promise<void> {
  const marketsToFetch = markets.slice(0, maxCharts);
  
  for (const market of marketsToFetch) {
    // Check if we already have cached chart data
    const cached = chartCache.get(market.conditionId);
    if (cached && (Date.now() - cached.timestamp) < CHART_CACHE_DURATION_MS) {
      market.chart = cached.data;
      continue;
    }
    
    // Fetch with rate limiting and stagger delay
    const now = Date.now();
    const timeSinceLastChart = now - lastChartRequestTime;
    if (timeSinceLastChart < CHART_REQUEST_DELAY_MS) {
      await new Promise(resolve => setTimeout(resolve, CHART_REQUEST_DELAY_MS - timeSinceLastChart));
    }
    
    lastChartRequestTime = Date.now();
    const chart = await fetchChartData(market.conditionId);
    market.chart = chart;
    
    // Additional delay between requests
    await new Promise(resolve => setTimeout(resolve, CHART_REQUEST_DELAY_MS));
  }
}

// ============= FILTERING =============
function filterMarkets(
  markets: NormalizedMarket[],
  params: {
    category?: string;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
  }
): NormalizedMarket[] {
  let filtered = [...markets];

  // Filter by category
  if (params.category && params.category !== 'All' && params.category !== 'Trending') {
    const categoryLower = params.category.toLowerCase();
    
    if (categoryLower === 'breaking') {
      filtered = filtered
        .filter(m => m.volume > 10000)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 20);
    } else if (categoryLower === 'new') {
      // Filter new markets (you might want to add isNew property)
      filtered = filtered;
    } else {
      filtered = filtered.filter(m => 
        m.category.toLowerCase() === categoryLower
      );
    }
  }

  // Filter by search
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(searchLower) ||
      m.description.toLowerCase().includes(searchLower) ||
      m.tags.some(t => t.toLowerCase().includes(searchLower))
    );
  }

  // Sort
  switch (params.sort) {
    case 'volume':
      filtered.sort((a, b) => b.volume - a.volume);
      break;
    case 'liquidity':
      filtered.sort((a, b) => b.liquidity - a.liquidity);
      break;
    case 'newest':
      filtered.sort((a, b) => b.volume - a.volume);
      break;
    case 'ending':
      filtered.sort((a, b) => {
        const dateA = a.endDate ? new Date(a.endDate).getTime() : Infinity;
        const dateB = b.endDate ? new Date(b.endDate).getTime() : Infinity;
        return dateA - dateB;
      });
      break;
    default:
      filtered.sort((a, b) => b.volume - a.volume);
  }

  // Pagination
  const limit = Math.min(params.limit || 100, 500);
  const offset = params.offset || 0;
  filtered = filtered.slice(offset, offset + limit);

  return filtered;
}

// ============= MAIN HANDLER =============
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Parse params from both URL and body
    let bodyParams: Record<string, any> = {};
    if (req.method === 'POST') {
      try {
        const body = await req.text();
        if (body) {
          bodyParams = JSON.parse(body);
        }
      } catch (e) {
        // Ignore body parse errors
      }
    }
    
    const params = {
      category: bodyParams.category || url.searchParams.get('category') || undefined,
      search: bodyParams.search || url.searchParams.get('search') || undefined,
      sort: bodyParams.sort || url.searchParams.get('sort') || undefined,
      limit: bodyParams.limit || parseInt(url.searchParams.get('limit') || '100'),
      offset: bodyParams.offset || parseInt(url.searchParams.get('offset') || '0'),
      includeCharts: bodyParams.includeCharts || url.searchParams.get('charts') === 'true',
    };

    if (params.limit > 500) {
      return new Response(
        JSON.stringify({ success: false, error: 'Limit cannot exceed 500' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (params.search && params.search.length > 200) {
      params.search = params.search.slice(0, 200);
    }

    // Get markets
    const { markets, fromCache } = await getMarkets();
    const filteredMarkets = filterMarkets(markets, params);

    // Fetch charts if requested (with rate limiting)
    if (params.includeCharts) {
      await fetchChartsForMarkets(filteredMarkets, MAX_CHARTS_PER_REQUEST);
    }

    // Calculate category counts
    const categoryCounts: Record<string, number> = {};
    markets.forEach(m => {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
    });

    // Add special categories
    categoryCounts['Trending'] = Math.min(markets.length, 50);
    categoryCounts['Breaking'] = markets.filter(m => m.volume > 10000).length;

    // Transform to match frontend expected format
    const transformedMarkets = filteredMarkets.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      image: m.image,
      category: m.category,
      tags: m.tags,
      outcomes: {
        yes: {
          price: m.outcomes.yes.p,
          probability: Math.round(m.outcomes.yes.p * 100),
          odds: m.outcomes.yes.odds,
        },
        no: {
          price: m.outcomes.no.p,
          probability: Math.round(m.outcomes.no.p * 100),
          odds: m.outcomes.no.odds,
        },
      },
      volume24h: m.volume,
      totalVolume: m.volume,
      liquidity: m.liquidity,
      endDate: m.endDate,
      conditionId: m.conditionId,
      active: true,
      isNew: false,
      chart: m.chart,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: transformedMarkets,
        meta: {
          total: markets.length,
          filtered: filteredMarkets.length,
          fromCache,
          cacheAge: fromCache ? Date.now() - marketCache.timestamp : 0,
          categoryCounts,
          categories: Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a]),
        },
      }),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=20',
        },
      }
    );
  } catch (error) {
    console.error('Error in polymarket function:', error);
    
    if (marketCache.data.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          data: marketCache.data.slice(0, 100).map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            image: m.image,
            category: m.category,
            tags: m.tags,
            outcomes: {
              yes: {
                price: m.outcomes.yes.p,
                probability: Math.round(m.outcomes.yes.p * 100),
                odds: m.outcomes.yes.odds,
              },
              no: {
                price: m.outcomes.no.p,
                probability: Math.round(m.outcomes.no.p * 100),
                odds: m.outcomes.no.odds,
              },
            },
            volume24h: m.volume,
            totalVolume: m.volume,
            liquidity: m.liquidity,
            endDate: m.endDate,
            conditionId: m.conditionId,
            active: true,
            isNew: false,
            chart: m.chart,
          })),
          meta: {
            total: marketCache.data.length,
            filtered: Math.min(marketCache.data.length, 100),
            fromCache: true,
            error: 'Using cached data due to API error',
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch market data',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});