'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchMaking } from '@/components/MatchMaking'
import { 
  Trophy, 
  Users, 
  Bot, 
  Wallet, 
  Play, 
  Crown,
  LogOut,
  User,
  BarChart3,
  Settings,
  Target,
  Star,
  Zap,
  Sparkles
} from 'lucide-react'

function DashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedGameMode, setSelectedGameMode] = useState<'SINGLE' | 'MULTIPLAYER_FREE' | 'PAID_TOURNAMENT' | null>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)
  const [loadingWallet, setLoadingWallet] = useState(true)

  useEffect(() => {
    if (status === 'loading') return // Still loading
    if (!session) router.push('/auth/signin') // Not logged in
    
    // Check for mode parameter from homepage
    const mode = searchParams.get('mode')
    if (mode && session) {
      switch (mode) {
        case 'ai':
          setSelectedGameMode('SINGLE')
          break
        case 'multiplayer':
          setSelectedGameMode('MULTIPLAYER_FREE')
          break
        case 'tournament':
          setSelectedGameMode('PAID_TOURNAMENT')
          break
      }
    }

    // Fetch wallet balance
    if (session?.user?.id) {
      fetchWalletBalance()
    }
  }, [session, status, router, searchParams])

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        setWalletBalance(data.balance || 0)
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
    } finally {
      setLoadingWallet(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden flex items-center justify-center">
        {/* Cosmic background for loading */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/15 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-[#0f3460]/30 to-[#e94560]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-[#e94560]/20 border-t-[#f9ed69] rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Target className="w-8 h-8 text-[#f9ed69] animate-pulse" />
            </div>
          </div>
          <p className="text-white/80 text-lg">Initializing cosmic dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to signin
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  // Show match-making if a game mode is selected
  if (selectedGameMode) {
    return (
      <MatchMaking 
        gameMode={selectedGameMode} 
        onBack={() => setSelectedGameMode(null)} 
      />
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

      {/* Header */}
      <header className="w-full border-b border-[#e94560]/30 bg-[#1a1a2e]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#e94560] to-[#f9ed69] rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <Target className="w-6 h-6 text-[#1a1a2e]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f9ed69] to-[#e94560]">
                    Command Center
                  </span>
                </h1>
                <p className="text-xs text-white/60">Cosmic Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-[#1a1a2e]/50 border border-[#e94560]/30 rounded-lg backdrop-blur-sm">
                <User className="w-4 h-4 text-[#f9ed69]" />
                <span className="text-sm text-white">{session.user?.name}</span>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 border-[#e94560]/30 text-black hover:bg-[#e94560]/20 hover:text-white"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="mb-4">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/20 border border-[#e94560]/30 rounded-full text-[#f9ed69] text-sm font-medium backdrop-blur-sm">
                🌌 Welcome Back, Commander
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f9ed69] to-[#e94560]">
                Ready for Battle,
              </span>
              <br />
              <span className="text-white">{session.user?.name?.split(' ')[0]}?</span>
            </h2>
            <p className="text-white/70 text-lg">
              Your cosmic adventure awaits in the stellar arena
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="relative overflow-hidden border-2 border-[#e94560]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#f9ed69]/20 to-[#e94560]/10 rounded-bl-full"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">Cosmic Wallet</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-[#1a1a2e]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#f9ed69]">
                  {loadingWallet ? (
                    <div className="animate-pulse bg-[#e94560]/20 h-8 w-20 rounded"></div>
                  ) : (
                    `₹${walletBalance.toFixed(2)}`
                  )}
                </div>
                <p className="text-xs text-white/60 mt-2">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-xs text-[#f9ed69] hover:text-white"
                    onClick={() => router.push('/wallet')}
                  >
                    Manage stellar funds →
                  </Button>
                </p>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-2 border-[#0f3460]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#0f3460]/20 to-[#e94560]/10 rounded-bl-full"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">Battles Fought</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-[#0f3460] to-[#e94560] rounded-lg flex items-center justify-center">
                  <Play className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#f9ed69]">0</div>
                <p className="text-xs text-white/60">Launch your first cosmic mission!</p>
              </CardContent>
            </Card>
            
            <Card className="relative overflow-hidden border-2 border-[#f9ed69]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#f9ed69]/20 to-[#e94560]/10 rounded-bl-full"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">Stellar Victories</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-lg flex items-center justify-center">
                  <Crown className="h-4 w-4 text-[#1a1a2e]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#f9ed69]">0</div>
                <p className="text-xs text-white/60">Claim your galactic throne!</p>
              </CardContent>
            </Card>
          </div>

          {/* Game Modes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-2 border-[#e94560]/30 hover:border-[#e94560]/60 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md transform hover:scale-105 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e94560]/30 to-[#f9ed69]/20 rounded-bl-full opacity-60"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#f9ed69] rounded-full animate-ping"></div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#e94560] to-[#f9ed69] rounded-xl flex items-center justify-center shadow-lg">
                    <Bot className="w-6 h-6 text-[#1a1a2e]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white font-bold">Cosmic Training</CardTitle>
                    <div className="text-sm text-[#f9ed69] font-medium">vs AI Guardians</div>
                  </div>
                </div>
                <CardDescription className="text-white/70 leading-relaxed">
                  Master your skills against stellar AI opponents across multiple difficulty realms
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Button 
                  onClick={() => router.push('/create-match')}
                  className="w-full bg-gradient-to-r from-[#e94560] to-[#f9ed69] hover:from-[#d63847] hover:to-[#f7e742] text-[#1a1a2e] border-0 font-semibold shadow-lg group-hover:shadow-xl transform transition-all duration-300"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Begin Training
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-2 border-[#0f3460]/30 hover:border-[#0f3460]/60 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md transform hover:scale-105 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0f3460]/30 to-[#e94560]/20 rounded-bl-full opacity-60"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#0f3460] rounded-full animate-ping"></div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0f3460] to-[#e94560] rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white font-bold">Stellar Duels</CardTitle>
                    <div className="text-sm text-[#f9ed69] font-medium">Free Combat</div>
                  </div>
                </div>
                <CardDescription className="text-white/70 leading-relaxed">
                  Challenge fellow cosmic warriors in real-time multiplayer battles across the galaxy
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Button 
                  onClick={() => router.push('/create-match')}
                  className="w-full bg-gradient-to-r from-[#0f3460] to-[#e94560] hover:from-[#0a2850] hover:to-[#d63847] text-white border-0 font-semibold shadow-lg group-hover:shadow-xl transform transition-all duration-300"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Find Opponent
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-2 border-[#f9ed69]/50 hover:border-[#f9ed69]/80 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md transform hover:scale-105 cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#f9ed69]/40 to-[#e94560]/20 rounded-bl-full opacity-60"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#f9ed69] rounded-full animate-ping"></div>
              
              {/* Premium badge */}
              <div className="absolute top-4 right-4 bg-gradient-to-r from-[#f9ed69] to-[#e94560] text-[#1a1a2e] text-xs font-bold px-2 py-1 rounded-full">
                PREMIUM
              </div>
              
              <CardHeader className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-xl flex items-center justify-center shadow-lg">
                    <Crown className="w-6 h-6 text-[#1a1a2e]" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white font-bold">Galactic Championships</CardTitle>
                    <div className="text-sm text-[#f9ed69] font-medium">Epic Rewards</div>
                  </div>
                </div>
                <CardDescription className="text-white/70 leading-relaxed">
                  Compete for legendary treasures and eternal glory in premium tournaments
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <Button 
                  onClick={() => router.push('/tournaments')}
                  className="w-full bg-gradient-to-r from-[#f9ed69] to-[#e94560] hover:from-[#f7e742] hover:to-[#d63847] text-[#1a1a2e] border-0 font-semibold shadow-lg group-hover:shadow-xl transform transition-all duration-300"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  View Tournaments
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="relative overflow-hidden border-2 border-[#e94560]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#f9ed69]/10 to-[#e94560]/5 rounded-bl-full"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#f9ed69]" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10 ">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/create-match')}
                  className="w-full border-[#e94560]/30 text-black hover:bg-[#e94560]/20 hover:text-white"
                >
                  Create Match
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/matches')}
                  className="w-full border-[#f9ed69]/30 text-black hover:bg-[#f9ed69]/20 hover:text-white"
                >
                  View Matches
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/tournaments')}
                  className="w-full border-[#0f3460]/30 text-black hover:bg-[#0f3460]/20 hover:text-white"
                >
                  Tournaments
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/wallet')}
                  className="w-full border-[#e94560]/30 text-black hover:bg-[#e94560]/20 hover:text-white"
                >
                  Wallet
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/leaderboard')}
                  className="w-full flex items-center gap-2 border-[#f9ed69]/30 text-black hover:bg-[#f9ed69]/20 hover:text-white"
                >
                  <BarChart3 className="w-4 h-4" />
                  Leaderboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  className="w-full flex items-center gap-2 border-[#0f3460]/30 text-black hover:bg-[#0f3460]/20 hover:text-white"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="mt-8">
            <Card className="relative overflow-hidden border-2 border-[#f9ed69]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#f9ed69]/10 to-[#e94560]/5 rounded-br-full"></div>
              <CardHeader className="relative z-10">
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-[#f9ed69]" />
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-white/70">Your latest cosmic adventures and achievements</CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#e94560]/20 to-[#f9ed69]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#e94560]/30">
                      <Play className="w-8 h-8 text-[#f9ed69] opacity-60" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#f9ed69] rounded-full animate-ping opacity-50"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No cosmic activity yet</h3>
                  <p className="text-white/60 mb-6">Begin your stellar journey to see your battle history here!</p>
                  <Button 
                    onClick={() => router.push('/create-match')}
                    className="bg-gradient-to-r from-[#f9ed69] to-[#e94560] hover:from-[#f7e742] hover:to-[#d63847] text-[#1a1a2e] border-0 font-semibold"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Start Your First Battle
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

// Loading component for Suspense fallback
function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden flex items-center justify-center">
      {/* Cosmic background for loading */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/15 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-[#0f3460]/30 to-[#e94560]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
      </div>
      
      <div className="text-center relative z-10">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-[#e94560]/20 border-t-[#f9ed69] rounded-full animate-spin mx-auto mb-6"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Target className="w-10 h-10 text-[#f9ed69] animate-pulse" />
          </div>
        </div>
        <p className="text-white/80 text-xl">Loading cosmic dashboard...</p>
        <div className="flex justify-center items-center space-x-2 mt-4">
          <div className="w-2 h-2 bg-[#f9ed69] rounded-full animate-ping"></div>
          <div className="w-2 h-2 bg-[#e94560] rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
          <div className="w-2 h-2 bg-[#0f3460] rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}
