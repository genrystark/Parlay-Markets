import { Market } from "@/types/market";
import { MarketCard } from "./MarketCard";

interface MarketGridProps {
  markets: Market[];
  onOpenModal: (market: Market) => void;
}

export function MarketGrid({ markets, onOpenModal }: MarketGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {markets.map((market) => (
        <MarketCard key={market.id} market={market} onOpenModal={onOpenModal} />
      ))}
    </div>
  );
}
