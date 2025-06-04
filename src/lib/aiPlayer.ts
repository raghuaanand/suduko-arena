// AI Player implementation for single player mode
import { SudokuGrid } from '@/types'
import { isValidMove, solveSudoku } from '@/utils/sudoku'

export interface AIPlayerConfig {
  difficulty: 'easy' | 'medium' | 'hard'
  moveDelay: number // milliseconds
  errorRate: number // 0-1 probability of making errors
}

export class AIPlayer {
  private config: AIPlayerConfig
  private moveHistory: Array<{ row: number; col: number; value: number; timestamp: Date }> = []
  
  constructor(difficulty: 'easy' | 'medium' | 'hard') {
    this.config = {
      difficulty,
      moveDelay: this.getMoveDelay(difficulty),
      errorRate: this.getErrorRate(difficulty)
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

    // Strategy based on difficulty
    const move = this.selectMoveStrategy(currentGrid, solution, emptyCells)
    
    // Add some randomness and potential errors
    if (Math.random() < this.config.errorRate) {
      return this.makeIntentionalError(currentGrid, move)
    }

    return move
  }

  private selectMoveStrategy(
    grid: SudokuGrid, 
    solution: SudokuGrid, 
    emptyCells: Array<{ row: number; col: number }>
  ): { row: number; col: number; value: number; confidence: number } | null {
    
    switch (this.config.difficulty) {
      case 'easy':
        // Pick random cell and solve it
        return this.randomCellStrategy(grid, solution, emptyCells)
      
      case 'medium':
        // Focus on cells with fewer possibilities
        return this.smartStrategy(grid, solution, emptyCells)
      
      case 'hard':
        // Use advanced solving techniques
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
      }, this.config.moveDelay)
    })
  }

  // Get AI performance stats
  getStats() {
    return {
      totalMoves: this.moveHistory.length,
      difficulty: this.config.difficulty,
      averageTime: this.config.moveDelay,
      errorRate: this.config.errorRate
    }
  }

  // Reset AI state
  reset() {
    this.moveHistory = []
  }
}

// Factory function for creating AI players
export function createAIPlayer(difficulty: 'easy' | 'medium' | 'hard'): AIPlayer {
  return new AIPlayer(difficulty)
}
