'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Users, 
  Clock, 
  Wallet,
  Calendar,
  Crown,
  ArrowRight
} from 'lucide-react'
import { Tournament } from '@/lib/tournament'

export default function TournamentsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }
    
    fetchTournaments()
    fetchWalletBalance()
  }, [session, router])

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments')
      if (response.ok) {
        const data = await response.json()
        setTournaments(data.tournaments || [])
      } else {
        // Fallback to mock data
        const mockTournaments: Tournament[] = [
          {
            id: '1',
            name: 'Daily Championship',
            entryFee: 100,
            prizePool: 5000,
            maxPlayers: 16,
            currentPlayers: 8,
            status: 'REGISTRATION',
            startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            description: 'Daily tournament with exciting prizes for Sudoku masters!',
            bracketType: 'SINGLE_ELIMINATION',
            currentRound: 0,
            totalRounds: 4,
            players: [],
            matches: []
          },
          {
            id: '2',
            name: 'Weekend Warrior',
            entryFee: 50,
            prizePool: 2000,
            maxPlayers: 8,
            currentPlayers: 5,
            status: 'REGISTRATION',
            startTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            description: 'Perfect for weekend players looking for some competitive action.',
            bracketType: 'SINGLE_ELIMINATION',
            currentRound: 0,
            totalRounds: 3,
            players: [],
            matches: []
          },
          {
            id: '3',
            name: 'Mega Tournament',
            entryFee: 200,
            prizePool: 10000,
            maxPlayers: 32,
            currentPlayers: 20,
            status: 'REGISTRATION',
            startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            description: 'The biggest tournament of the month with massive prizes!',
            bracketType: 'SINGLE_ELIMINATION',
            currentRound: 0,
            totalRounds: 5,
            players: [],
            matches: []
          },
          {
            id: '4',
            name: 'Speed Challenge',
            entryFee: 75,
            prizePool: 3000,
            maxPlayers: 12,
            currentPlayers: 12,
            status: 'IN_PROGRESS',
            startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            description: 'Fast-paced tournament for quick thinkers.',
            bracketType: 'SINGLE_ELIMINATION',
            currentRound: 1,
            totalRounds: 4,
            players: [],
            matches: []
          }
        ]
        setTournaments(mockTournaments)
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        setWalletBalance(data.balance || 0)
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
    }
  }

  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'REGISTRATION': return 'bg-blue-500'
      case 'IN_PROGRESS': return 'bg-green-500'
      case 'COMPLETED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: Tournament['status']) => {
    switch (status) {
      case 'REGISTRATION': return 'Registration Open'
      case 'IN_PROGRESS': return 'In Progress'
      case 'COMPLETED': return 'Completed'
      default: return 'Unknown'
    }
  }

  const canJoinTournament = (tournament: Tournament) => {
    return tournament.status === 'REGISTRATION' && 
           tournament.currentPlayers < tournament.maxPlayers &&
           walletBalance >= tournament.entryFee
  }

  const handleJoinTournament = async (tournament: Tournament) => {
    if (!canJoinTournament(tournament)) {
      if (tournament.status !== 'REGISTRATION') {
        alert('Tournament registration is closed')
      } else if (tournament.currentPlayers >= tournament.maxPlayers) {
        alert('Tournament is full')
      } else if (walletBalance < tournament.entryFee) {
        alert(`Insufficient balance! You need ₹${tournament.entryFee} to join this tournament.`)
      }
      return
    }

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/join`, {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        alert('Successfully joined tournament!')
        fetchWalletBalance()
        fetchTournaments()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to join tournament')
      }
    } catch (error) {
      console.error('Error joining tournament:', error)
      alert('Failed to join tournament')
    }
  }

  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    
    if (diffMs < 0) {
      return 'Started'
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours > 0) {
      return `Starts in ${diffHours}h ${diffMinutes}m`
    } else {
      return `Starts in ${diffMinutes}m`
    }
  }

  if (!session?.user?.id) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Loading Tournaments...</h3>
              <p className="text-gray-600">Fetching available tournaments.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Crown className="h-8 w-8 text-yellow-600" />
          <span>Tournaments</span>
        </h1>
        <div className="flex items-center space-x-4">
          <Card className="px-4 py-2">
            <div className="flex items-center space-x-2">
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="font-semibold">₹{walletBalance.toFixed(2)}</span>
            </div>
          </Card>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{tournament.name}</CardTitle>
                <Badge className={getStatusColor(tournament.status)}>
                  {getStatusText(tournament.status)}
                </Badge>
              </div>
              <CardDescription>{tournament.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tournament Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-yellow-600" />
                  <span>₹{tournament.prizePool.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <span>₹{tournament.entryFee}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{tournament.currentPlayers}/{tournament.maxPlayers}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-purple-600" />
                  <span className="text-xs">{formatTime(tournament.startTime)}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(tournament.currentPlayers / tournament.maxPlayers) * 100}%` 
                  }}
                ></div>
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => handleJoinTournament(tournament)}
                disabled={!canJoinTournament(tournament)}
                className="w-full"
                variant={tournament.status === 'IN_PROGRESS' ? 'default' : 'outline'}
              >
                {tournament.status === 'COMPLETED' ? (
                  'Tournament Ended'
                ) : tournament.currentPlayers >= tournament.maxPlayers ? (
                  'Tournament Full'
                ) : walletBalance < tournament.entryFee ? (
                  `Need ₹${tournament.entryFee - walletBalance} more`
                ) : tournament.status === 'IN_PROGRESS' ? (
                  <div className="flex items-center space-x-2">
                    <span>View Bracket</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Join Tournament</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </Button>

              {/* Additional Info */}
              {tournament.status === 'REGISTRATION' && (
                <div className="text-xs text-gray-500 text-center">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {new Date(tournament.startTime).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tournament Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">How Tournaments Work</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Single elimination bracket format</li>
                <li>• Each round has a 30-minute time limit</li>
                <li>• First to complete the puzzle wins the round</li>
                <li>• Winner takes 70% of prize pool, runner-up 30%</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Entry Requirements</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Sufficient wallet balance for entry fee</li>
                <li>• Tournament must be in registration phase</li>
                <li>• Account must be verified</li>
                <li>• Fair play policy applies</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
