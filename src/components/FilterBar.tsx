import { Search, SlidersHorizontal, Bookmark, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { subFilters } from "@/data/mockMarkets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightArrow, setShowRightArrow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      setShowRightArrow(el.scrollWidth > el.clientWidth);
    }
  }, []);

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" });
  };

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto max-w-[1320px] flex items-center gap-3 px-4 py-2.5">
        {/* Search */}
        <div className="relative w-44">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="w-full pl-10 h-9 bg-secondary border-0 text-sm"
          />
        </div>

        {/* Filter Icon */}
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
        </Button>

        {/* Bookmark */}
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
          <Bookmark className="h-4 w-4" />
        </Button>

        {/* Divider */}
        <div className="h-5 w-px bg-border" />

        {/* Sub Filters */}
        <div className="relative flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide"
          >
            {subFilters.map((filter) => (
              <button
                key={filter}
                onClick={() => onFilterChange(filter)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
          {showRightArrow && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-gradient-to-l from-card via-card to-transparent pl-4"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
