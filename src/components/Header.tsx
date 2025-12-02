import { Search, Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/logo.svg";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto max-w-[1320px] flex h-14 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 ml-0.5">
          <img src={logo} alt="Parlay Market" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-semibold text-foreground">Parlay Market</span>
        </div>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search polymarket"
              className="w-full pl-10 bg-secondary border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 mr-2 text-sm">
            <div className="text-right">
              <span className="block text-xs text-muted-foreground">Portfolio</span>
              <span className="font-semibold text-foreground">$0.00</span>
            </div>
            <div className="text-right">
              <span className="block text-xs text-muted-foreground">Cash</span>
              <span className="font-semibold text-foreground">$0.00</span>
            </div>
          </div>
          
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5">
            Deposit
          </Button>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" className="flex items-center gap-1.5 px-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-market-yes to-market-tag" />
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}
