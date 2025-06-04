'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { io, type Socket } from 'socket.io-client'

interface GameState {
  matchId: string
  gameState: number[][]
  players: string[]
  currentPlayer: number
  isActive: boolean
}

interface MoveData {
  playerId: string
  row: number
  col: number
  value: number
  gameState: number[][]
  timeElapsed: number
  movesCount: number
  hintsUsed: number
  errorsCount: number
  isComplete?: boolean
}

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinGame: (matchId: string) => void
  makeMove: (row: number, col: number, value: number, gameStats?: {
    timeElapsed: number
    movesCount: number
    hintsUsed: number
    errorsCount: number
  }) => void
  leaveGame: () => void
  gameState: GameState | null
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinGame: () => {},
  makeMove: () => {},
  leaveGame: () => {},
  gameState: null,
})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentMatchId, setCurrentMatchId] = useState<string>('')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const { data: session } = useSession()

  useEffect(() => {
    const socketInstance = io('http://localhost:3003', {
      autoConnect: true,
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('Connected to Socket.IO server')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server')
      setIsConnected(false)
    })

    socketInstance.on('joined-game', (data: GameState) => {
      console.log('Joined game:', data)
      setGameState(data)
    })

    socketInstance.on('player-joined', (data: { userId: string; game: GameState }) => {
      console.log('Player joined:', data)
      setGameState(data.game)
    })

    socketInstance.on('move-made', (data: MoveData) => {
      console.log('Move made:', data)
      setGameState(prev => prev ? {
        ...prev,
        gameState: data.gameState
      } : null)
    })

    socketInstance.on('player-left', (data: { userId: string }) => {
      console.log('Player left:', data)
    })

    socketInstance.on('game-completed', (data: { 
      winner: string; 
      game: GameState;
      completion?: {
        matchId: string;
        winnerId: string;
        player1Score: {
          playerId: string;
          timeElapsed: number;
          movesCount: number;
          hintsUsed: number;
          errorsCount: number;
          isComplete: boolean;
          finalScore: number;
        };
        player2Score: {
          playerId: string;
          timeElapsed: number;
          movesCount: number;
          hintsUsed: number;
          errorsCount: number;
          isComplete: boolean;
          finalScore: number;
        };
        completedAt: Date;
      }
    }) => {
      console.log('Game completed:', data)
      setGameState(data.game)
      
      // Show completion notification
      if (data.completion) {
        console.log('Match finished:', data.completion)
      }
    })

    socketInstance.on('match-result', (data: {
      matchId: string;
      winnerId: string;
      scores: {
        player1: number;
        player2: number;
      };
    }) => {
      console.log('Match result received:', data)
      // Handle match completion result
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const joinGame = (matchId: string) => {
    if (socket && session?.user?.id) {
      setCurrentMatchId(matchId)
      socket.emit('join-game', { matchId, userId: session.user.id })
    }
  }

  const makeMove = (row: number, col: number, value: number, gameStats?: {
    timeElapsed: number
    movesCount: number
    hintsUsed: number
    errorsCount: number
  }) => {
    if (socket && session?.user?.id && currentMatchId) {
      const moveData = {
        matchId: currentMatchId,
        playerId: session.user.id,
        row, 
        col, 
        value,
        ...gameStats
      }
      
      // Emit move to Socket.IO server
      socket.emit('make-move', moveData)
      
      // Also persist to API for game state tracking
      if (gameStats) {
        fetch(`/api/matches/${currentMatchId}/move`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            row,
            col,
            value,
            grid: gameState?.gameState || [],
            timeElapsed: gameStats.timeElapsed,
            movesCount: gameStats.movesCount,
            hintsUsed: gameStats.hintsUsed,
            errorsCount: gameStats.errorsCount
          })
        }).catch(error => {
          console.error('Error persisting move:', error)
        })
      }
    }
  }

  const leaveGame = () => {
    if (socket && currentMatchId) {
      socket.emit('leave-game', {
        matchId: currentMatchId,
        userId: session?.user?.id
      })
      setCurrentMatchId('')
      setGameState(null)
    }
  }

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      joinGame,
      makeMove,
      leaveGame,
      gameState
    }}>
      {children}
    </SocketContext.Provider>
  )
}
