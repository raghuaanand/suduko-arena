'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Play, 
  Users, 
  Clock, 
  Trophy,
  Shield,
  Gamepad2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Zap
} from 'lucide-react'

interface Match {
  id: string
  type: string
  status: string
  entryFee: number
  prize: number
  player1: { id: string, name: string }
  player2?: { id: string, name: string }
  sudokuGrid: string
  createdAt: string
}

export default function PlayMultiplayer() {
  const { data: session } = useSession()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [queueStatus, setQueueStatus] = useState<{
    inQueue: boolean
    position?: number
    waitTime?: number
    estimatedTime?: number
    message?: string
  }>({ inQueue: false })

  const checkQueueStatus = useCallback(async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch('/api/matches/queue-status')
      if (response.ok) {
        const data = await response.json()
        if (data.inQueue) {
          setQueueStatus({
            inQueue: true,
            position: data.position,
            waitTime: data.waitTime,
            estimatedTime: data.estimatedTime,
            message: data.message || 'Waiting for opponent...'
          })
        }
      }
    } catch (error) {
      console.error('Error checking queue status:', error)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    fetchMatches()
    // Check if user is in queue when page loads
    checkQueueStatus()
  }, [session, router, checkQueueStatus])

  const fetchMatches = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/matches?status=WAITING&type=MULTIPLAYER_FREE')
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches || [])
      }
    } catch (error) {
      console.error('Error fetching matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const createMatch = async (type: 'MULTIPLAYER_FREE' | 'MULTIPLAYER_PAID', entryFee = 0) => {
    setCreating(true)
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          entryFee,
          difficulty: selectedDifficulty
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.status === 'matched') {
          // Immediate match found
          const match = data.match
          alert('Match found! Starting game...')
          router.push(`/game/${match.id}`)
        } else if (data.status === 'queued') {
          // Added to queue, show waiting message
          alert(`Added to matchmaking queue. Looking for opponents...`)
          // Start polling for match or redirect to a queue page
          startMatchPolling()
        } else {
          // Single match created or joined existing
          const match = data.match
          router.push(`/game/${match.id}`)
        }
      } else {
        const error = await response.json()
        alert(`Error creating match: ${error.message}`)
      }
    } catch (error) {
      console.error('Error creating match:', error)
      alert('Failed to create match')
    } finally {
      setCreating(false)
    }
  }

  const startMatchPolling = () => {
    // Poll every 3 seconds for match updates
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/matches/queue-status')
        if (response.ok) {
          const data = await response.json()
          if (data.matchFound) {
            clearInterval(pollInterval)
            alert('Match found! Starting game...')
            router.push(`/game/${data.matchId}`)
          } else if (data.inQueue) {
            setQueueStatus({
              inQueue: true,
              position: data.position,
              waitTime: data.waitTime,
              estimatedTime: data.estimatedTime,
              message: data.message || 'Waiting for opponent...'
            })
          }
        }
      } catch (error) {
        console.error('Error polling for match:', error)
      }
    }, 3000)
    
    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval)
      alert('Matchmaking timeout. Please try again.')
    }, 120000)
  }

  const joinMatch = (matchId: string) => {
    router.push(`/game/${matchId}`)
  }

  const quickPlay = async () => {
    setCreating(true)
    try {
      // First try to join an existing waiting match
      const waitingMatches = matches.filter(m => 
        m.status === 'WAITING' && 
        m.player1.id !== session?.user?.id
      )
      
      if (waitingMatches.length > 0) {
        const randomMatch = waitingMatches[Math.floor(Math.random() * waitingMatches.length)]
        joinMatch(randomMatch.id)
        return
      }
      
      // If no waiting matches, create a new one
      await createMatch('MULTIPLAYER_FREE')
    } catch (error) {
      console.error('Error with quick play:', error)
    } finally {
      setCreating(false)
    }
  }

  const getMatchStatusIcon = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'ONGOING':
        return <Play className="w-4 h-4 text-green-500" />
      case 'FINISHED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
            <p className="text-gray-600 mb-4">You need to be signed in to play multiplayer games</p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Multiplayer Sudoku Arena
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Challenge players from around the world in real-time Sudoku battles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Quick Play</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Difficulty Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as const).map((diff) => (
                    <Button
                      key={diff}
                      variant={selectedDifficulty === diff ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDifficulty(diff)}
                      className="capitalize"
                    >
                      {diff}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Quick Play Button */}
              <Button 
                onClick={quickPlay}
                disabled={creating}
                className="w-full"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                {creating ? 'Finding Match...' : 'Quick Play'}
              </Button>

              {/* Create Match Options */}
              <div className="border-t pt-4 space-y-2">
                <Button 
                  onClick={() => createMatch('MULTIPLAYER_FREE')}
                  disabled={creating}
                  variant="outline"
                  className="w-full"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Create Free Match
                </Button>
                
                <Button 
                  onClick={() => createMatch('MULTIPLAYER_PAID', 10)}
                  disabled={creating}
                  variant="outline"
                  className="w-full"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Create Paid Match (₹10)
                </Button>
              </div>

              {/* User Info */}
              <div className="border-t pt-4">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{session.user?.name}</span>
                </div>
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available Matches */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Available Matches</span>
                </CardTitle>
                <Button 
                  onClick={fetchMatches}
                  disabled={loading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {matches.length} waiting matches found
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">Loading matches...</p>
                  </div>
                ) : matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500 mb-2">No matches waiting for players</p>
                    <p className="text-sm text-gray-400">Create a new match to start playing!</p>
                  </div>
                ) : (
                  matches.map((match) => (
                    <div 
                      key={match.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {getMatchStatusIcon(match.status)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{match.player1.name}</span>
                            {match.type === 'MULTIPLAYER_PAID' && (
                              <Badge variant="outline" className="text-xs">
                                ₹{match.entryFee}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTimeAgo(match.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {match.player1.id === session.user?.id ? (
                          <Badge variant="outline" className="text-xs">
                            Your Match
                          </Badge>
                        ) : (
                          <Button 
                            onClick={() => joinMatch(match.id)}
                            size="sm"
                            disabled={match.status !== 'WAITING'}
                          >
                            Join Game
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Queue Status */}
        {queueStatus.inQueue && (
          <Card className="mt-6">
            <CardContent className="text-center">
              <div className="text-sm text-gray-500 mb-2">
                {queueStatus.message}
              </div>
              <div className="flex justify-center space-x-4">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {queueStatus.position}
                  </div>
                  <div className="text-xs text-gray-400">Position in queue</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {queueStatus.estimatedTime ? `${queueStatus.estimatedTime} sec` : '--'}
                  </div>
                  <div className="text-xs text-gray-400">Estimated wait time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Game Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{matches.length}</div>
                <div className="text-sm text-gray-600">Available Matches</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Games Won</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">0</div>
                <div className="text-sm text-gray-600">Current Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">₹0</div>
                <div className="text-sm text-gray-600">Prize Money</div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
