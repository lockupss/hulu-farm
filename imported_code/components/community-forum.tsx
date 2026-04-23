'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function CommunityForum() {
  const discussions = [
    {
      id: 1,
      author: 'Abebe Kebede',
      title: 'Best practices for disease prevention',
      content: 'I\'ve been using crop rotation and resistant varieties successfully. What works for you?',
      replies: 12,
      likes: 34,
      time: '2 hours ago',
      category: 'Disease Management',
    },
    {
      id: 2,
      author: 'Marta Alemu',
      title: 'When is the best time to sell my harvest?',
      content: 'Prices seem to fluctuate. Looking for advice on optimal timing.',
      replies: 8,
      likes: 21,
      time: '4 hours ago',
      category: 'Market Trends',
    },
    {
      id: 3,
      author: 'Tadesse Wolde',
      title: 'Preparing for the rainy season',
      content: 'Tips on preparing farms and irrigation systems before heavy rains?',
      replies: 15,
      likes: 45,
      time: '6 hours ago',
      category: 'Weather Preparation',
    },
    {
      id: 4,
      author: 'Almaz Hailu',
      title: 'Sustainable farming techniques',
      content: 'Has anyone tried drip irrigation? Looking to improve water efficiency.',
      replies: 19,
      likes: 52,
      time: '8 hours ago',
      category: 'Sustainability',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Community Forum</h1>
        <p className="text-muted-foreground mt-2">Connect with farmers, share experiences, and learn from the community</p>
      </div>

      {/* New Discussion */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Start a New Discussion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Input placeholder="What's on your mind?" className="bg-muted/50" />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">Post Discussion</Button>
              <Button variant="ghost" className="flex-1">Ask a Question</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Discussions List */}
      <div className="space-y-4">
        {discussions.map((discussion) => (
          <Card key={discussion.id} className="hover:shadow-md transition cursor-pointer">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                  💬
                </div>
                <div className="flex-1">
                  <div className="mb-2">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{discussion.title}</h3>
                      <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded whitespace-nowrap">
                        {discussion.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {discussion.author} • {discussion.time}
                    </p>
                  </div>
                  <p className="text-sm text-foreground/80 mb-3">{discussion.content}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-primary transition">
                      💬 {discussion.replies} replies
                    </button>
                    <button className="flex items-center gap-1 hover:text-accent transition">
                      👍 {discussion.likes} likes
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="flex justify-center mt-8">
        <Button variant="outline">Load More Discussions</Button>
      </div>
    </div>
  )
}
