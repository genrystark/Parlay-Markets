import { X, TrendingUp, BarChart3, BookOpen, Clock, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Market } from "@/types/market";
import { cn } from "@/lib/utils";
import { useParlay } from "@/context/ParlayContext";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatVolume } from "@/hooks/usePolymarketData";

interface MarketModalProps {
  market: Market | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarketModal({ market, open, onOpenChange }: MarketModalProps) {
  const { addLeg, isInParlay, removeLeg } = useParlay();

  if (!market) return null;

  const handleYesClick = (outcomeName: string, probability: number) => {
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

  const handleNoClick = (outcomeName: string, probability: number) => {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start gap-4">
            <img
              src={market.image}
              alt={market.title}
              className="h-16 w-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-foreground">
                {market.title}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>
                  {market.volume || (market.volume24h && market.volume24h > 0 ? formatVolume(market.volume24h) : 'N/A')} Vol.
                </span>
                <span>•</span>
                <span>Ends {market.endDate}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent px-6 gap-4">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Chart
            </TabsTrigger>
            <TabsTrigger
              value="orderbook"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Orderbook
            </TabsTrigger>
            <TabsTrigger
              value="trades"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Trades
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Info
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-6 pt-4">
            <div className="space-y-4">
              {/* Outcomes */}
              <div className="space-y-3">
                {market.outcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">
                        {outcome.name}
                      </span>
                      <span className="text-lg font-semibold text-foreground">
                        {outcome.probability}%
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleYesClick(outcome.name, outcome.probability)}
                        className={cn(
                          "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                          isInParlay(market.id + "-" + outcome.name)
                            ? "bg-market-yes text-primary-foreground"
                            : "bg-market-yes-bg text-market-yes hover:bg-market-yes hover:text-primary-foreground"
                        )}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleNoClick(outcome.name, outcome.probability)}
                        className={cn(
                          "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                          isInParlay(market.id + "-" + outcome.name + "-no")
                            ? "bg-market-no text-primary-foreground"
                            : "bg-market-no-bg text-market-no hover:bg-market-no hover:text-primary-foreground"
                        )}
                      >
                        No
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">
                  Market Description
                </h4>
                <p className="text-sm text-muted-foreground">
                  This market will resolve to "Yes" if the condition is met by the end date,
                  otherwise it will resolve to "No".
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div>
                  <span className="text-xs text-muted-foreground block">Volume 24h</span>
                  <span className="text-sm font-medium text-foreground">
                    {market.volume || (market.volume24h && market.volume24h > 0 ? formatVolume(market.volume24h) : 'N/A')}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Liquidity</span>
                  <span className="text-sm font-medium text-foreground">
                    {market.liquidity && market.liquidity > 0 ? formatVolume(market.liquidity) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">End Date</span>
                  <span className="text-sm font-medium text-foreground">{market.endDate}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chart" className="p-6 pt-4">
            {market.chart && market.chart.length > 0 ? (
              <ChartContainer
                config={{
                  price: {
                    label: "Price",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[300px] w-full"
              >
                <LineChart
                  data={market.chart.map((point) => ({
                    time: new Date(point.t * 1000).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    price: Math.round(point.p * 100),
                    timestamp: point.t,
                  }))}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="time"
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    className="text-xs"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => [`${value}%`, "Yes Probability"]}
                        labelFormatter={(label) => label}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-64 flex items-center justify-center bg-secondary rounded-lg">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Chart data not available</p>
                  <p className="text-xs mt-1">Chart will load when data becomes available</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orderbook" className="p-6 pt-4">
            <div className="h-64 flex items-center justify-center bg-secondary rounded-lg">
              <div className="text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Order book will appear here</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trades" className="p-6 pt-4">
            <div className="h-64 flex items-center justify-center bg-secondary rounded-lg">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Recent trades will appear here</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="p-6 pt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-foreground">Resolution Source</h4>
                  <p className="text-sm text-muted-foreground">Official announcements and verified news sources</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-foreground">Resolution Time</h4>
                  <p className="text-sm text-muted-foreground">Within 24 hours of the event conclusion</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
