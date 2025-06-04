'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import TournamentBracketComponent from '@/components/TournamentBracket'
import { Tournament, TournamentMatch } from '@/lib/tournament'
import {
  Trophy,
  Users,
  Clock,
  Crown,
  Wallet,
  Calendar,
  Play,
  Eye
} from 'lucide-react'

interface TournamentGameProps {
  tournamentId: string
}

export default function TournamentGame({ tournamentId }: TournamentGameProps) {
  const { data: session } = useSession()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRegistered, setUserRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    fetchTournament()
  }, [tournamentId])

  const fetchTournament = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      const data = await response.json()
      
      if (data.success) {
        setTournament(data.tournament)
        setUserRegistered(data.tournament.players.some(
          (p: any) => p.id === session?.user?.id
        ))
      } else {
        setError(data.error || 'Failed to load tournament')
      }
    } catch (err) {
      setError('Failed to load tournament')
      console.error('Tournament fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!session?.user?.id || !tournament) return

    try {
      setRegistering(true)
      const response = await fetch(`/api/tournaments/${tournament.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setUserRegistered(true)
        await fetchTournament() // Refresh tournament data
      } else {
        setError(data.error || 'Failed to register')
      }
    } catch (err) {
      setError('Failed to register for tournament')
      console.error('Registration error:', err)
    } finally {
      setRegistering(false)
    }
  }

  const handleMatchStart = async (matchId: string) => {
    // Navigate to match game
    window.location.href = `/game/${matchId}`
  }

  const handleMatchComplete = async (matchId: string, winnerId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/bracket/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, winnerId })
      })

      if (response.ok) {
        await fetchTournament() // Refresh tournament data
      }
    } catch (err) {
      console.error('Error advancing winner:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTRATION': return 'bg-blue-500'
      case 'IN_PROGRESS': return 'bg-green-500' 
      case 'COMPLETED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getTimeUntilStart = () => {
    if (!tournament?.startTime) return ''
    
    const startTime = new Date(tournament.startTime)
    const now = new Date()
    const diff = startTime.getTime() - now.getTime()
    
    if (diff <= 0) return 'Started'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `Starts in ${hours}h ${minutes}m`
    }
    return `Starts in ${minutes}m`
  }

  const canRegister = () => {
    return tournament?.status === 'REGISTRATION' && 
           tournament.currentPlayers < tournament.maxPlayers &&
           !userRegistered
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">❌</div>
            <h3 className="text-lg font-semibold mb-2">Tournament Not Found</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.href = '/tournaments'}>
              Back to Tournaments
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Tournament Header */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
                  <p className="text-purple-100">{tournament.description}</p>
                </div>
                <div className="text-right">
                  <Badge className={`${getStatusColor(tournament.status)} text-white mb-2`}>
                    {tournament.status}
                  </Badge>
                  <div className="text-sm">
                    {getTimeUntilStart()}
                  </div>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Wallet className="w-5 h-5 text-green-600 mr-1" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{tournament.prizePool.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Prize Pool</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-blue-600 mr-1" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {tournament.currentPlayers}/{tournament.maxPlayers}
                  </div>
                  <div className="text-sm text-gray-600">Players</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Trophy className="w-5 h-5 text-yellow-600 mr-1" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {tournament.currentRound}/{tournament.totalRounds}
                  </div>
                  <div className="text-sm text-gray-600">Round</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Crown className="w-5 h-5 text-purple-600 mr-1" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    ₹{tournament.entryFee}
                  </div>
                  <div className="text-sm text-gray-600">Entry Fee</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="w-5 h-5 text-gray-600 mr-1" />
                  </div>
                  <div className="text-sm font-bold">
                    {new Date(tournament.startTime).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Start Date</div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-center">
                {canRegister() && (
                  <Button
                    onClick={handleRegister}
                    disabled={registering}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {registering ? 'Registering...' : `Join Tournament (₹${tournament.entryFee})`}
                  </Button>
                )}
                
                {userRegistered && tournament.status === 'REGISTRATION' && (
                  <Badge className="bg-green-500 text-white text-lg py-2 px-4">
                    ✅ Registered
                  </Badge>
                )}
                
                {tournament.status === 'COMPLETED' && (
                  <Badge className="bg-gray-500 text-white text-lg py-2 px-4">
                    Tournament Completed
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Registration Status */}
        {tournament.status === 'REGISTRATION' && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Registration Phase</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(tournament.currentPlayers / tournament.maxPlayers) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    {tournament.maxPlayers - tournament.currentPlayers} spots remaining
                  </div>
                  
                  {!userRegistered && (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">
                        Join now to secure your spot in this tournament!
                      </p>
                      {tournament.currentPlayers >= tournament.maxPlayers && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          Tournament Full
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tournament Bracket */}
        {tournament.status !== 'REGISTRATION' && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5" />
                  <span>Tournament Bracket</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TournamentBracketComponent
                  tournament={tournament}
                  onMatchStart={handleMatchStart}
                  onMatchComplete={handleMatchComplete}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Players List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Registered Players</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournament.players.map((player, index) => (
                <div 
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{player.name}</div>
                      {player.id === session?.user?.id && (
                        <Badge variant="outline" className="text-xs">You</Badge>
                      )}
                    </div>
                  </div>
                  
                  {player.isEliminated && (
                    <Badge variant="outline" className="text-red-600 border-red-600">
                      Eliminated
                    </Badge>
                  )}
                  
                  {tournament.winnerId === player.id && (
                    <Badge className="bg-yellow-500 text-white">
                      <Crown className="w-3 h-3 mr-1" />
                      Winner
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            {tournament.players.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No players registered yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
