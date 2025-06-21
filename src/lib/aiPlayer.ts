// AI Player implementation for single player mode
import { SudokuGrid } from '@/types'
import { isValidMove } from '@/utils/sudoku'

export interface AIPlayerConfig {
  difficulty: 'easy' | 'medium' | 'hard'
  moveDelay: number // milliseconds
  errorRate: number // 0-1 probability of making errors
  adaptiveMode: boolean // Whether AI adapts to player performance
  aggressiveness: number // 0-1, how aggressively AI plays
  hintUsage: number // 0-1, probability of AI using hints/advanced strategies
}

export interface PlayerPerformance {
  averageTimePerMove: number
  errorCount: number
  hintsUsed: number
  totalMoves: number
  skillLevel: number // 0-1 calculated skill level
}

export class AIPlayer {
  private config: AIPlayerConfig
  private moveHistory: Array<{ row: number; col: number; value: number; timestamp: Date }> = []
  private playerPerformance: PlayerPerformance | null = null
  private adaptiveAdjustments = {
    speedMultiplier: 1.0,
    errorRateMultiplier: 1.0,
    aggressivenessBonus: 0.0
  }
  
  constructor(difficulty: 'easy' | 'medium' | 'hard', adaptiveMode: boolean = false) {
    this.config = {
      difficulty,
      moveDelay: this.getMoveDelay(difficulty),
      errorRate: this.getErrorRate(difficulty),
      adaptiveMode,
      aggressiveness: this.getAggressiveness(difficulty),
      hintUsage: this.getHintUsage(difficulty)
    }
  }

