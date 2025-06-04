'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Trophy, Clock, DollarSign } from 'lucide-react'

export default function CreateMatchPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  const createMatch = async (type: 'SINGLE_PLAYER' | 'MULTIPLAYER_FREE' | 'MULTIPLAYER_PAID', entryFee: number = 0) => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }

    setIsCreating(true)

    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          entryFee,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create match')
      }

      const data = await response.json()
      
      if (data.success && data.match) {
        // Redirect to the game room
        router.push(`/game/${data.match.id}`)
      } else {
        throw new Error(data.error || 'Failed to create match')
      }
    } catch (error) {
      console.error('Error creating match:', error)
      alert('Failed to create match. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="text-center py-8">
            <p className="mb-4">Please sign in to create a match</p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span>Create New Match</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Single Player */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Solo Practice</span>
              </span>
              <Badge variant="secondary">Free</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>No time limit</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>No entry fee</span>
              </div>
            </div>
            <p className="text-sm">
              Practice your Sudoku skills against AI. Perfect for warming up or learning new strategies.
            </p>
            <Button 
              onClick={() => createMatch('SINGLE_PLAYER')}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? 'Creating...' : 'Start Solo Game'}
            </Button>
          </CardContent>
        </Card>

        {/* Multiplayer Free */}
        <Card className="hover:shadow-lg transition-shadow border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Multiplayer Free</span>
              </span>
              <Badge variant="default">Free</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>30 minutes max</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>No entry fee</span>
              </div>
            </div>
            <p className="text-sm">
              Challenge other players in real-time. First to solve wins bragging rights!
            </p>
            <Button 
              onClick={() => createMatch('MULTIPLAYER_FREE')}
              disabled={isCreating}
              className="w-full"
              variant="default"
            >
              {isCreating ? 'Creating...' : 'Create Free Match'}
            </Button>
          </CardContent>
        </Card>

        {/* Multiplayer Paid */}
        <Card className="hover:shadow-lg transition-shadow border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Prize Match</span>
              </span>
              <Badge variant="destructive">₹50 Entry</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>30 minutes max</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>₹50 entry fee</span>
              </div>
            </div>
            <p className="text-sm">
              Compete for real money! Winner takes 80% of the prize pool (₹80 for 2 players).
            </p>
            <Button 
              onClick={() => createMatch('MULTIPLAYER_PAID', 50)}
              disabled={isCreating}
              className="w-full"
              variant="destructive"
            >
              {isCreating ? 'Creating...' : 'Create Prize Match'}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Single Player</h4>
              <p>Practice against AI with unlimited time. Perfect for learning and improving your skills.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Multiplayer Free</h4>
              <p>Real-time matches against other players. No money involved, just for fun and competition.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Prize Matches</h4>
              <p>Put your skills to the test! Entry fees create a prize pool. Winner takes 80%, platform keeps 20%.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
