import { Bookmark, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Market } from "@/types/market";
import { useParlay } from "@/context/ParlayContext";
import { formatVolume } from "@/hooks/usePolymarketData";

interface MarketCardProps {
  market: Market;
  onOpenModal: (market: Market) => void;
}

export function MarketCard({ market, onOpenModal }: MarketCardProps) {
  const { addLeg, isInParlay, removeLeg } = useParlay();
  const hasMultipleOutcomes = market.outcomes.length > 1;
  const isSingleYesNo = market.outcomes.length === 1;

  const handleYesClick = (e: React.MouseEvent, outcomeName: string, probability: number) => {
    e.stopPropagation();
    const leg = {
      marketId: market.id + "-" + outcomeName,
      marketTitle: market.title,
      outcome: outcomeName,
      probability,
      isYes: true,
      category: market.category,
    };
    if (isInParlay(leg.marketId)) {
      removeLeg(leg.marketId);
    } else {
      addLeg(leg);
    }
  };

  const handleNoClick = (e: React.MouseEvent, outcomeName: string, probability: number) => {
    e.stopPropagation();
    const leg = {
      marketId: market.id + "-" + outcomeName + "-no",
      marketTitle: market.title,
      outcome: outcomeName + " (No)",
      probability: 100 - probability,
      isYes: false,
      category: market.category,
    };
    if (isInParlay(leg.marketId)) {
      removeLeg(leg.marketId);
    } else {
      addLeg(leg);
    }
  };

  return (
    <div
      onClick={() => onOpenModal(market)}
      className="group relative cursor-pointer rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <img
          src={market.image}
          alt={market.title}
          className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0 pr-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
            {market.title}
          </h3>
        </div>
        {isSingleYesNo && (
          <div className="flex flex-col items-center flex-shrink-0">
            <span className="text-xl font-bold text-foreground">
              {market.outcomes[0].probability}%
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">chance</span>
          </div>
        )}
      </div>

      {/* Outcomes */}
      <div className="space-y-2.5">
        {hasMultipleOutcomes ? (
          market.outcomes.map((outcome) => (
            <div key={outcome.id} className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                {outcome.name}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-sm font-semibold text-foreground w-12 text-right">
                  {outcome.probability}%
                </span>
                <button
                  onClick={(e) => handleYesClick(e, outcome.name, outcome.probability)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-semibold transition-all duration-150 active:scale-95",
                    isInParlay(market.id + "-" + outcome.name)
                      ? "bg-market-yes text-primary-foreground shadow-sm"
                      : "bg-market-yes-bg text-market-yes hover:bg-market-yes hover:text-primary-foreground hover:shadow-sm"
                  )}
                >
                  Yes
                </button>
                <button
                  onClick={(e) => handleNoClick(e, outcome.name, outcome.probability)}
                  className={cn(
                    "px-2.5 py-1 rounded text-xs font-semibold transition-all duration-150 active:scale-95",
                    isInParlay(market.id + "-" + outcome.name + "-no")
                      ? "bg-market-no text-primary-foreground shadow-sm"
                      : "bg-market-no-bg text-market-no hover:bg-market-no hover:text-primary-foreground hover:shadow-sm"
                  )}
                >
                  No
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex gap-2">
            <button
              onClick={(e) => handleYesClick(e, "Yes", market.outcomes[0].probability)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98]",
                isInParlay(market.id + "-Yes")
                  ? "bg-market-yes text-primary-foreground shadow-md"
                  : "bg-market-yes-bg text-market-yes hover:bg-market-yes hover:text-primary-foreground hover:shadow-md"
              )}
            >
              Yes
            </button>
            <button
              onClick={(e) => handleNoClick(e, "Yes", market.outcomes[0].probability)}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-[0.98]",
                isInParlay(market.id + "-Yes-no")
                  ? "bg-market-no text-primary-foreground shadow-md"
                  : "bg-market-no-bg text-market-no hover:bg-market-no hover:text-primary-foreground hover:shadow-md"
              )}
            >
              No
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {market.isNew && (
            <span className="text-xs font-semibold text-market-yes">✦ NEW</span>
          )}
          <span className="font-medium">
            {market.volume || (market.volume24h && market.volume24h > 0 ? formatVolume(market.volume24h) : 'N/A')} Vol.
          </span>
          {market.isMonthly && (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Monthly
            </span>
          )}
          {market.isWeekly && (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Weekly
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-secondary"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-secondary"
          >
            <Bookmark className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
