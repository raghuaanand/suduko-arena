'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Trophy, Clock, AlertCircle } from 'lucide-react'

interface Match {
  id: string
  type: 'SINGLE_PLAYER' | 'MULTIPLAYER_FREE' | 'MULTIPLAYER_PAID'
  status: 'WAITING' | 'ONGOING' | 'FINISHED' | 'CANCELLED'
  entryFee: number
  prize: number
  createdAt: string
  participants: number
  maxParticipants: number
}

export default function ActiveMatchesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }

    fetchActiveMatches()
  }, [session, router])

  const fetchActiveMatches = async () => {
    try {
      const response = await fetch('/api/matches')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMatches(data.matches || [])
        }
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const joinMatch = async (matchId: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'join',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          router.push(`/game/${matchId}`)
        } else {
          alert(data.error || 'Failed to join match')
        }
      } else {
        alert('Failed to join match')
      }
    } catch (error) {
      console.error('Error joining match:', error)
      alert('Failed to join match')
    }
  }

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'SINGLE_PLAYER':
        return 'bg-blue-500'
      case 'MULTIPLAYER_FREE':
        return 'bg-green-500'
      case 'MULTIPLAYER_PAID':
        return 'bg-purple-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getMatchTypeName = (type: string) => {
    switch (type) {
      case 'SINGLE_PLAYER':
        return 'Solo Practice'
      case 'MULTIPLAYER_FREE':
        return 'Free Multiplayer'
      case 'MULTIPLAYER_PAID':
        return 'Prize Match'
      default:
        return 'Unknown'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <Badge variant="secondary">Waiting</Badge>
      case 'ONGOING':
        return <Badge variant="default">Ongoing</Badge>
      case 'FINISHED':
        return <Badge variant="outline">Finished</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <span>Active Matches</span>
          </CardTitle>
        </CardHeader>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading matches...</p>
          </CardContent>
        </Card>
      ) : matches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 space-y-4">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No Active Matches</h3>
              <p className="text-gray-600 mb-4">
                There are no active matches available right now. Create a new match to get started!
              </p>
              <Button onClick={() => router.push('/create-match')}>
                Create New Match
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => (
            <Card key={match.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getMatchTypeColor(match.type)}`} />
                    <CardTitle className="text-lg">
                      {getMatchTypeName(match.type)}
                    </CardTitle>
                  </div>
                  {getStatusBadge(match.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>Players</span>
                    </span>
                    <span>{match.participants}/{match.maxParticipants}</span>
                  </div>
                  
                  {match.entryFee > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4" />
                        <span>Entry Fee</span>
                      </span>
                      <span>₹{match.entryFee}</span>
                    </div>
                  )}
                  
                  {match.prize > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Trophy className="h-4 w-4" />
                        <span>Prize Pool</span>
                      </span>
                      <span>₹{match.prize}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Created</span>
                    </span>
                    <span>{new Date(match.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {match.status === 'WAITING' && match.participants < match.maxParticipants && (
                  <Button 
                    onClick={() => joinMatch(match.id)}
                    className="w-full"
                  >
                    Join Match
                  </Button>
                )}
                
                {match.status === 'ONGOING' && (
                  <Button 
                    onClick={() => router.push(`/game/${match.id}`)}
                    className="w-full"
                    variant="default"
                  >
                    Continue Game
                  </Button>
                )}
                
                {match.status === 'FINISHED' && (
                  <Button 
                    onClick={() => router.push(`/game/${match.id}`)}
                    className="w-full"
                    variant="outline"
                  >
                    View Results
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </Button>
        
        <Button 
          onClick={() => router.push('/create-match')}
        >
          Create New Match
        </Button>
      </div>
    </div>
  )
}
