import { X, Trash2, Calculator, Wallet, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useParlay } from "@/context/ParlayContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

function AnimatedNumber({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  
  useEffect(() => {
    const duration = 300;
    const startValue = displayValue;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * easeOut;
      
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);
  
  return <>{displayValue.toFixed(decimals)}</>;
}

export function ParlayPanel() {
  const {
    legs,
    stake,
    setStake,
    removeLeg,
    clearParlay,
    getOddsBreakdown,
    getPotentialPayout,
  } = useParlay();

  const { baseOdds, correlationFactor, finalOdds, correlationPenalty } = getOddsBreakdown();
  const payout = getPotentialPayout();
  const profit = payout - stake;

  return (
    <div className="sticky top-20 h-fit w-[320px] rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Parlay Builder</h2>
        {legs.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearParlay}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="p-4">
        {/* Empty State */}
        {legs.length === 0 && (
          <div className="py-10 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-secondary flex items-center justify-center">
              <Calculator className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Select YES or NO to add legs
            </p>
            <p className="text-xs text-muted-foreground">
              to your parlay
            </p>
          </div>
        )}

        {/* Parlay Legs */}
        {legs.length > 0 && (
          <>
            <div className="space-y-2 mb-4 max-h-[200px] overflow-y-auto">
              {legs.map((leg, index) => (
                <div
                  key={leg.marketId}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/70 animate-in slide-in-from-right-2 duration-150"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div
                    className={cn(
                      "w-1 self-stretch rounded-full flex-shrink-0",
                      leg.isYes ? "bg-market-yes" : "bg-market-no"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                      {leg.marketTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                          leg.isYes
                            ? "bg-market-yes-bg text-market-yes"
                            : "bg-market-no-bg text-market-no"
                        )}
                      >
                        {leg.isYes ? "YES" : "NO"}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {leg.probability}% → {(1 / (leg.probability / 100)).toFixed(2)}x
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLeg(leg.marketId)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-background flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Odds Breakdown Box */}
            <div className="rounded-lg border border-border overflow-hidden mb-4">
              {/* Base Odds */}
              <div className="p-3 bg-secondary/30 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Base Odds</span>
                  <span className="text-sm font-semibold text-foreground">
                    <AnimatedNumber value={baseOdds} />x
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {legs.length} {legs.length === 1 ? "selection" : "selections"} multiplied
                </p>
              </div>

              {/* Correlation Factor */}
              <div className="p-3 bg-secondary/30 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Correlation Factor</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <Info className="h-3 w-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[240px] text-xs">
                        <p className="font-medium mb-1">Formula:</p>
                        <p className="font-mono text-[10px] mb-2">
                          FinalOdds = Π(1/Pi) × Π(weight)
                        </p>
                        <p>
                          Independent odds multiplied together, adjusted by correlation factor to prevent unrealistic payouts.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                        correlationPenalty > 0
                          ? "bg-market-yes-bg text-market-yes"
                          : correlationPenalty < 0
                          ? "bg-market-no-bg text-market-no"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {correlationPenalty >= 0 ? "+" : ""}
                      {correlationPenalty.toFixed(1)}%
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      <AnimatedNumber value={correlationFactor} />
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {correlationPenalty > 0
                    ? "Boost: independent markets"
                    : correlationPenalty < 0
                    ? "Penalty: correlated markets"
                    : "Neutral correlation"}
                </p>
              </div>

              {/* Final Odds */}
              <div className="p-3 bg-primary/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Final Odds</span>
                  <span className="text-xl font-bold text-primary">
                    <AnimatedNumber value={finalOdds} />x
                  </span>
                </div>
              </div>
            </div>

            {/* Stake Input */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Stake</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value) || 0)}
                    className="w-24 h-9 pl-7 text-right text-sm font-medium"
                  />
                </div>
              </div>
              <Slider
                value={[stake]}
                onValueChange={(value) => setStake(value[0])}
                max={1000}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$0</span>
                <span>$1,000</span>
              </div>
            </div>

            {/* Payout Summary */}
            <div className="space-y-2 mb-4 p-3 rounded-lg bg-gradient-to-br from-market-yes/10 to-market-yes/5 border border-market-yes/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Potential Payout</span>
                <span className="text-lg font-bold text-foreground">
                  $<AnimatedNumber value={payout} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Potential Profit</span>
                <span className="text-sm font-semibold text-market-yes">
                  +$<AnimatedNumber value={profit} />
                </span>
              </div>
            </div>

            {/* Place Parlay Button */}
            <Button
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
              disabled
            >
              <Wallet className="h-4 w-4 mr-2" />
              Place Parlay
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Connect wallet to place parlays
            </p>
          </>
        )}
      </div>
    </div>
  );
}
