'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Notifications() {
  const notifications = [
    {
      id: 1,
      type: 'alert',
      title: 'Heavy Rain Warning',
      message: 'Heavy rainfall expected in 12 hours. Adjust irrigation schedules accordingly.',
      time: '10 minutes ago',
      read: false,
    },
    {
      id: 2,
      type: 'success',
      title: 'Price Alert: Maize',
      message: 'Maize prices increased by 5%. Good time to consider selling.',
      time: '1 hour ago',
      read: false,
    },
    {
      id: 3,
      type: 'info',
      title: 'Disease Detection Scan',
      message: 'Your North Plot has been scanned. Plant health excellent.',
      time: '3 hours ago',
      read: true,
    },
    {
      id: 4,
      type: 'alert',
      title: 'Pest Alert',
      message: 'Armyworm outbreak reported in your region. Monitor your fields.',
      time: '6 hours ago',
      read: true,
    },
    {
      id: 5,
      type: 'info',
      title: 'Market Opportunity',
      message: 'Wheat demand increasing. Check current prices.',
      time: '1 day ago',
      read: true,
    },
    {
      id: 6,
      type: 'success',
      title: 'Harvest Reminder',
      message: 'Your Beans plot will be ready to harvest in 5 days.',
      time: '2 days ago',
      read: true,
    },
  ]

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return '⚠️'
      case 'success':
        return '✅'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground mt-2">Stay updated with real-time alerts and updates</p>
      </div>

      {/* Notification Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">🔔 Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Weather Alerts', 'Price Updates', 'Disease Alerts', 'Community Posts', 'Farm Reminders'].map((pref, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">{pref}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>Unread notifications appear first</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition ${
                !notification.read
                  ? 'bg-primary/5 border-primary/20'
                  : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex gap-3">
                <span className="text-2xl">{getIcon(notification.type)}</span>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground">{notification.title}</h3>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
