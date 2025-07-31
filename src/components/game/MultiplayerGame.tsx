'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/contexts/SocketContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SudokuGridComponent } from '@/components/sudoku/SudokuGrid'
import { SudokuGrid } from '@/types'
import {
  Users,
  Timer,
  Wifi,
  WifiOff,
  Home,
  User,
  Crown,
  MessageCircle,
  Lightbulb,
  Flag
} from 'lucide-react'
import Link from 'next/link'

interface MultiplayerGameProps {
  matchId: string
  onGameComplete?: (result: { winner: string; score: number; time: number }) => void
}

export default function MultiplayerGame({ 
  matchId, 
  onGameComplete 
}: MultiplayerGameProps) {
  const { data: session } = useSession()
  const { 
    socket, 
    isConnected, 
    joinGame, 
    makeMove, 
    requestHint,
    setReady,
    surrender,
    gameState,
    roomState 
  } = useSocket()
  
  const [gameGrid, setGameGrid] = useState<number[][]>([])
  const [originalGrid, setOriginalGrid] = useState<number[][]>([])
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [playerMoves, setPlayerMoves] = useState(0)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [opponentProgress, setOpponentProgress] = useState<number[][]>([])
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [showChat, setShowChat] = useState(false)

  // Helper functions defined early
  const calculateCompletionPercentage = useCallback((grid: number[][]): number => {
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
  }, [originalGrid])

  const calculateScore = useCallback((): number => {
    const baseScore = 1000
    const timeBonus = Math.max(0, 1800 - timeElapsed) // Max 30 min
    const movesPenalty = playerMoves * 2
    
    return Math.max(100, baseScore + timeBonus - movesPenalty)
  }, [timeElapsed, playerMoves])

  // Initialize game
  useEffect(() => {
    if (matchId && session?.user?.id && isConnected) {
      joinGame(matchId)
    }
  }, [matchId, session?.user?.id, isConnected, joinGame])

  // Handle game state updates from room state
  useEffect(() => {
    if (roomState) {
      // Initialize empty grid if not set
      if (gameGrid.length === 0) {
        const emptyGrid = Array(9).fill(null).map(() => Array(9).fill(0))
        setGameGrid(emptyGrid)
        setOriginalGrid(emptyGrid)
      }
      
      setIsGameStarted(roomState.status === 'IN_PROGRESS')
      setGameComplete(roomState.status === 'COMPLETED')
      
      // Update time remaining
      if (roomState.gameState.timeRemaining !== undefined) {
        const totalTime = roomState.settings.timeLimit * 60 // Convert to seconds
        const elapsed = totalTime - roomState.gameState.timeRemaining
        setTimeElapsed(elapsed)
      }

      // Update hints used
      const currentPlayer = roomState.players.find(p => p.id === session?.user?.id)
      if (currentPlayer) {
        setHintsUsed(currentPlayer.hintsUsed)
      }
    }
  }, [roomState, gameGrid, session?.user?.id, calculateCompletionPercentage])

  // Handle legacy game state updates for compatibility
  useEffect(() => {
    if (gameState && gameState.gameState.length > 0) {
      setGameGrid(gameState.gameState)
      setOriginalGrid(gameState.gameState.map(row => [...row]))
      setIsGameStarted(gameState.isActive)
    }
  }, [gameState, session?.user?.id, calculateCompletionPercentage])

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

    const handleMoveUpdate = (data: { playerId: string; gameState: number[][] }) => {
      if (data.playerId !== session?.user?.id) {
        setOpponentProgress(data.gameState)
      }
    }

    const handleGameComplete = (data: { winner: string }) => {
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
  }, [socket, session?.user?.id, timeElapsed, onGameComplete, calculateScore])

  const isGridComplete = (grid: number[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) return false
      }
    }
    return true
  }

  // Convert number[][] to SudokuGrid for component props
  const convertToSudokuGrid = (grid: number[][]): SudokuGrid => {
    return grid.map(row => row.map(cell => cell === 0 ? null : cell))
  }

  const handleGridChange = useCallback(async (newGrid: SudokuGrid) => {
    // Convert SudokuGrid to number[][] for internal state
    const numberGrid = newGrid.map(row => row.map(cell => cell ?? 0))
    setGameGrid(numberGrid)
    setPlayerMoves(prev => prev + 1)

    // Send move to server via Socket.IO
    const lastMove = findLastMove(gameGrid, numberGrid)
    if (lastMove && socket) {
      makeMove(lastMove.row, lastMove.col, lastMove.value, {
        timeElapsed,
        movesCount: playerMoves + 1,
        hintsUsed: hintsUsed,
        errorsCount: 0
      })
      
      // Also send to API for persistence
      try {
        await fetch(`/api/matches/${matchId}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            row: lastMove.row,
            col: lastMove.col,
            value: lastMove.value,
            grid: numberGrid,
            timeElapsed,
            movesCount: playerMoves + 1,
            hintsUsed: hintsUsed,
            errorsCount: 0
          })
        })
      } catch (error) {
        console.error('Error saving move:', error)
      }
    }

    // Check if player completed
    if (isGridComplete(numberGrid)) {
      setGameComplete(true)
      setWinner(session?.user?.id || '')
      setIsGameStarted(false)
    }
  }, [gameGrid, socket, makeMove, matchId, timeElapsed, playerMoves, hintsUsed, session?.user?.id])

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

  // Hint functionality
  const handleRequestHint = useCallback(() => {
    const currentPlayer = roomState?.players.find(p => p.id === session?.user?.id)
    if (currentPlayer && currentPlayer.hintsRemaining > 0) {
      requestHint()
    }
  }, [roomState, session?.user?.id, requestHint])

  // Ready functionality
  const handleToggleReady = useCallback(() => {
    setReady(!isPlayerReady)
    setIsPlayerReady(!isPlayerReady)
  }, [isPlayerReady, setReady])

  // Surrender functionality
  const handleSurrender = useCallback(() => {
    if (confirm('Are you sure you want to surrender? This will end the game.')) {
      surrender()
    }
  }, [surrender])

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

  const currentPlayer = roomState?.players.find(p => p.id === session?.user?.id)
  const canUseHint = currentPlayer && currentPlayer.hintsRemaining > 0

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
                  grid={convertToSudokuGrid(gameGrid)}
                  onGridChange={handleGridChange}
                  isReadonly={!isGameStarted || gameComplete || !isConnected}
                  className="w-full max-w-md mx-auto"
                />
                <div className="mt-4 text-center">
                  <div className="text-lg font-semibold">
                    {calculateCompletionPercentage(gameGrid)}% Complete
                  </div>
                </div>

                {/* Game Controls */}
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {!isGameStarted && roomState?.status === 'WAITING' && (
                    <Button
                      onClick={handleToggleReady}
                      variant={isPlayerReady ? "default" : "outline"}
                      size="sm"
                    >
                      {isPlayerReady ? 'Ready!' : 'Ready?'}
                    </Button>
                  )}
                  
                  {isGameStarted && canUseHint && (
                    <Button
                      onClick={handleRequestHint}
                      variant="outline"
                      size="sm"
                    >
                      <Lightbulb className="w-4 h-4 mr-1" />
                      Hint ({currentPlayer?.hintsRemaining})
                    </Button>
                  )}
                  
                  {isGameStarted && (
                    <Button
                      onClick={handleSurrender}
                      variant="destructive"
                      size="sm"
                    >
                      <Flag className="w-4 h-4 mr-1" />
                      Surrender
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => setShowChat(!showChat)}
                    variant="outline"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Chat
                  </Button>
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
                    <div className="text-xl font-bold">{hintsUsed}</div>
                    <div className="text-sm text-gray-600">Hints Used</div>
                  </div>
                </div>

                {roomState?.status === 'WAITING' && (
                  <div className="text-center text-gray-600">
                    Waiting for all players to be ready...
                  </div>
                )}

                {roomState?.status === 'STARTING' && (
                  <div className="text-center text-orange-600">
                    Game starting soon...
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
                  {roomState?.players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">
                          {player.id === session?.user?.id ? 'You' : player.name}
                        </span>
                        {player.isReady && roomState.status === 'WAITING' && (
                          <Badge variant="outline" className="text-xs">Ready</Badge>
                        )}
                        {winner === player.id && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {player.score} pts
                        </Badge>
                        <div className={`w-2 h-2 rounded-full ${
                          player.isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>
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
                  grid={convertToSudokuGrid(opponentProgress.length > 0 ? opponentProgress : gameGrid)}
                  isReadonly={true}
                  className="w-full max-w-md mx-auto opacity-75"
                />
                <div className="mt-4 text-center">
                  <div className="text-lg font-semibold">
                    {calculateCompletionPercentage(opponentProgress.length > 0 ? opponentProgress : gameGrid)}% Complete
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
