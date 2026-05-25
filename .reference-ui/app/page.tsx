'use client'

import { useState } from 'react'
import Navigation from '@/components/navigation'
import Dashboard from '@/components/dashboard'
import WeatherAlerts from '@/components/weather-alerts'
import MarketPrices from '@/components/market-prices'
import DiseaseDetection from '@/components/disease-detection'
import CommunityForum from '@/components/community-forum'
import FarmManagement from '@/components/farm-management'
import Notifications from '@/components/notifications'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'weather':
        return <WeatherAlerts />
      case 'market':
        return <MarketPrices />
      case 'disease':
        return <DiseaseDetection />
      case 'forum':
        return <CommunityForum />
      case 'farm':
        return <FarmManagement />
      case 'notifications':
        return <Notifications />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pt-20">
        {renderContent()}
      </main>
    </div>
  )
}
