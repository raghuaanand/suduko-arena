'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SudokuGridComponent } from '@/components/sudoku/SudokuGrid'
import { AIPlayer } from '@/lib/aiPlayer'
import { generatePuzzle } from '@/utils/sudoku'
import {
  Bot,
  Timer,
  Trophy,
  Lightbulb,
  RotateCcw,
  Play,
  Pause,
  Home
} from 'lucide-react'
import Link from 'next/link'

interface SinglePlayerGameProps {
  difficulty: 'easy' | 'medium' | 'hard'
  onGameComplete?: (score: number, time: number) => void
}

export default function SinglePlayerGame({ 
  difficulty, 
  onGameComplete 
}: SinglePlayerGameProps) {
  const [gameGrid, setGameGrid] = useState<number[][]>([])
  const [originalGrid, setOriginalGrid] = useState<number[][]>([])
  const [solution, setSolution] = useState<number[][]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [aiPlayer, setAiPlayer] = useState<AIPlayer | null>(null)
  const [aiProgress, setAiProgress] = useState<number[][]>([])
  const [playerMoves, setPlayerMoves] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [gameComplete, setGameComplete] = useState(false)
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null)

  const calculateScore = useCallback((): number => {
    const baseScore = 1000
    const timeBonus = Math.max(0, 1800 - timeElapsed) // Max 30 min
    const movesPenalty = playerMoves * 2
    const hintsPenalty = hintsUsed * 50
    
    return Math.max(100, baseScore + timeBonus - movesPenalty - hintsPenalty)
  }, [timeElapsed, playerMoves, hintsUsed])

  // Convert number[][] to SudokuGrid for component props
  const convertToSudokuGrid = (grid: number[][]): (number | null)[][] => {
    return grid.map(row => row.map(cell => cell === 0 ? null : cell))
  }

  const isGridComplete = (grid: number[][]): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) return false
      }
    }
    return true
  }

  const initializeGame = useCallback(() => {
    const puzzleData = generatePuzzle(difficulty)
    
    // Convert SudokuGrid (with nulls) to number[][] (with 0s)
    const convertToNumberGrid = (grid: (number | null)[][]) => 
      grid.map(row => row.map(cell => cell === null ? 0 : cell))
    
    setGameGrid(convertToNumberGrid(puzzleData.puzzle))
    setOriginalGrid(convertToNumberGrid(puzzleData.puzzle))
    setAiProgress(convertToNumberGrid(puzzleData.puzzle))
    setSolution(convertToNumberGrid(puzzleData.solution))
    setAiPlayer(new AIPlayer(difficulty))
    setTimeElapsed(0)
    setPlayerMoves(0)
    setHintsUsed(0)
    setGameComplete(false)
    setWinner(null)
    setIsPlaying(false)
    setIsPaused(false)
  }, [difficulty])

  const handleGridChange = useCallback((newGrid: (number | null)[][]) => {
    // Convert SudokuGrid (number | null)[][] to number[][] for internal state
    const numberGrid = newGrid.map(row => row.map(cell => cell === null ? 0 : cell))
    setGameGrid(numberGrid)
    setPlayerMoves(prev => prev + 1)

    // Check if player completed
    if (isGridComplete(numberGrid)) {
      setGameComplete(true)
      setWinner('player')
      setIsPlaying(false)
      
      // Calculate score
      const score = calculateScore()
      onGameComplete?.(score, timeElapsed)
    }
  }, [timeElapsed, onGameComplete, calculateScore])

  // Initialize game
  useEffect(() => {
    initializeGame()
  }, [initializeGame])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isPlaying && !isPaused && !gameComplete) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, isPaused, gameComplete])

  // AI player moves
  useEffect(() => {
    if (!isPlaying || isPaused || gameComplete || !aiPlayer) return

    const makeAIMove = async () => {
      try {
        const move = await aiPlayer.getNextMove(aiProgress, solution)
        if (move) {
          const newAiGrid = aiProgress.map(row => [...row])
          newAiGrid[move.row][move.col] = move.value
          setAiProgress(newAiGrid)

          // Check if AI completed
          if (isGridComplete(newAiGrid)) {
            setGameComplete(true)
            setWinner('ai')
            setIsPlaying(false)
          }
        }
      } catch (error) {
        console.error('AI move error:', error)
      }
    }

    const aiMoveTimeout = setTimeout(makeAIMove, aiPlayer.getCurrentMoveDelay())
    return () => clearTimeout(aiMoveTimeout)
  }, [aiProgress, isPlaying, isPaused, gameComplete, aiPlayer, solution])

  const handleStartGame = () => {
    setIsPlaying(true)
    setIsPaused(false)
  }

  const handlePauseGame = () => {
    setIsPaused(!isPaused)
  }

  const handleHint = () => {
    if (hintsUsed >= 3) return // Max 3 hints
    
    // Find an empty cell and show correct value
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameGrid[row][col] === 0 && originalGrid[row][col] === 0) {
          const newGrid = gameGrid.map(r => [...r])
          newGrid[row][col] = solution[row][col]
          setGameGrid(newGrid)
          setHintsUsed(prev => prev + 1)
          return
        }
      }
    }
  }

  const handleRestart = () => {
    initializeGame()
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500' 
      case 'hard': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

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
                <Bot className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold">Single Player vs AI</h1>
              </div>
            </div>
            <Badge className={`${getDifficultyColor(difficulty)} text-white`}>
              {difficulty.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Player Side */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>You</span>
                  {winner === 'player' && <Trophy className="w-5 h-5 text-yellow-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SudokuGridComponent
                  grid={convertToSudokuGrid(gameGrid)}
                  solution={convertToSudokuGrid(originalGrid)}
                  onGridChange={handleGridChange}
                  isReadonly={!isPlaying || isPaused || gameComplete}
                  className="w-full max-w-md mx-auto"
                />
              </CardContent>
            </Card>
          </div>

          {/* Game Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Game Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Timer className="w-5 h-5" />
                  Game Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{formatTime(timeElapsed)}</div>
                    <div className="text-sm text-gray-600">Time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{playerMoves}</div>
                    <div className="text-sm text-gray-600">Moves</div>
                  </div>
                </div>

                <div className="space-y-2">
                  {!isPlaying ? (
                    <Button onClick={handleStartGame} className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Start Game
                    </Button>
                  ) : (
                    <Button onClick={handlePauseGame} className="w-full" variant="outline">
                      <Pause className="w-4 h-4 mr-2" />
                      {isPaused ? 'Resume' : 'Pause'}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleHint} 
                    disabled={hintsUsed >= 3 || !isPlaying || gameComplete}
                    variant="outline"
                    className="w-full"
                  >
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Hint ({3 - hintsUsed} left)
                  </Button>
                  
                  <Button onClick={handleRestart} variant="outline" className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restart
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Game Result */}
            {gameComplete && (
              <Card className={`border-2 ${winner === 'player' ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                <CardHeader>
                  <CardTitle className="text-center">
                    {winner === 'player' ? '🎉 You Won!' : '🤖 AI Won!'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-2">
                  {winner === 'player' && (
                    <div>
                      <div className="text-xl font-bold">Score: {calculateScore()}</div>
                      <div className="text-sm text-gray-600">
                        Time: {formatTime(timeElapsed)} | Moves: {playerMoves}
                      </div>
                    </div>
                  )}
                  <Button onClick={handleRestart} className="w-full">
                    Play Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Side */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <span>AI Opponent</span>
                  {winner === 'ai' && <Trophy className="w-5 h-5 text-yellow-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SudokuGridComponent
                  grid={convertToSudokuGrid(aiProgress)}
                  solution={convertToSudokuGrid(originalGrid)}
                  isReadonly={true}
                  className="w-full max-w-md mx-auto"
                />
                {isPlaying && !gameComplete && (
                  <div className="mt-4 text-center">
                    <Badge variant="outline" className="animate-pulse">
                      AI is thinking...
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
