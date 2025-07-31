'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, Trophy, Clock, DollarSign, Sparkles, Play, Zap, ArrowLeft } from 'lucide-react'

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
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(`Failed to create match: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('API Response:', data) // Debug log
      
      // Handle matchmaking responses
      if (data.status === 'queued') {
        // Player has been added to queue, show message and redirect to queue page
        alert(data.message || 'Added to matchmaking queue. Please wait for an opponent...')
        router.push('/play/multiplayer') // Redirect to multiplayer page to show queue status
        return
      }
      
      // Handle successful match creation/joining
      if ((data.success && data.match) || (data.match && !data.hasOwnProperty('success'))) {
        // Redirect to the game room
        const matchId = data.match.id
        console.log('Redirecting to game:', matchId) // Debug log
        router.push(`/game/${matchId}`)
      } else {
        console.error('Invalid response format:', data) // Debug log
        throw new Error(data.error || data.message || 'Failed to create match')
      }
    } catch (error) {
      console.error('Error creating match:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create match. Please try again.'
      alert(errorMessage)
    } finally {
      setIsCreating(false)
    }
  }

  if (!session) {
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
        
        <div className="container mx-auto p-6 relative z-10">
          <div className="flex items-center justify-center min-h-screen">
            <div className="w-96 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md border border-[#e94560]/30 rounded-2xl shadow-2xl">
              <div className="p-8 text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full blur-lg opacity-50"></div>
                  <Trophy className="relative h-8 w-8 text-white" />
                </div>
                <p className="mb-6 text-white/70">Please sign in to create a match</p>
                <button 
                  onClick={() => router.push('/auth/signin')}
                  className="w-full bg-gradient-to-r from-[#e94560] to-[#f9ed69] hover:from-[#d63847] hover:to-[#f7e742] text-[#1a1a2e] font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Sign In
                </button>
              </div>
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

      <div className="container mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md border border-[#e94560]/30 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#f9ed69] to-[#e94560] rounded-full blur-lg opacity-50"></div>
                <Trophy className="relative h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#f9ed69] to-[#e94560] bg-clip-text text-transparent">
                Create New Match
              </h1>
              <Sparkles className="h-6 w-6 text-[#f9ed69] animate-pulse" />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Single Player */}
          <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md border border-[#e94560]/30 rounded-2xl shadow-2xl overflow-hidden hover:border-[#e94560]/50 transition-all duration-300 transform hover:scale-105 group">
            <div className="p-6 border-b border-[#e94560]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full blur-lg opacity-50"></div>
                    <Play className="relative h-6 w-6 text-white" />
                  </div>
                  <span className="text-white font-semibold text-lg">Solo Practice</span>
                </div>
                <div className="px-3 py-1 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/20 border border-[#e94560]/30 rounded-full">
                  <span className="text-[#f9ed69] text-sm font-medium">Free</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-white/70">
                  <Clock className="h-4 w-4 text-[#0f3460]" />
                  <span className="text-sm">No time limit</span>
                </div>
                <div className="flex items-center space-x-3 text-white/70">
                  <DollarSign className="h-4 w-4 text-[#f9ed69]" />
                  <span className="text-sm">No entry fee</span>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Practice your Sudoku skills against AI. Perfect for warming up or learning new strategies.
              </p>
              <button 
                onClick={() => createMatch('SINGLE_PLAYER')}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-[#e94560] to-[#f9ed69] hover:from-[#d63847] hover:to-[#f7e742] disabled:from-gray-600 disabled:to-gray-700 text-[#1a1a2e] font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Play className="h-5 w-5" />
                    <span>Start Solo Game</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Multiplayer Free */}
          <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md border border-[#0f3460]/30 rounded-2xl shadow-2xl overflow-hidden hover:border-[#0f3460]/50 transition-all duration-300 transform hover:scale-105 group">
            <div className="p-6 border-b border-[#0f3460]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0f3460] to-[#e94560] rounded-full blur-lg opacity-50"></div>
                    <Users className="relative h-6 w-6 text-white" />
                  </div>
                  <span className="text-white font-semibold text-lg">Multiplayer Free</span>
                </div>
                <div className="px-3 py-1 bg-gradient-to-r from-[#0f3460]/20 to-[#e94560]/20 border border-[#0f3460]/30 rounded-full">
                  <span className="text-[#0f3460] text-sm font-medium">Free</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-white/70">
                  <Clock className="h-4 w-4 text-[#0f3460]" />
                  <span className="text-sm">30 minutes max</span>
                </div>
                <div className="flex items-center space-x-3 text-white/70">
                  <DollarSign className="h-4 w-4 text-[#f9ed69]" />
                  <span className="text-sm">No entry fee</span>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Challenge other players in real-time. First to solve wins bragging rights!
              </p>
              <button 
                onClick={() => createMatch('MULTIPLAYER_FREE')}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-[#0f3460] to-[#e94560] hover:from-[#0a2850] hover:to-[#d63847] disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Create Free Match</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Multiplayer Paid */}
          <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md border border-[#f9ed69]/30 rounded-2xl shadow-2xl overflow-hidden hover:border-[#f9ed69]/50 transition-all duration-300 transform hover:scale-105 group">
            <div className="p-6 border-b border-[#f9ed69]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#f9ed69] to-[#e94560] rounded-full blur-lg opacity-50"></div>
                    <Trophy className="relative h-6 w-6 text-white" />
                  </div>
                  <span className="text-white font-semibold text-lg">Prize Match</span>
                </div>
                <div className="px-3 py-1 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/20 border border-[#e94560]/30 rounded-full">
                  <span className="text-[#e94560] text-sm font-medium">₹50 Entry</span>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-white/70">
                  <Clock className="h-4 w-4 text-[#0f3460]" />
                  <span className="text-sm">30 minutes max</span>
                </div>
                <div className="flex items-center space-x-3 text-white/70">
                  <DollarSign className="h-4 w-4 text-[#f9ed69]" />
                  <span className="text-sm">₹50 entry fee</span>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Compete for real money! Winner takes 80% of the prize pool (₹80 for 2 players).
              </p>
              <button 
                onClick={() => createMatch('MULTIPLAYER_PAID', 50)}
                disabled={isCreating}
                className="w-full bg-gradient-to-r from-[#f9ed69] to-[#e94560] hover:from-[#f7e742] hover:to-[#d63847] disabled:from-gray-600 disabled:to-gray-700 text-[#1a1a2e] font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Create Prize Match</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/10 to-[#0f3460]/10 rounded-xl"></div>
          <div className="relative bg-[#1a1a2e]/90 backdrop-blur-md border border-[#e94560]/20 rounded-xl shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e94560]/5 to-[#0f3460]/5"></div>
            <div className="relative border-b border-[#e94560]/20 bg-gradient-to-r from-[#1a1a2e]/90 to-[#16213e]/90 p-6">
              <h3 className="text-2xl font-bold text-white flex items-center space-x-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full blur-lg opacity-50"></div>
                  <Sparkles className="relative h-6 w-6 text-white" />
                </div>
                <span>How the Cosmic Arena Works</span>
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="group p-4 bg-gradient-to-r from-[#e94560]/10 to-[#f9ed69]/10 border border-[#e94560]/20 rounded-lg hover:border-[#e94560]/40 transition-all duration-300">
                  <h4 className="font-semibold mb-2 text-white flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full"></div>
                    <span>Single Player Training</span>
                  </h4>
                  <p className="text-white/70 text-sm">Master your skills against our advanced AI in unlimited time. Perfect for honing your cosmic puzzle-solving abilities.</p>
                </div>
                <div className="group p-4 bg-gradient-to-r from-[#0f3460]/10 to-[#e94560]/10 border border-[#0f3460]/20 rounded-lg hover:border-[#0f3460]/40 transition-all duration-300">
                  <h4 className="font-semibold mb-2 text-white flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#0f3460] to-[#e94560] rounded-full"></div>
                    <span>Multiplayer Free Duels</span>
                  </h4>
                  <p className="text-white/70 text-sm">Challenge other cosmic warriors in real-time battles. No stakes, just pure competitive thrill and glory.</p>
                </div>
                <div className="group p-4 bg-gradient-to-r from-[#f9ed69]/10 to-[#e94560]/10 border border-[#f9ed69]/20 rounded-lg hover:border-[#f9ed69]/40 transition-all duration-300">
                  <h4 className="font-semibold mb-2 text-white flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gradient-to-r from-[#f9ed69] to-[#e94560] rounded-full"></div>
                    <span>Prize Tournaments</span>
                  </h4>
                  <p className="text-white/70 text-sm">Enter the ultimate cosmic arena! Entry fees fuel the prize pool. Champions claim 80% of the stellar rewards.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="text-center">
        <button 
          onClick={() => router.push('/dashboard')}
          className="group relative px-8 py-3 bg-gradient-to-r from-[#e94560]/20 to-[#0f3460]/20 border border-[#e94560]/30 rounded-xl text-white font-medium transition-all duration-300 hover:from-[#e94560]/30 hover:to-[#0f3460]/30 hover:border-[#e94560]/50 hover:shadow-lg hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#e94560] to-[#0f3460] rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          <span className="relative flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Cosmic Dashboard</span>
          </span>
        </button>
      </div>
      </div>
    </div>
  )
}
