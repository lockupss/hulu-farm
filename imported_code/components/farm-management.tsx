'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function FarmManagement() {
  const farms = [
    {
      name: 'North Plot',
      crop: 'Maize',
      area: '2.5 hectares',
      status: 'Growing',
      health: 'Excellent',
      plantedDate: '2024-05-15',
      expectedHarvest: '2024-09-15',
    },
    {
      name: 'South Plot',
      crop: 'Beans',
      area: '1.8 hectares',
      status: 'Flowering',
      health: 'Good',
      plantedDate: '2024-06-01',
      expectedHarvest: '2024-10-01',
    },
    {
      name: 'East Field',
      crop: 'Wheat',
      area: '3.2 hectares',
      status: 'Germination',
      health: 'Good',
      plantedDate: '2024-07-20',
      expectedHarvest: '2025-03-20',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Farm Management</h1>
        <p className="text-muted-foreground mt-2">Monitor your crops, track irrigation, and manage farm records</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Farm Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.5 hectares</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Plots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5/10</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expected Yield</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 tons</div>
          </CardContent>
        </Card>
      </div>

      {/* Farm Plots */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Farm Plots</CardTitle>
          <CardDescription>Monitor crop health and development stages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {farms.map((farm, i) => (
            <div key={i} className="border border-border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{farm.name}</h3>
                  <p className="text-sm text-muted-foreground">{farm.area}</p>
                </div>
                <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                  {farm.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Crop</p>
                  <p className="font-medium">{farm.crop}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Health</p>
                  <p className="font-medium text-accent">{farm.health}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Planted</p>
                  <p className="font-medium">{farm.plantedDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Expected Harvest</p>
                  <p className="font-medium">{farm.expectedHarvest}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="text-xs">
                  Update Status
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Irrigation Schedule */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Irrigation Schedule</CardTitle>
          <CardDescription>Optimize water usage based on weather and soil conditions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {farms.map((farm, i) => (
            <div key={i} className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">💧 {farm.name}</h4>
                <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded">
                  {65}% soil moisture
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">Next irrigation: {i === 0 ? 'Tomorrow 6 AM' : i === 1 ? 'In 2 days' : 'In 3 days'}</p>
                <p className="text-muted-foreground">Recommended: {i === 0 ? '30mm' : i === 1 ? '25mm' : '35mm'} per week</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Farm Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Farm Inputs Tracking</CardTitle>
          <CardDescription>Monitor fertilizer, pesticides, and other inputs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'NPK Fertilizer', amount: '500 kg', date: 'Last applied: 2 weeks ago' },
              { name: 'Fungicide', amount: '20 liters', date: 'Last applied: 1 week ago' },
              { name: 'Herbicide', amount: '15 liters', date: 'Last applied: 3 weeks ago' },
              { name: 'Compost', amount: '2 tons', date: 'Last applied: 1 month ago' },
            ].map((input, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">{input.name}</p>
                  <p className="text-xs text-muted-foreground">{input.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{input.amount}</p>
                  <Button variant="ghost" size="sm" className="text-xs">Update</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
