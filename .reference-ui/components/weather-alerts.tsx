'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function WeatherAlerts() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Weather Alerts & Forecasts</h1>
        <p className="text-muted-foreground mt-2">Hyper-localized weather information for your farm</p>
      </div>

      {/* Current Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Weather</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="text-5xl">☁️</div>
                <div>
                  <div className="text-5xl font-bold">28°C</div>
                  <p className="text-lg text-muted-foreground">Partly Cloudy</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Addis Ababa Region</p>
                <p className="text-xs text-muted-foreground">Last updated 10 min ago</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">💧 Humidity</p>
                <p className="text-xl font-bold">65%</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">💨 Wind Speed</p>
                <p className="text-xl font-bold">12 km/h</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">👁️ Visibility</p>
                <p className="text-xl font-bold">10 km</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Pressure</p>
                <p className="text-xl font-bold">1013 mb</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <p className="font-medium text-sm">Heavy Rain Warning</p>
              <p className="text-xs text-muted-foreground mt-1">In 12-24 hours, 40-60mm expected</p>
            </div>
            <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
              <p className="font-medium text-sm">Temperature Drop</p>
              <p className="text-xs text-muted-foreground mt-1">5°C decrease expected tomorrow</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader>
          <CardTitle>7-Day Weather Forecast</CardTitle>
          <CardDescription>Hyper-localized predictions for your farm location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {['Today', 'Tomorrow', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={i} className="bg-muted/50 p-4 rounded-lg text-center">
                <p className="text-sm font-medium mb-3">{day}</p>
                <div className="text-3xl mb-2">{i % 2 === 0 ? '☀️' : '🌧️'}</div>
                <div className="text-xs mb-2">
                  <p className="font-bold">{28 - i}°C</p>
                  <p className="text-muted-foreground">{20 - i}°C</p>
                </div>
                <p className="text-xs text-muted-foreground">{30 + i * 5}% humidity</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
