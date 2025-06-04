'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/contexts/SocketContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SudokuGridComponent } from '@/components/sudoku/SudokuGrid'
import {
  Users,
  Timer,
  Trophy,
  Wifi,
  WifiOff,
  Home,
  User,
  Crown
} from 'lucide-react'
import Link from 'next/link'

interface MultiplayerGameProps {
  matchId: string
  onGameComplete?: (result: { winner: string; score: number; time: number }) => void
}

interface GameProgress {
  playerId: string
  playerName: string
  grid: number[][]
  completionPercentage: number
  isComplete: boolean
}

export default function MultiplayerGame({ 
  matchId, 
  onGameComplete 
}: MultiplayerGameProps) {
  const { data: session } = useSession()
  const { socket, isConnected, joinGame, makeMove, gameState } = useSocket()
  
  const [gameGrid, setGameGrid] = useState<number[][]>([])
  const [originalGrid, setOriginalGrid] = useState<number[][]>([])
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [playerMoves, setPlayerMoves] = useState(0)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [players, setPlayers] = useState<GameProgress[]>([])
  const [opponentProgress, setOpponentProgress] = useState<number[][]>([])

  // Initialize game
  useEffect(() => {
    if (matchId && session?.user?.id && isConnected) {
      joinGame(matchId)
    }
  }, [matchId, session?.user?.id, isConnected, joinGame])

  // Handle game state updates
  useEffect(() => {
    if (gameState) {
      setGameGrid(gameState.gameState)
      setOriginalGrid(gameState.gameState.map(row => [...row]))
      setIsGameStarted(gameState.isActive)
      
      // Update players list
      const currentPlayers: GameProgress[] = gameState.players.map(playerId => ({
        playerId,
        playerName: playerId === session?.user?.id ? 'You' : 'Opponent',
        grid: gameState.gameState,
        completionPercentage: calculateCompletionPercentage(gameState.gameState),
        isComplete: false
      }))
      setPlayers(currentPlayers)
    }
  }, [gameState, session?.user?.id])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isGameStarted && !gameComplete) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isGameStarted, gameComplete])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleMoveUpdate = (data: any) => {
      if (data.playerId !== session?.user?.id) {
        setOpponentProgress(data.gameState)
      }
    }

    const handleGameComplete = (data: any) => {
      setGameComplete(true)
      setWinner(data.winner)
      setIsGameStarted(false)
      
      if (data.winner === session?.user?.id) {
        const score = calculateScore()
        onGameComplete?.({ 
          winner: data.winner, 
          score, 
          time: timeElapsed 
        })
      }
    }

    socket.on('move-made', handleMoveUpdate)
    socket.on('game-completed', handleGameComplete)

    return () => {
      socket.off('move-made', handleMoveUpdate)
      socket.off('game-completed', handleGameComplete)
    }
  }, [socket, session?.user?.id, timeElapsed, onGameComplete])

  const calculateCompletionPercentage = (grid: number[][]): number => {
    let filledCells = 0
    let totalCells = 0
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (originalGrid[row]?.[col] === 0) {
          totalCells++
          if (grid[row][col] !== 0) {
            filledCells++
          }
        }
      }
    }
    
    return totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0
  }

  const isGridComplete = (grid: number[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) return false
      }
    }
    return true
  }

  const handleGridChange = useCallback(async (newGrid: number[][]) => {
    setGameGrid(newGrid)
    setPlayerMoves(prev => prev + 1)

    // Send move to server via Socket.IO
    const lastMove = findLastMove(gameGrid, newGrid)
    if (lastMove && socket) {
      makeMove(lastMove.row, lastMove.col, lastMove.value)
      
      // Also send to API for persistence
      try {
        await fetch(`/api/matches/${matchId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            row: lastMove.row,
            col: lastMove.col,
            value: lastMove.value,
            grid: newGrid,
            timeElapsed,
            movesCount: playerMoves + 1,
            hintsUsed: 0,
            errorsCount: 0
          })
        })
      } catch (error) {
        console.error('Error saving move:', error)
      }
    }

    // Check if player completed
    if (isGridComplete(newGrid)) {
      setGameComplete(true)
      setWinner(session?.user?.id || '')
      setIsGameStarted(false)
    }
  }, [gameGrid, socket, makeMove, matchId, timeElapsed, playerMoves, session?.user?.id])

  const findLastMove = (oldGrid: number[][], newGrid: number[][]) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (oldGrid[row][col] !== newGrid[row][col]) {
          return { row, col, value: newGrid[row][col] }
        }
      }
    }
    return null
  }

  const calculateScore = (): number => {
    const baseScore = 1000
    const timeBonus = Math.max(0, 1800 - timeElapsed) // Max 30 min
    const movesPenalty = playerMoves * 2
    
    return Math.max(100, baseScore + timeBonus - movesPenalty)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getConnectionStatus = () => {
    if (!isConnected) {
      return { icon: WifiOff, text: 'Disconnected', color: 'text-red-500' }
    }
    return { icon: Wifi, text: 'Connected', color: 'text-green-500' }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6 text-green-600" />
                <h1 className="text-2xl font-bold">Multiplayer Match</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <connectionStatus.icon className={`w-5 h-5 ${connectionStatus.color}`} />
              <span className={`text-sm ${connectionStatus.color}`}>
                {connectionStatus.text}
              </span>
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="mb-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="text-center text-red-700">
                  Connection lost. Trying to reconnect...
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Your Game */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Your Game</span>
                  </div>
                  {winner === session?.user?.id && (
                    <Badge className="bg-green-500 text-white">
                      <Crown className="w-4 h-4 mr-1" />
                      Winner!
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SudokuGridComponent
                  grid={gameGrid}
                  originalGrid={originalGrid}
                  onGridChange={handleGridChange}
                  isReadonly={!isGameStarted || gameComplete || !isConnected}
                  className="w-full max-w-md mx-auto"
                />
                <div className="mt-4 text-center">
                  <div className="text-lg font-semibold">
                    {calculateCompletionPercentage(gameGrid)}% Complete
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Game Status */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Timer className="w-5 h-5" />
                  Match Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">{formatTime(timeElapsed)}</div>
                  <div className="text-sm text-gray-600">Elapsed Time</div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold">{playerMoves}</div>
                    <div className="text-sm text-gray-600">Your Moves</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold">{players.length}</div>
                    <div className="text-sm text-gray-600">Players</div>
                  </div>
                </div>

                {!isGameStarted && !gameComplete && (
                  <div className="text-center text-gray-600">
                    Waiting for all players to join...
                  </div>
                )}

                {gameComplete && (
                  <div className="text-center">
                    <Badge 
                      className={`text-lg p-2 ${
                        winner === session?.user?.id 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-500 text-white'
                      }`}
                    >
                      {winner === session?.user?.id ? '🎉 You Won!' : '😔 You Lost'}
                    </Badge>
                    {winner === session?.user?.id && (
                      <div className="mt-2 text-lg font-bold">
                        Score: {calculateScore()}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Players Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {players.map((player, index) => (
                    <div key={player.playerId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{player.playerName}</span>
                        {winner === player.playerId && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <Badge variant="outline">
                        {player.completionPercentage}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opponent's Game */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Opponent</span>
                  </div>
                  {winner && winner !== session?.user?.id && (
                    <Badge className="bg-red-500 text-white">
                      <Crown className="w-4 h-4 mr-1" />
                      Winner!
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SudokuGridComponent
                  grid={opponentProgress}
                  originalGrid={originalGrid}
                  isReadonly={true}
                  className="w-full max-w-md mx-auto opacity-75"
                />
                <div className="mt-4 text-center">
                  <div className="text-lg font-semibold">
                    {calculateCompletionPercentage(opponentProgress)}% Complete
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
