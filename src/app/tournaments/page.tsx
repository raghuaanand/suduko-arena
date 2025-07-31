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
        await response.json()
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
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/10 to-[#0f3460]/10 rounded-xl"></div>
          <div className="relative bg-[#1a1a2e]/90 backdrop-blur-md border border-[#e94560]/20 rounded-xl shadow-2xl p-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/5 to-[#0f3460]/5 rounded-xl"></div>
            <div className="relative">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full blur-lg opacity-50"></div>
                <div className="relative animate-spin rounded-full h-12 w-12 border-2 border-transparent bg-gradient-to-r from-[#e94560] to-[#f9ed69] p-1 mx-auto">
                  <div className="bg-[#1a1a2e] rounded-full h-full w-full"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Loading Cosmic Tournaments...</h3>
              <p className="text-white/70">Scanning the arena for stellar competitions.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
      {/* Cosmic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/15 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-l from-[#0f3460]/40 to-[#e94560]/25 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-t from-[#f9ed69]/20 to-[#16213e]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Floating star particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#f9ed69] rounded-full animate-ping opacity-70"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#e94560] rounded-full animate-ping opacity-80" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#0f3460] rounded-full animate-ping opacity-60" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full blur-lg opacity-50"></div>
            <Crown className="relative h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">Cosmic Tournaments</h1>
            <p className="text-gray-300 text-sm">Compete for stellar prizes in the ultimate arena</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-xl"></div>
            <div className="relative bg-gray-900/40 backdrop-blur-sm border border-green-500/30 rounded-xl px-6 py-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-500 rounded-full blur-lg opacity-50"></div>
                  <Wallet className="relative h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white">₹{walletBalance.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="group relative px-6 py-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl text-white font-medium transition-all duration-300 hover:from-purple-500/30 hover:to-blue-500/30 hover:border-purple-400/50 hover:shadow-lg hover:scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            <span className="relative">Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* Tournament Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-2 border-[#e94560]/30 hover:border-[#e94560]/60 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md transform hover:scale-105 cursor-pointer rounded-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e94560]/30 to-[#f9ed69]/20 rounded-bl-full opacity-60"></div>
            <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full animate-ping ${
              tournament.status === 'REGISTRATION' 
                ? 'bg-[#f9ed69]' 
                : tournament.status === 'IN_PROGRESS'
                ? 'bg-[#e94560]'
                : 'bg-gray-400'
            }`}></div>
            
            {/* Header */}
            <div className="relative z-10 p-6 border-b border-[#e94560]/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  tournament.status === 'REGISTRATION' 
                    ? 'bg-gradient-to-r from-[#f9ed69]/20 to-[#e94560]/20 border border-[#f9ed69]/30 text-[#f9ed69]' 
                    : tournament.status === 'IN_PROGRESS'
                    ? 'bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/20 border border-[#e94560]/30 text-[#e94560]'
                    : 'bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 text-gray-400'
                }`}>
                  {getStatusText(tournament.status)}
                </div>
              </div>
              <p className="text-white/70 text-sm">{tournament.description}</p>
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 space-y-6">
              {/* Tournament Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-[#f9ed69]/10 to-[#e94560]/10 border border-[#f9ed69]/20 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-lg flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-[#1a1a2e]" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Prize Pool</p>
                    <p className="text-[#f9ed69] font-bold">₹{tournament.prizePool.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-[#0f3460]/10 to-[#e94560]/10 border border-[#0f3460]/20 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#0f3460] to-[#e94560] rounded-lg flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Entry Fee</p>
                    <p className="text-[#f9ed69] font-bold">₹{tournament.entryFee}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-[#e94560]/10 to-[#f9ed69]/10 border border-[#e94560]/20 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#e94560] to-[#f9ed69] rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-[#1a1a2e]" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Players</p>
                    <p className="text-[#f9ed69] font-bold">{tournament.currentPlayers}/{tournament.maxPlayers}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-[#f9ed69]/10 to-[#0f3460]/10 border border-[#f9ed69]/20 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#f9ed69] to-[#0f3460] rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-[#1a1a2e]" />
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Status</p>
                    <p className="text-[#f9ed69] font-bold text-xs">{formatTime(tournament.startTime)}</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-white/70">
                  <span>Registration Progress</span>
                  <span>{Math.round((tournament.currentPlayers / tournament.maxPlayers) * 100)}%</span>
                </div>
                <div className="w-full bg-[#1a1a2e]/50 rounded-full h-3 overflow-hidden border border-[#e94560]/20">
                  <div 
                    className="h-full bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full transition-all duration-500 shadow-lg"
                    style={{ 
                      width: `${(tournament.currentPlayers / tournament.maxPlayers) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => handleJoinTournament(tournament)}
                disabled={!canJoinTournament(tournament)}
                className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed ${
                  tournament.status === 'COMPLETED' || tournament.currentPlayers >= tournament.maxPlayers || walletBalance < tournament.entryFee
                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 cursor-not-allowed'
                    : tournament.status === 'IN_PROGRESS'
                    ? 'bg-gradient-to-r from-[#0f3460] to-[#e94560] hover:from-[#0a2850] hover:to-[#d63847] text-white'
                    : 'bg-gradient-to-r from-[#e94560] to-[#f9ed69] hover:from-[#d63847] hover:to-[#f7e742] text-[#1a1a2e]'
                }`}
              >
                {tournament.status === 'COMPLETED' ? (
                  'Tournament Ended'
                ) : tournament.currentPlayers >= tournament.maxPlayers ? (
                  'Tournament Full'
                ) : walletBalance < tournament.entryFee ? (
                  `Need ₹${tournament.entryFee - walletBalance} more`
                ) : tournament.status === 'IN_PROGRESS' ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span>View Bracket</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Join Tournament</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                )}
              </button>

              {/* Additional Info */}
              {tournament.status === 'REGISTRATION' && (
                <div className="text-center p-3 bg-gradient-to-r from-[#0f3460]/10 to-[#e94560]/10 border border-[#0f3460]/20 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-sm text-white/70">
                    <Calendar className="h-4 w-4 text-[#0f3460]" />
                    <span>
                      {new Date(tournament.startTime).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tournament Rules */}
      <div className="relative overflow-hidden border-2 border-[#f9ed69]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md rounded-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#f9ed69]/10 to-[#e94560]/5 rounded-bl-full"></div>
        <div className="relative z-10 border-b border-[#f9ed69]/20 p-6">
          <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-lg flex items-center justify-center">
              <Trophy className="h-5 w-5 text-[#1a1a2e]" />
            </div>
            <span>Cosmic Tournament Rules</span>
          </h3>
        </div>
        <div className="relative z-10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-white flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full"></div>
                <span>How Tournaments Work</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-[#e94560]/10 to-[#f9ed69]/10 border border-[#e94560]/20 rounded-lg">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/70 text-sm">Single elimination bracket format for ultimate competition</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-[#e94560]/10 to-[#f9ed69]/10 border border-[#e94560]/20 rounded-lg">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/70 text-sm">Each cosmic round has a 30-minute time limit</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-[#e94560]/10 to-[#f9ed69]/10 border border-[#e94560]/20 rounded-lg">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/70 text-sm">First to complete the stellar puzzle wins the round</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-[#e94560]/10 to-[#f9ed69]/10 border border-[#e94560]/20 rounded-lg">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/70 text-sm">Champion takes 70% of prize pool, runner-up claims 30%</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-white flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-[#0f3460] to-[#e94560] rounded-full"></div>
                <span>Entry Requirements</span>
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-[#0f3460]/10 to-[#e94560]/10 border border-[#0f3460]/20 rounded-lg">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#0f3460] to-[#e94560] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/70 text-sm">Sufficient cosmic credits (wallet balance) for entry fee</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-[#0f3460]/10 to-[#e94560]/10 border border-[#0f3460]/20 rounded-lg">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#0f3460] to-[#e94560] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/70 text-sm">Tournament must be in open registration phase</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-[#0f3460]/10 to-[#e94560]/10 border border-[#0f3460]/20 rounded-lg">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#0f3460] to-[#e94560] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/70 text-sm">Verified cosmic warrior account required</span>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gradient-to-r from-[#0f3460]/10 to-[#e94560]/10 border border-[#0f3460]/20 rounded-lg">
                  <div className="w-2 h-2 bg-gradient-to-r from-[#0f3460] to-[#e94560] rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-white/70 text-sm">Fair play policy and honor code applies</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
