import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { ParlayLeg, CORRELATION_WEIGHTS } from "@/types/market";

interface OddsBreakdown {
  baseOdds: number;
  correlationFactor: number;
  finalOdds: number;
  correlationPenalty: number; // percentage change
}

interface ParlayContextType {
  legs: ParlayLeg[];
  stake: number;
  addLeg: (leg: ParlayLeg) => void;
  removeLeg: (marketId: string) => void;
  setStake: (stake: number) => void;
  clearParlay: () => void;
  isInParlay: (marketId: string) => boolean;
  getOddsBreakdown: () => OddsBreakdown;
  getPotentialPayout: () => number;
}

const ParlayContext = createContext<ParlayContextType | undefined>(undefined);

// Calculate correlation weight between two markets based on categories
function getCorrelationWeight(cat1: string, cat2: string): number {
  // Same category = moderate to strong correlation
  if (cat1 === cat2) {
    // Check for high-correlation categories
    const highCorrelationCategories = ["Politics", "Crypto", "Geopolitics"];
    if (highCorrelationCategories.includes(cat1)) {
      return CORRELATION_WEIGHTS.STRONG;
    }
    return CORRELATION_WEIGHTS.MODERATE;
  }
  
  // Related categories have weak correlation
  const relatedPairs: [string, string][] = [
    ["Politics", "Geopolitics"],
    ["Crypto", "Finance"],
    ["Tech", "Crypto"],
    ["Sports", "Culture"],
  ];
  
  for (const [a, b] of relatedPairs) {
    if ((cat1 === a && cat2 === b) || (cat1 === b && cat2 === a)) {
      return CORRELATION_WEIGHTS.WEAK;
    }
  }
  
  // Different, unrelated categories = independent (slight boost)
  return CORRELATION_WEIGHTS.INDEPENDENT;
}

// Calculate pairwise correlation factor for all legs
function calculateCorrelationFactor(legs: ParlayLeg[]): number {
  if (legs.length <= 1) return 1;
  
  let factor = 1;
  
  // Calculate pairwise weights
  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      const weight = getCorrelationWeight(legs[i].category, legs[j].category);
      factor *= weight;
    }
  }
  
  return factor;
}

export function ParlayProvider({ children }: { children: React.ReactNode }) {
  const [legs, setLegs] = useState<ParlayLeg[]>([]);
  const [stake, setStake] = useState(100);

  const addLeg = useCallback((leg: ParlayLeg) => {
    setLegs((prev) => {
      const existing = prev.find((l) => l.marketId === leg.marketId);
      if (existing) {
        return prev.map((l) => (l.marketId === leg.marketId ? leg : l));
      }
      return [...prev, leg];
    });
  }, []);

  const removeLeg = useCallback((marketId: string) => {
    setLegs((prev) => prev.filter((l) => l.marketId !== marketId));
  }, []);

  const clearParlay = useCallback(() => {
    setLegs([]);
    setStake(100);
  }, []);

  const isInParlay = useCallback(
    (marketId: string) => legs.some((l) => l.marketId === marketId),
    [legs]
  );

  // Calculate odds breakdown with proper math
  const getOddsBreakdown = useCallback((): OddsBreakdown => {
    if (legs.length === 0) {
      return {
        baseOdds: 1,
        correlationFactor: 1,
        finalOdds: 1,
        correlationPenalty: 0,
      };
    }

    // Base odds = product of (1 / probability) for each leg
    // probability is stored as percentage (0-100), convert to decimal
    const baseOdds = legs.reduce((acc, leg) => {
      const decimalProb = leg.probability / 100;
      const odds = 1 / decimalProb;
      return acc * odds;
    }, 1);

    // Correlation factor from pairwise analysis
    const correlationFactor = calculateCorrelationFactor(legs);

    // Final odds = base × correlation
    const finalOdds = baseOdds * correlationFactor;

    // Calculate percentage change
    const correlationPenalty = ((correlationFactor - 1) * 100);

    return {
      baseOdds,
      correlationFactor,
      finalOdds,
      correlationPenalty,
    };
  }, [legs]);

  const getPotentialPayout = useCallback(() => {
    const { finalOdds } = getOddsBreakdown();
    return stake * finalOdds;
  }, [stake, getOddsBreakdown]);

  return (
    <ParlayContext.Provider
      value={{
        legs,
        stake,
        addLeg,
        removeLeg,
        setStake,
        clearParlay,
        isInParlay,
        getOddsBreakdown,
        getPotentialPayout,
      }}
    >
      {children}
    </ParlayContext.Provider>
  );
}

export function useParlay() {
  const context = useContext(ParlayContext);
  if (context === undefined) {
    throw new Error("useParlay must be used within a ParlayProvider");
  }
  return context;
}
