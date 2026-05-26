'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function MarketPrices() {
  const prices = [
    { name: 'Maize', price: 2450, change: 5, unit: 'per quintal' },
    { name: 'Wheat', price: 3100, change: 2, unit: 'per quintal' },
    { name: 'Teff', price: 5200, change: -3, unit: 'per quintal' },
    { name: 'Beans', price: 4800, change: 1, unit: 'per quintal' },
    { name: 'Barley', price: 2100, change: -2, unit: 'per quintal' },
    { name: 'Sorghum', price: 1950, change: 4, unit: 'per quintal' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Market Price Updates</h1>
        <p className="text-muted-foreground mt-2">Real-time prices from major terminal markets across Ethiopia</p>
      </div>

      {/* Market Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Price Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">+1.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Compared to last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Highest Demand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Teff</div>
            <p className="text-xs text-muted-foreground mt-1">Premium market commodity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Best Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Addis Ababa</div>
            <p className="text-xs text-muted-foreground mt-1">Terminal market</p>
          </CardContent>
        </Card>
      </div>

      {/* Price Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Commodity Prices</CardTitle>
          <CardDescription>Updated every hour from terminal markets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-sm">Commodity</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Current Price</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">Change</th>
                  <th className="text-right py-3 px-4 font-medium text-sm">% Change</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((item, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.unit}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-bold">{item.price.toLocaleString()} Br</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className={`text-sm font-medium ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.change >= 0 ? '↑' : '↓'} {Math.abs(item.change)} Br
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.change >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {item.change >= 0 ? '+' : ''}{item.change}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Price Prediction */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>AI-Based Price Prediction</CardTitle>
          <CardDescription>Next 30 days forecast for major commodities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prices.map((item, i) => (
              <div key={i} className="bg-muted/50 p-4 rounded-lg">
                <p className="font-medium mb-2">{item.name}</p>
                <p className="text-sm text-muted-foreground mb-3">Expected range in 30 days</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-muted-foreground">Low</p>
                    <p className="font-bold">{(item.price * 0.95).toFixed(0)} Br</p>
                  </div>
                  <div className="h-12 flex items-end gap-1 px-2">
                    <div className="w-1 h-8 bg-primary/40 rounded"></div>
                    <div className="w-1 h-10 bg-primary/60 rounded"></div>
                    <div className="w-1 h-6 bg-primary/40 rounded"></div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">High</p>
                    <p className="font-bold">{(item.price * 1.08).toFixed(0)} Br</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
