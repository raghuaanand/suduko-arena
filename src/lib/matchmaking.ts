// Matchmaking service for real-time multiplayer games
import { prisma } from '@/lib/prisma'
import { MatchType, MatchStatus } from '@/types'

export interface MatchmakingQueue {
  userId: string
  difficulty: 'easy' | 'medium' | 'hard'
  matchType: MatchType
  timestamp: Date
}

export class MatchmakingService {
  private static queue: MatchmakingQueue[] = []
  private static readonly MATCH_TIMEOUT = 30000 // 30 seconds

  static async addToQueue(userId: string, difficulty: 'easy' | 'medium' | 'hard', matchType: MatchType) {
    // Remove user from queue if already present
    this.removeFromQueue(userId)
    
    // Add to queue
    this.queue.push({
      userId,
      difficulty,
      matchType,
      timestamp: new Date()
    })

    // Try to find a match immediately
    return this.findMatch(userId)
  }

  static removeFromQueue(userId: string) {
    this.queue = this.queue.filter(entry => entry.userId !== userId)
  }

  static async findMatch(userId: string): Promise<string | null> {
    const userEntry = this.queue.find(entry => entry.userId === userId)
    if (!userEntry) return null

    // Find potential opponents
    const opponents = this.queue.filter(entry => 
      entry.userId !== userId &&
      entry.difficulty === userEntry.difficulty &&
      entry.matchType === userEntry.matchType
    )

    if (opponents.length > 0) {
      const opponent = opponents[0]
      
      // Remove both users from queue
      this.removeFromQueue(userId)
      this.removeFromQueue(opponent.userId)

      // Create match
      const matchId = await this.createMatch(userEntry, opponent)
      return matchId
    }

    return null
  }

  private static async createMatch(player1: MatchmakingQueue, player2: MatchmakingQueue): Promise<string> {
    try {
      const sudokuGrid = this.generateSudokuPuzzle(player1.difficulty)
      const solution = this.generateSudokuSolution(sudokuGrid)

      const match = await prisma.match.create({
        data: {
          type: player1.matchType,
          entryFee: 0, // Free multiplayer
          prize: 0,
          sudokuGrid: JSON.stringify(sudokuGrid),
          solution: JSON.stringify(solution),
          player1Id: player1.userId,
          player2Id: player2.userId,
          status: 'WAITING'
        }
      })

      return match.id
    } catch (error) {
      console.error('Error creating match:', error)
      throw new Error('Failed to create match')
    }
  }

  private static generateSudokuPuzzle(difficulty: 'easy' | 'medium' | 'hard'): number[][] {
    // Mock puzzle generation - in production use proper Sudoku generator
    const emptyGrid = Array(9).fill(null).map(() => Array(9).fill(0))
    
    // Base valid solution
    const validGrid = [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9]
    ]

    // Remove numbers based on difficulty
    const cellsToRemove = {
      easy: 30,
      medium: 45,
      hard: 60
    }

    const puzzle = validGrid.map(row => [...row])
    const toRemove = cellsToRemove[difficulty]
    
    let removed = 0
    while (removed < toRemove) {
      const row = Math.floor(Math.random() * 9)
      const col = Math.floor(Math.random() * 9)
      
      if (puzzle[row][col] !== 0) {
        puzzle[row][col] = 0
        removed++
      }
    }

    return puzzle
  }

  private static generateSudokuSolution(puzzle: number[][]): number[][] {
    // For now, return the complete solution
    // In production, implement proper Sudoku solver
    return [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9]
    ]
  }

  static getQueueStatus(userId: string) {
    const entry = this.queue.find(e => e.userId === userId)
    if (!entry) return null

    return {
      position: this.queue.indexOf(entry) + 1,
      waitTime: Date.now() - entry.timestamp.getTime(),
      estimatedTime: this.queue.length * 5000 // 5 seconds per person estimate
    }
  }

  // Clean up old queue entries
  static cleanupQueue() {
    const now = Date.now()
    this.queue = this.queue.filter(entry => 
      now - entry.timestamp.getTime() < this.MATCH_TIMEOUT
    )
  }
}

// Clean queue every 30 seconds
setInterval(() => {
  MatchmakingService.cleanupQueue()
}, 30000)