  private getMoveDelay(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 3000 // 3 seconds
      case 'medium': return 2000 // 2 seconds  
      case 'hard': return 1500 // 1.5 seconds
      default: return 2000
    }
  }

  private getErrorRate(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 0.1 // 10% error rate
      case 'medium': return 0.05 // 5% error rate
      case 'hard': return 0.02 // 2% error rate
      default: return 0.05
    }
  }

  private getAggressiveness(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 0.3 // Less aggressive
      case 'medium': return 0.6 // Moderately aggressive
      case 'hard': return 0.9 // Very aggressive
      default: return 0.6
    }
  }

  private getHintUsage(difficulty: string): number {
    switch (difficulty) {
      case 'easy': return 0.2 // Rarely uses advanced strategies
      case 'medium': return 0.5 // Sometimes uses hints
      case 'hard': return 0.8 // Often uses advanced strategies
      default: return 0.5
    }
  }

  /**
   * Update AI behavior based on player performance
   */
  updatePlayerPerformance(performance: PlayerPerformance): void {
    if (!this.config.adaptiveMode) return

    this.playerPerformance = performance

    // Adjust AI based on player skill
    if (performance.skillLevel > 0.7) {
      // Player is skilled - make AI more challenging
      this.adaptiveAdjustments.speedMultiplier = 0.8 // Faster moves
      this.adaptiveAdjustments.errorRateMultiplier = 0.7 // Fewer errors
      this.adaptiveAdjustments.aggressivenessBonus = 0.2 // More aggressive
    } else if (performance.skillLevel < 0.3) {
      // Player is struggling - make AI easier
      this.adaptiveAdjustments.speedMultiplier = 1.3 // Slower moves
      this.adaptiveAdjustments.errorRateMultiplier = 1.5 // More errors
      this.adaptiveAdjustments.aggressivenessBonus = -0.2 // Less aggressive
    } else {
      // Reset to default
      this.adaptiveAdjustments = {
        speedMultiplier: 1.0,
        errorRateMultiplier: 1.0,
        aggressivenessBonus: 0.0
      }
    }
  }

  // Find the next best move for AI
  async getNextMove(currentGrid: SudokuGrid, solution: SudokuGrid): Promise<{
    row: number
    col: number
    value: number
    confidence: number
  } | null> {
    // Find empty cells
    const emptyCells: Array<{ row: number; col: number }> = []
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (currentGrid[row][col] === null || currentGrid[row][col] === 0) {
          emptyCells.push({ row, col })
        }
      }
    }

    if (emptyCells.length === 0) return null

    // Apply adaptive adjustments
    const adjustedErrorRate = this.config.errorRate * this.adaptiveAdjustments.errorRateMultiplier
    const adjustedAggressiveness = Math.max(0, Math.min(1, 
      this.config.aggressiveness + this.adaptiveAdjustments.aggressivenessBonus
    ))

    // Strategy based on difficulty and adaptive settings
    const move = this.selectMoveStrategy(currentGrid, solution, emptyCells, adjustedAggressiveness)
    
    // Add some randomness and potential errors
    if (Math.random() < adjustedErrorRate) {
      return this.makeIntentionalError(currentGrid, move)
    }

    return move
  }

  private selectMoveStrategy(
    grid: SudokuGrid, 
    solution: SudokuGrid, 
    emptyCells: Array<{ row: number; col: number }>,
    aggressiveness?: number
  ): { row: number; col: number; value: number; confidence: number } | null {
    
    const currentAggressiveness = aggressiveness || this.config.aggressiveness

    // Use hint-based strategies occasionally
    if (Math.random() < this.config.hintUsage) {
      const advancedMove = this.advancedStrategy(grid, solution, emptyCells)
      if (advancedMove) return advancedMove
    }

    switch (this.config.difficulty) {
      case 'easy':
        // Pick random cell and solve it, but slower if adaptive mode suggests
        return this.randomCellStrategy(grid, solution, emptyCells)
      
      case 'medium':
        // Focus on cells with fewer possibilities, adjust based on aggressiveness
        if (currentAggressiveness > 0.7) {
          return this.expertStrategy(grid, solution, emptyCells)
        }
        return this.smartStrategy(grid, solution, emptyCells)
      
      case 'hard':
        // Use advanced solving techniques, very aggressive
        return this.expertStrategy(grid, solution, emptyCells)
      
      default:
        return this.randomCellStrategy(grid, solution, emptyCells)
    }
  }

  private randomCellStrategy(
    grid: SudokuGrid,
    solution: SudokuGrid,
    emptyCells: Array<{ row: number; col: number }>
  ): { row: number; col: number; value: number; confidence: number } | null {
    if (emptyCells.length === 0) return null
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const value = solution[randomCell.row][randomCell.col]
    
    if (value) {
      return {
        row: randomCell.row,
        col: randomCell.col,
        value: value as number,
        confidence: 0.7
      }
    }
    
    return null
  }

  private smartStrategy(
    grid: SudokuGrid,
    solution: SudokuGrid,
    emptyCells: Array<{ row: number; col: number }>
  ): { row: number; col: number; value: number; confidence: number } | null {
    // Find cell with fewest valid possibilities
    let bestCell = null
    let minPossibilities = 10

    for (const cell of emptyCells) {
      const possibilities = this.getPossibleValues(grid, cell.row, cell.col)
      if (possibilities.length < minPossibilities && possibilities.length > 0) {
        minPossibilities = possibilities.length
        bestCell = cell
      }
    }

    if (bestCell) {
      const value = solution[bestCell.row][bestCell.col]
      if (value) {
        return {
          row: bestCell.row,
          col: bestCell.col,
          value: value as number,
          confidence: 0.85
        }
      }
    }

    return this.randomCellStrategy(grid, solution, emptyCells)
  }

  private expertStrategy(
    grid: SudokuGrid,
    solution: SudokuGrid,
    emptyCells: Array<{ row: number; col: number }>
  ): { row: number; col: number; value: number; confidence: number } | null {
    // Use naked singles strategy first
    for (const cell of emptyCells) {
      const possibilities = this.getPossibleValues(grid, cell.row, cell.col)
      if (possibilities.length === 1) {
        return {
          row: cell.row,
          col: cell.col,
          value: possibilities[0],
          confidence: 0.95
        }
      }
    }

    // Fall back to smart strategy
    return this.smartStrategy(grid, solution, emptyCells)
  }

  /**
   * Advanced strategy using multiple Sudoku solving techniques
   */
  private advancedStrategy(
    grid: SudokuGrid,
    solution: SudokuGrid,
    emptyCells: Array<{ row: number; col: number }>
  ): { row: number; col: number; value: number; confidence: number } | null {
    // Try naked singles first (cells with only one possibility)
    for (const cell of emptyCells) {
      const possibilities = this.getPossibleValues(grid, cell.row, cell.col)
      if (possibilities.length === 1) {
        return {
          row: cell.row,
          col: cell.col,
          value: possibilities[0],
          confidence: 0.98
        }
      }
    }

    // Try hidden singles (values that can only go in one cell in a unit)
    const hiddenSingle = this.findHiddenSingle(grid, emptyCells)
    if (hiddenSingle) return hiddenSingle

    // Fall back to smart strategy
    return this.smartStrategy(grid, solution, emptyCells)
  }

  /**
   * Find hidden singles in rows, columns, and boxes
   */
  private findHiddenSingle(
    grid: SudokuGrid,
    emptyCells: Array<{ row: number; col: number }>
  ): { row: number; col: number; value: number; confidence: number } | null {
    // Check rows
    for (let row = 0; row < 9; row++) {
      for (let num = 1; num <= 9; num++) {
        const possibleCells = emptyCells.filter(cell => 
          cell.row === row && this.getPossibleValues(grid, cell.row, cell.col).includes(num)
        )
        if (possibleCells.length === 1) {
          return {
            row: possibleCells[0].row,
            col: possibleCells[0].col,
            value: num,
            confidence: 0.92
          }
        }
      }
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
      for (let num = 1; num <= 9; num++) {
        const possibleCells = emptyCells.filter(cell => 
          cell.col === col && this.getPossibleValues(grid, cell.row, cell.col).includes(num)
        )
        if (possibleCells.length === 1) {
          return {
            row: possibleCells[0].row,
            col: possibleCells[0].col,
            value: num,
            confidence: 0.92
          }
        }
      }
    }

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        for (let num = 1; num <= 9; num++) {
          const possibleCells = emptyCells.filter(cell => {
            const cellBoxRow = Math.floor(cell.row / 3)
            const cellBoxCol = Math.floor(cell.col / 3)
            return cellBoxRow === boxRow && cellBoxCol === boxCol &&
                   this.getPossibleValues(grid, cell.row, cell.col).includes(num)
          })
          if (possibleCells.length === 1) {
            return {
              row: possibleCells[0].row,
              col: possibleCells[0].col,
              value: num,
              confidence: 0.92
            }
          }
        }
      }
    }

    return null
  }

  private getPossibleValues(grid: SudokuGrid, row: number, col: number): number[] {
    const possibilities: number[] = []
    
    for (let num = 1; num <= 9; num++) {
      if (isValidMove(grid, row, col, num)) {
        possibilities.push(num)
      }
    }
    
    return possibilities
  }

  private makeIntentionalError(
    grid: SudokuGrid,
    correctMove: { row: number; col: number; value: number; confidence: number } | null
  ): { row: number; col: number; value: number; confidence: number } | null {
    if (!correctMove) return null

    // Generate a wrong but valid move
    const possibilities = this.getPossibleValues(grid, correctMove.row, correctMove.col)
    const wrongValues = possibilities.filter(v => v !== correctMove.value)
    
    if (wrongValues.length > 0) {
      const wrongValue = wrongValues[Math.floor(Math.random() * wrongValues.length)]
      return {
        row: correctMove.row,
        col: correctMove.col,
        value: wrongValue,
        confidence: 0.3 // Low confidence for errors
      }
    }

    return correctMove
  }

  // Simulate AI making a move with delay
  async makeMove(
    currentGrid: SudokuGrid,
    solution: SudokuGrid,
    onMove: (row: number, col: number, value: number) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      const adjustedDelay = this.config.moveDelay * this.adaptiveAdjustments.speedMultiplier
      
      setTimeout(async () => {
        const move = await this.getNextMove(currentGrid, solution)
        if (move) {
          this.moveHistory.push({
            row: move.row,
            col: move.col,
            value: move.value,
            timestamp: new Date()
          })
          onMove(move.row, move.col, move.value)
        }
        resolve()
      }, adjustedDelay)
    })
  }

  // Get AI performance stats
  getStats() {
    const recentMoves = this.moveHistory.slice(-10) // Last 10 moves
    const avgTime = recentMoves.length > 1 ? 
      (recentMoves[recentMoves.length - 1].timestamp.getTime() - recentMoves[0].timestamp.getTime()) / (recentMoves.length - 1) :
      this.config.moveDelay

    return {
      totalMoves: this.moveHistory.length,
      difficulty: this.config.difficulty,
      averageTime: avgTime,
      errorRate: this.config.errorRate * this.adaptiveAdjustments.errorRateMultiplier,
      aggressiveness: this.config.aggressiveness + this.adaptiveAdjustments.aggressivenessBonus,
      adaptiveMode: this.config.adaptiveMode,
      recentPerformance: this.playerPerformance
    }
  }

  // Get move delay for external components
  getCurrentMoveDelay(): number {
    return this.config.moveDelay * this.adaptiveAdjustments.speedMultiplier
  }

  // Reset AI state
  reset() {
    this.moveHistory = []
    this.playerPerformance = null
    this.adaptiveAdjustments = {
      speedMultiplier: 1.0,
      errorRateMultiplier: 1.0,
      aggressivenessBonus: 0.0
    }
  }
}

