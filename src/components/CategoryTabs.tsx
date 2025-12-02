import { TrendingUp, Zap, Sparkles, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { categories } from "@/data/mockMarkets";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  Trending: <TrendingUp className="h-4 w-4" />,
  Breaking: <Zap className="h-4 w-4" />,
  New: <Sparkles className="h-4 w-4" />,
};

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto max-w-[1320px] px-6">
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                activeCategory === category
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {iconMap[category]}
              {category}
            </button>
          ))}
          <button className="flex items-center gap-1 whitespace-nowrap px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
            More
            <ChevronDown className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  );
}
