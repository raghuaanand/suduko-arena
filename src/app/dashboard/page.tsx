'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  Settings
} from 'lucide-react'

export default function Dashboard() {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">{session.user?.name}</span>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {session.user?.name?.split(' ')[0]}! 👋
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Ready for your next Sudoku challenge?
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loadingWallet ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                  ) : (
                    `₹${walletBalance.toFixed(2)}`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-xs"
                    onClick={() => router.push('/wallet')}
                  >
                    Manage wallet →
                  </Button>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Games Played</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Start your first game!</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tournaments Won</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">Time to claim your first victory!</p>
              </CardContent>
            </Card>
          </div>

          {/* Game Modes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bot className="w-6 h-6 text-blue-600" />
                  <CardTitle>Practice vs AI</CardTitle>
                </div>
                <CardDescription>
                  Create a new solo practice match or multiplayer game
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => router.push('/create-match')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Create Match
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="w-6 h-6 text-green-600" />
                  <CardTitle>Multiplayer Free</CardTitle>
                </div>
                <CardDescription>
                  Join multiplayer matches and challenge other players
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => router.push('/create-match')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Create Match
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Crown className="w-6 h-6 text-purple-600" />
                  <CardTitle>Paid Tournaments</CardTitle>
                </div>
                <CardDescription>
                  Compete for real money prizes in premium tournaments
                </CardDescription>
              </CardHeader>
              <CardContent>              <Button 
                onClick={() => router.push('/tournaments')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                View Tournaments
              </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/create-match')}
                  className="w-full"
                >
                  Create Match
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/matches')}
                  className="w-full"
                >
                  View Matches
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/tournaments')}
                  className="w-full"
                >
                  Tournaments
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/wallet')}
                  className="w-full"
                >
                  Wallet
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/leaderboard')}
                  className="w-full flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Leaderboard
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  className="w-full flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest games and tournaments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                  <p className="text-sm">Start playing to see your game history here!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