// Factory function for creating AI players
export function createAIPlayer(difficulty: 'easy' | 'medium' | 'hard', adaptiveMode: boolean = false): AIPlayer {
  return new AIPlayer(difficulty, adaptiveMode)
}

/**
 * Calculate player performance metrics for AI adaptation
 */
export function calculatePlayerPerformance(
  moves: Array<{ timestamp: Date; correct: boolean }>,
  hintsUsed: number,
  totalTime: number
): PlayerPerformance {
  const totalMoves = moves.length
  const correctMoves = moves.filter(m => m.correct).length
  const errorCount = totalMoves - correctMoves
  const averageTimePerMove = totalMoves > 0 ? totalTime / totalMoves : 0

  // Calculate skill level (0-1) based on multiple factors
  const accuracyScore = totalMoves > 0 ? correctMoves / totalMoves : 0
  const speedScore = Math.max(0, 1 - (averageTimePerMove / 30000)) // 30 seconds is baseline
  const hintPenalty = Math.max(0, 1 - (hintsUsed / totalMoves))

  const skillLevel = (accuracyScore * 0.5 + speedScore * 0.3 + hintPenalty * 0.2)

  return {
    averageTimePerMove,
    errorCount,
    hintsUsed,
    totalMoves,
    skillLevel: Math.max(0, Math.min(1, skillLevel))
  }
}
