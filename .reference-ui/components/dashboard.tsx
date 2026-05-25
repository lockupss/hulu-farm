'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Welcome to HuluFarm</h1>
        <p className="text-muted-foreground mt-2">Your agricultural support platform for real-time insights and community guidance</p>
      </div>

      {/* Alert Section */}
      <div className="mb-6 p-4 bg-accent/10 border border-accent rounded-lg">
        <p className="text-accent font-medium">⚠️ Heavy rainfall expected in your region within 24 hours. Review your irrigation schedule.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28°C</div>
            <p className="text-xs text-muted-foreground mt-1">Partly cloudy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Humidity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-muted-foreground mt-1">Optimal for growth</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maize Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,450 Br</div>
            <p className="text-xs text-muted-foreground mt-1">+5% this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Farmers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5K</div>
            <p className="text-xs text-muted-foreground mt-1">On the platform</p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Weather Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Weather Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-start py-2 border-b border-border">
              <div>
                <p className="font-medium text-sm">Rainfall Warning</p>
                <p className="text-xs text-muted-foreground">Heavy rains in 12 hours</p>
              </div>
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">Alert</span>
            </div>
            <div className="flex justify-between items-start py-2 border-b border-border">
              <div>
                <p className="font-medium text-sm">Temperature Drop</p>
                <p className="text-xs text-muted-foreground">Expected 5°C decrease</p>
              </div>
              <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">Info</span>
            </div>
            <div className="flex justify-between items-start py-2">
              <div>
                <p className="font-medium text-sm">Ideal Planting Day</p>
                <p className="text-xs text-muted-foreground">Conditions optimal tomorrow</p>
              </div>
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Good</span>
            </div>
          </CardContent>
        </Card>

        {/* Market Updates */}
        <Card>
          <CardHeader>
            <CardTitle>Market Price Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">Maize</span>
              <span className="text-sm font-bold">2,450 Br <span className="text-xs text-green-600">↑5%</span></span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">Wheat</span>
              <span className="text-sm font-bold">3,100 Br <span className="text-xs text-green-600">↑2%</span></span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm font-medium">Teff</span>
              <span className="text-sm font-bold">5,200 Br <span className="text-xs text-red-600">↓3%</span></span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Beans</span>
              <span className="text-sm font-bold">4,800 Br <span className="text-xs text-green-600">↑1%</span></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Community Highlights</CardTitle>
          <CardDescription>Latest discussions from farmers in your region</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 pb-4 border-b border-border">
            <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">🌱</div>
            <div className="flex-1">
              <p className="font-medium text-sm">Best practices for disease prevention</p>
              <p className="text-xs text-muted-foreground">Abebe Kebede • 2 hours ago</p>
            </div>
          </div>
          <div className="flex gap-4 pb-4 border-b border-border">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">📈</div>
            <div className="flex-1">
              <p className="font-medium text-sm">When is the best time to sell?</p>
              <p className="text-xs text-muted-foreground">Marta Alemu • 4 hours ago</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">☁️</div>
            <div className="flex-1">
              <p className="font-medium text-sm">Preparing for the rainy season</p>
              <p className="text-xs text-muted-foreground">Tadesse Wolde • 6 hours ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
