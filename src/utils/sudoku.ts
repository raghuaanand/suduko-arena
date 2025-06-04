import { SudokuGrid } from '@/types'

/**
 * Generate an empty 9x9 Sudoku grid
 */
export function createEmptyGrid(): SudokuGrid {
  return Array(9).fill(null).map(() => Array(9).fill(null))
}

/**
 * Check if a number can be placed at a specific position
 */
export function isValidMove(grid: SudokuGrid, row: number, col: number, num: number): boolean {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (grid[row][x] === num) {
      return false
    }
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (grid[x][col] === num) {
      return false
    }
  }

  // Check 3x3 box
  const startRow = row - (row % 3)
  const startCol = col - (col % 3)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (grid[i + startRow][j + startCol] === num) {
        return false
      }
    }
  }

  return true
}

/**
 * Check if the current grid state is valid (no conflicts)
 */
export function isValidGrid(grid: SudokuGrid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const num = grid[row][col]
      if (num !== null) {
        // Temporarily remove the number and check if it can be placed
        grid[row][col] = null
        const valid = isValidMove(grid, row, col, num)
        grid[row][col] = num
        if (!valid) {
          return false
        }
      }
    }
  }
  return true
}

/**
 * Check if the Sudoku is complete (all cells filled and valid)
 */
export function isComplete(grid: SudokuGrid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        return false
      }
    }
  }
  return isValidGrid(grid)
}

/**
 * Solve Sudoku using backtracking algorithm
 */
export function solveSudoku(grid: SudokuGrid): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        for (let num = 1; num <= 9; num++) {
          if (isValidMove(grid, row, col, num)) {
            grid[row][col] = num
            
            if (solveSudoku(grid)) {
              return true
            }
            
            grid[row][col] = null
          }
        }
        return false
      }
    }
  }
  return true
}

/**
 * Generate a complete solved Sudoku grid
 */
export function generateCompleteGrid(): SudokuGrid {
  const grid = createEmptyGrid()
  
  // Fill the diagonal 3x3 boxes first
  for (let i = 0; i < 9; i += 3) {
    fillBox(grid, i, i)
  }
  
  // Solve the rest
  solveSudoku(grid)
  
  return grid
}

/**
 * Fill a 3x3 box with random valid numbers
 */
function fillBox(grid: SudokuGrid, row: number, col: number): void {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9]
  shuffleArray(nums)
  
  let index = 0
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      grid[row + i][col + j] = nums[index++]
    }
  }
}

/**
 * Shuffle array in place
 */
function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Generate a Sudoku puzzle by removing numbers from a complete grid
 */
export function generatePuzzle(difficulty: 'easy' | 'medium' | 'hard' = 'medium'): {
  puzzle: SudokuGrid
  solution: SudokuGrid
} {
  const solution = generateCompleteGrid()
  const puzzle = solution.map(row => [...row])
  
  // Determine how many cells to remove based on difficulty
  const cellsToRemove = {
    easy: 40,
    medium: 50,
    hard: 60
  }[difficulty]
  
  const positions: [number, number][] = []
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      positions.push([row, col])
    }
  }
  
  shuffleArray(positions)
  
  // Remove numbers while ensuring the puzzle has a unique solution
  for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
    const [row, col] = positions[i]
    const backup = puzzle[row][col]
    puzzle[row][col] = null
    
    // Create a copy to test if it still has a unique solution
    const testGrid = puzzle.map(row => [...row])
    if (!hasUniqueSolution(testGrid)) {
      // If removing this number creates multiple solutions, put it back
      puzzle[row][col] = backup
    }
  }
  
  return { puzzle, solution }
}

/**
 * Check if a Sudoku puzzle has a unique solution
 */
function hasUniqueSolution(grid: SudokuGrid): boolean {
  const solutions: SudokuGrid[] = []
  findAllSolutions(grid.map(row => [...row]), solutions, 2) // Stop after finding 2 solutions
  return solutions.length === 1
}

/**
 * Find all solutions for a Sudoku puzzle (up to maxSolutions)
 */
function findAllSolutions(grid: SudokuGrid, solutions: SudokuGrid[], maxSolutions: number): void {
  if (solutions.length >= maxSolutions) return
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        for (let num = 1; num <= 9; num++) {
          if (isValidMove(grid, row, col, num)) {
            grid[row][col] = num
            findAllSolutions(grid, solutions, maxSolutions)
            grid[row][col] = null
          }
        }
        return
      }
    }
  }
  
  // If we reach here, we found a complete solution
  solutions.push(grid.map(row => [...row]))
}

/**
 * Convert grid to string for storage
 */
export function gridToString(grid: SudokuGrid): string {
  return grid.flat().map(cell => cell?.toString() ?? '0').join('')
}

/**
 * Convert string to grid
 */
export function stringToGrid(str: string): SudokuGrid {
  const grid = createEmptyGrid()
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9)
    const col = i % 9
    const char = str[i]
    grid[row][col] = char === '0' ? null : parseInt(char, 10)
  }
  return grid
}

/**
 * Get all empty cells in the grid
 */
export function getEmptyCells(grid: SudokuGrid): [number, number][] {
  const emptyCells: [number, number][] = []
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        emptyCells.push([row, col])
      }
    }
  }
  return emptyCells
}

/**
 * Get completion percentage of the grid
 */
export function getCompletionPercentage(grid: SudokuGrid): number {
  const filledCells = grid.flat().filter(cell => cell !== null).length
  return Math.round((filledCells / 81) * 100)
}

/**
 * Get possible values for a specific cell
 */
export function getPossibleValues(grid: SudokuGrid, row: number, col: number): number[] {
  if (grid[row][col] !== null) {
    return []
  }
  
  const possible: number[] = []
  for (let num = 1; num <= 9; num++) {
    if (isValidMove(grid, row, col, num)) {
      possible.push(num)
    }
  }
  return possible
}

/**
 * Get hint for the next move
 */
export function getHint(grid: SudokuGrid): { row: number; col: number; value: number } | null {
  const emptyCells = getEmptyCells(grid)
  
  // Find a cell with only one possible value
  for (const [row, col] of emptyCells) {
    const possible = getPossibleValues(grid, row, col)
    if (possible.length === 1) {
      return { row, col, value: possible[0] }
    }
  }
  
  // If no obvious move, return a random empty cell with its first possible value
  if (emptyCells.length > 0) {
    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    const possible = getPossibleValues(grid, row, col)
    if (possible.length > 0) {
      return { row, col, value: possible[0] }
    }
  }
  
  return null
}
