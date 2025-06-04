import { MatchType } from '@prisma/client'

export interface GameRoom {
  id: string
  players: string[]
  gameState: number[][]
  currentPlayer: number
  gameMode: MatchType
  startTime: Date
  lastMove?: {
    playerId: string
    row: number
    col: number
    value: number
    timestamp: Date
  }
}

// In-memory store for active game rooms
export const gameRooms = new Map<string, GameRoom>()
