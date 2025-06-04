'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SudokuGridComponent } from '@/components/sudoku/SudokuGrid'
import { 
  Users, 
  Trophy, 
  AlertCircle,
  Timer,
  Crown
} from 'lucide-react'

interface GameRoomProps {
  matchId: string
}

export function GameRoom({ matchId }: GameRoomProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const { socket, isConnected, joinGame, makeMove, leaveGame, gameState } = useSocket()
  
  const [messages, setMessages] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState<number>(1800) // 30 minutes

  const addMessage = (message: string) => {
    setMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }

    // Join the game room
    if (socket && isConnected) {
      joinGame(matchId)
    }
  }, [socket, isConnected, matchId, session, joinGame, router])

  // Handle Socket events for UI updates
  useEffect(() => {
    if (!socket) return

    interface PlayerJoinedData {
      userId: string
      game: {
        players: string[]
      }
    }

    interface MoveMadeData {
      row: number
      col: number
      value: number
    }

    interface GameCompletedData {
      winner: string
    }

    socket.on('player-joined', (data: PlayerJoinedData) => {
      addMessage(`Player joined the game. Players: ${data.game.players.length}`)
    })

    socket.on('move-made', (data: MoveMadeData) => {
      addMessage(`Player made a move: (${data.row + 1}, ${data.col + 1}) = ${data.value}`)
    })

    socket.on('game-completed', (data: GameCompletedData) => {
      if (data.winner === session?.user?.id) {
        addMessage('🎉 Congratulations! You won!')
      } else {
        addMessage('Game completed. Better luck next time!')
      }
    })

    socket.on('player-left', () => {
      addMessage(`Player left the game`)
    })

    return () => {
      socket.off('player-joined')
      socket.off('move-made')
      socket.off('game-completed')
      socket.off('player-left')
    }
  }, [socket, session])

  // Timer effect
  useEffect(() => {
    if (!gameState?.isActive) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          addMessage('⏰ Time is up!')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState?.isActive])

  const handleCellChange = (updatedGrid: (number | null)[][]) => {
    // Find the difference between old and new grid
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState?.gameState[row][col] !== updatedGrid[row][col]) {
          const value = updatedGrid[row][col] || 0
          if (gameState?.gameState[row][col] === 0) { // Only allow changes to empty cells
            makeMove(row, col, value)
          }
          return
        }
      }
    }
  }

  const handleLeaveGame = () => {
    leaveGame()
    router.push('/dashboard')
  }

  const isMyTurn = () => {
    if (!gameState || !session?.user?.id) return false
    const myPlayerIndex = gameState.players.indexOf(session.user.id)
    return myPlayerIndex === gameState.currentPlayer
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
              <p className="text-gray-600 mb-4">Please sign in to join the game.</p>
              <Button onClick={() => router.push('/auth/signin')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Connecting...</h3>
              <p className="text-gray-600">Establishing connection to game server.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-pulse bg-gray-200 h-12 w-12 rounded mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Loading Game...</h3>
              <p className="text-gray-600">Joining game room {matchId}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Game Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <span>Game #{matchId.slice(-8)}</span>
              {!gameState.isActive && (
                <Badge variant="secondary">Game Completed</Badge>
              )}
            </span>
            <div className="flex items-center space-x-4">
              <Badge variant={isMyTurn() ? "default" : "secondary"}>
                {isMyTurn() ? "Your Turn" : "Opponent's Turn"}
              </Badge>
              {gameState.isActive && (
                <div className="flex items-center space-x-1">
                  <Timer className="h-4 w-4" />
                  <span className="font-mono text-sm">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sudoku Grid */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              <SudokuGridComponent
                grid={gameState.gameState}
                onGridChange={handleCellChange}
                isReadonly={!isMyTurn() || !gameState.isActive}
              />
            </CardContent>
          </Card>
        </div>

        {/* Game Info Sidebar */}
        <div className="space-y-4">
          {/* Players */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Players ({gameState.players.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {gameState.players.map((playerId, index) => (
                <div key={playerId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-2">
                    {index === gameState.currentPlayer && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium">
                      {playerId === session?.user?.id ? 'You' : `Player ${index + 1}`}
                    </span>
                  </div>
                  <Badge variant="outline">
                    {index === gameState.currentPlayer ? 'Active' : 'Waiting'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Game Controls */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button 
                variant="outline" 
                onClick={handleLeaveGame}
                className="w-full"
              >
                Leave Game
              </Button>
            </CardContent>
          </Card>

          {/* Game Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Game Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {messages.slice(-10).map((message, index) => (
                  <p key={index} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    {message}
                  </p>
                ))}
                {messages.length === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    No activity yet...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
