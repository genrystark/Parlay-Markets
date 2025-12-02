export interface MarketOutcome {
  id: string;
  name: string;
  probability: number;
}

export interface RawOutcomes {
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

export interface ChartPoint {
  t: number; // timestamp
  p: number; // price/probability
}

export interface Market {
  id: string;
  title: string;
  description?: string;
  image: string;
  category: string;
  tag?: string;
  tags?: string[];
  outcomes: MarketOutcome[];
  volume: string;
  volume24h?: number;
  totalVolume?: number;
  liquidity?: number;
  endDate: string;
  conditionId?: string;
  isNew?: boolean;
  isMonthly?: boolean;
  isWeekly?: boolean;
  rawOutcomes?: RawOutcomes;
  chart?: ChartPoint[];
}

export interface ParlayLeg {
  marketId: string;
  marketTitle: string;
  outcome: string;
  probability: number;
  isYes: boolean;
  category: string;
}

export interface ParlayState {
  legs: ParlayLeg[];
  stake: number;
}

// Correlation weights
export const CORRELATION_WEIGHTS = {
  INDEPENDENT: 1.05,      // Different categories - slight boost
  WEAK: 1.00,             // Very different topics
  MODERATE: 0.85,         // Same category
  STRONG: 0.70,           // Same theme/subtopic
  VERY_STRONG: 0.50,      // Highly correlated
} as const;
