'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, Clock, Trophy, ArrowLeft } from 'lucide-react'

interface MatchMakingProps {
  gameMode: 'SINGLE' | 'MULTIPLAYER_FREE' | 'PAID_TOURNAMENT'
  onBack: () => void
}

export function MatchMaking({ gameMode, onBack }: MatchMakingProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  const [matchFound, setMatchFound] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')

  // Debug authentication status
  React.useEffect(() => {
    setDebugInfo(`Auth Status: ${status}, User ID: ${session?.user?.id || 'None'}, Email: ${session?.user?.email || 'None'}`)
  }, [session, status])

  const handleStartGame = async () => {
    if (!session?.user?.id) {
      alert('Please sign in to start a game')
      router.push('/auth/signin')
      return
    }
    
    setIsSearching(true)
    
    try {
      // Map frontend game modes to API expected values
      const typeMapping = {
        'SINGLE': 'SINGLE_PLAYER',
        'MULTIPLAYER_FREE': 'MULTIPLAYER_FREE', 
        'PAID_TOURNAMENT': 'MULTIPLAYER_PAID'
      }
      
      console.log('Creating match with data:', {
        type: typeMapping[gameMode],
        entryFee: gameMode === 'PAID_TOURNAMENT' ? 100 : 0,
        difficulty: 'medium'
      })
      
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: typeMapping[gameMode],
          entryFee: gameMode === 'PAID_TOURNAMENT' ? 100 : 0,
          difficulty: 'medium'
        })
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error response:', errorData)
        throw new Error(errorData.message || `Failed to create match (${response.status})`)
      }

      const data = await response.json()
      console.log('Match creation successful:', data)
      
      if (gameMode === 'SINGLE') {
        // For single player, should always have match object
        if (data.match && data.match.id) {
          router.push(`/game/${data.match.id}`)
        } else {
          throw new Error('Invalid single player match response')
        }
      } else {
        // For multiplayer, handle different response structures
        if (data.status === 'matched' && data.match && data.match.id) {
          // Immediately matched with another player
          router.push(`/game/${data.match.id}`)
        } else if (data.status === 'queued') {
          // Added to matchmaking queue, waiting for opponent
          setMatchFound(true)
          // Poll for match updates or use real-time updates
          setTimeout(() => {
            // For now, redirect back to dashboard after waiting
            alert('Still waiting for opponent. Please try again later.')
            onBack()
          }, 5000)
        } else if (data.match && data.match.id) {
          // Created new waiting match
          setMatchFound(true)
          setTimeout(() => {
            router.push(`/game/${data.match.id}`)
          }, 3000)
        } else {
          throw new Error('Invalid multiplayer match response structure')
        }
      }
    } catch (error) {
      console.error('Error creating match:', error)
      setIsSearching(false)
      
      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Create a more user-friendly error message
      const userFriendlyError = `Failed to create match: ${errorMessage}\n\nTroubleshooting:\n1. Make sure you're signed in\n2. Check your internet connection\n3. Try refreshing the page\n\nIf the problem persists, please contact support.`
      
      alert(userFriendlyError)
    }
  }

  const getGameModeInfo = () => {
    switch (gameMode) {
      case 'SINGLE':
        return {
          title: 'Practice vs AI',
          description: 'Hone your skills against our intelligent AI',
          icon: '🤖',
          players: '1 Player',
          entryFee: 'Free',
          prize: 'Experience Points'
        }
      case 'MULTIPLAYER_FREE':
        return {
          title: 'Multiplayer Free',
          description: 'Compete against other players for fun',
          icon: '👥',
          players: '2 Players',
          entryFee: 'Free',
          prize: 'Bragging Rights'
        }
      case 'PAID_TOURNAMENT':
        return {
          title: 'Paid Tournament',
          description: 'Compete for real money prizes',
          icon: '👑',
          players: '2-8 Players',
          entryFee: '₹100',
          prize: '₹500 - ₹5000'
        }
    }
  }

  const gameInfo = getGameModeInfo()

  // Show loading while authentication is being checked
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Checking authentication status</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Redirect to sign-in if not authenticated
  if (status === 'unauthenticated' || !session?.user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please sign in to start playing</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600">You need to sign in to create and join matches.</p>
            <Button 
              onClick={() => router.push('/auth/signin')}
              className="w-full"
            >
              Sign In
            </Button>
            <Button 
              onClick={onBack}
              variant="outline"
              className="w-full"
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSearching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">{gameInfo.icon}</div>
            <CardTitle>{matchFound ? 'Match Found!' : 'Finding Players...'}</CardTitle>
            <CardDescription>
              {matchFound ? 'Preparing your game room' : `Searching for ${gameInfo.players.toLowerCase()}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{matchFound ? 'Starting game...' : 'Please wait...'}</span>
            </div>
            
            {!matchFound && gameMode !== 'SINGLE' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Players found:</span>
                  <Badge>1/{gameMode === 'PAID_TOURNAMENT' ? '8' : '2'}</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full w-1/2"></div>
                </div>
              </div>
            )}

            {!matchFound && (
              <Button 
                onClick={() => {
                  setIsSearching(false)
                  onBack()
                }}
                variant="outline"
                className="w-full"
              >
                Cancel Search
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button 
          onClick={onBack}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">{gameInfo.icon}</div>
            <CardTitle className="text-2xl">{gameInfo.title}</CardTitle>
            <CardDescription className="text-lg">{gameInfo.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Game Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Users className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                <div className="font-semibold">{gameInfo.players}</div>
                <div className="text-sm text-gray-600">Players</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                <div className="font-semibold">{gameInfo.entryFee}</div>
                <div className="text-sm text-gray-600">Entry Fee</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Clock className="w-6 h-6 mx-auto mb-2 text-green-600" />
                <div className="font-semibold">{gameInfo.prize}</div>
                <div className="text-sm text-gray-600">Prize</div>
              </div>
            </div>

            {/* Debug Information */}
            {process.env.NODE_ENV === 'development' && (
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                <strong>Debug Info:</strong> {debugInfo}
              </div>
            )}

            {/* Game Rules */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Game Rules</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Fill the 9×9 grid with digits 1-9</li>
                <li>• Each row, column, and 3×3 box must contain all digits 1-9</li>
                <li>• First player to complete the puzzle wins</li>
                {gameMode === 'MULTIPLAYER_FREE' && (
                  <li>• Players take turns making moves</li>
                )}
                {gameMode === 'PAID_TOURNAMENT' && (
                  <>
                    <li>• Tournament bracket system</li>
                    <li>• Winner takes the prize pool</li>
                  </>
                )}
                <li>• Game has a 30-minute time limit</li>
              </ul>
            </div>

            {/* Wallet Warning for Paid Tournament */}
            {gameMode === 'PAID_TOURNAMENT' && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold">Entry Fee Required</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  ₹100 will be deducted from your wallet when you start the tournament.
                  Make sure you have sufficient balance.
                </p>
              </div>
            )}

            {/* Start Game Button */}
            <Button 
              onClick={handleStartGame}
              className="w-full text-lg py-6"
              size="lg"
            >
              {gameMode === 'SINGLE' ? 'Start Practice' : 
               gameMode === 'MULTIPLAYER_FREE' ? 'Find Match' : 
               'Join Tournament'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
