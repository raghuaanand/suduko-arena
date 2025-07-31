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
  // Safety check: ensure grid is defined and has proper structure
  if (!grid || !Array.isArray(grid) || grid.length !== 9) {
    return false
  }
  
  if (row < 0 || row >= 9 || col < 0 || col >= 9) {
    return false
  }
  
  if (num < 1 || num > 9) {
    return false
  }

  // Check row
  for (let x = 0; x < 9; x++) {
    if (Array.isArray(grid[row]) && grid[row][x] === num) {
      return false
    }
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (Array.isArray(grid[x]) && grid[x][col] === num) {
      return false
    }
  }

  // Check 3x3 box
  const startRow = row - (row % 3)
  const startCol = col - (col % 3)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (Array.isArray(grid[i + startRow]) && grid[i + startRow][j + startCol] === num) {
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
  // Safety check: ensure grid is defined and has proper structure
  if (!grid || !Array.isArray(grid) || grid.length !== 9) {
    return false
  }
  
  for (let row = 0; row < 9; row++) {
    // Safety check: ensure row exists and is an array
    if (!Array.isArray(grid[row]) || grid[row].length !== 9) {
      return false
    }
    
    for (let col = 0; col < 9; col++) {
      const num = grid[row][col]
      if (num !== null && num !== 0 && num !== undefined) {
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
  // Safety check: ensure grid is defined and has proper structure
  if (!grid || !Array.isArray(grid) || grid.length !== 9) {
    return false
  }
  
  for (let row = 0; row < 9; row++) {
    // Safety check: ensure row exists and is an array
    if (!Array.isArray(grid[row]) || grid[row].length !== 9) {
      return false
    }
    
    for (let col = 0; col < 9; col++) {
      // Check for empty cells (null, 0, or undefined)
      if (grid[row][col] === null || grid[row][col] === 0 || grid[row][col] === undefined) {
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
 * Get hint for the next move with different strategies
 */
export function getHint(grid: SudokuGrid, strategy: 'easy' | 'logical' | 'random' = 'logical'): { row: number; col: number; value: number; strategy: string } | null {
  const emptyCells = getEmptyCells(grid)
  
  if (emptyCells.length === 0) return null

  switch (strategy) {
    case 'easy':
      return getEasyHint(grid, emptyCells)
    case 'logical':
      return getLogicalHint(grid, emptyCells)
    case 'random':
      return getRandomHint(grid, emptyCells)
    default:
      return getLogicalHint(grid, emptyCells)
  }
}

/**
 * Get easy hint - cells with only one possibility
 */
function getEasyHint(grid: SudokuGrid, emptyCells: [number, number][]): { row: number; col: number; value: number; strategy: string } | null {
  for (const [row, col] of emptyCells) {
    const possible = getPossibleValues(grid, row, col)
    if (possible.length === 1) {
      return { row, col, value: possible[0], strategy: 'naked_single' }
    }
  }
  return null
}

/**
 * Get logical hint using various Sudoku solving techniques
 */
function getLogicalHint(grid: SudokuGrid, emptyCells: [number, number][]): { row: number; col: number; value: number; strategy: string } | null {
  // Strategy 1: Naked Singles
  const nakedSingle = getEasyHint(grid, emptyCells)
  if (nakedSingle) return nakedSingle

  // Strategy 2: Hidden Singles in rows
  for (let row = 0; row < 9; row++) {
    const hint = findHiddenSingleInRow(grid, row)
    if (hint) return { ...hint, strategy: 'hidden_single_row' }
  }

  // Strategy 3: Hidden Singles in columns  
  for (let col = 0; col < 9; col++) {
    const hint = findHiddenSingleInCol(grid, col)
    if (hint) return { ...hint, strategy: 'hidden_single_col' }
  }

  // Strategy 4: Hidden Singles in boxes
  for (let box = 0; box < 9; box++) {
    const hint = findHiddenSingleInBox(grid, box)
    if (hint) return { ...hint, strategy: 'hidden_single_box' }
  }

  // Strategy 5: Pointing Pairs/Triples
  const pointingHint = findPointingPairs(grid)
  if (pointingHint) return { ...pointingHint, strategy: 'pointing_pairs' }

  // Fallback to random hint
  return getRandomHint(grid, emptyCells)
}

/**
 * Get random hint
 */
function getRandomHint(grid: SudokuGrid, emptyCells: [number, number][]): { row: number; col: number; value: number; strategy: string } | null {
  if (emptyCells.length === 0) return null
  
  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  const possible = getPossibleValues(grid, row, col)
  
  if (possible.length > 0) {
    return { 
      row, 
      col, 
      value: possible[Math.floor(Math.random() * possible.length)], 
      strategy: 'random' 
    }
  }
  
  return null
}

/**
 * Find hidden single in row
 */
function findHiddenSingleInRow(grid: SudokuGrid, row: number): { row: number; col: number; value: number } | null {
  for (let num = 1; num <= 9; num++) {
    const possibleCols = []
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null && isValidMove(grid, row, col, num)) {
        possibleCols.push(col)
      }
    }
    if (possibleCols.length === 1) {
      return { row, col: possibleCols[0], value: num }
    }
  }
  return null
}

/**
 * Find hidden single in column
 */
function findHiddenSingleInCol(grid: SudokuGrid, col: number): { row: number; col: number; value: number } | null {
  for (let num = 1; num <= 9; num++) {
    const possibleRows = []
    for (let row = 0; row < 9; row++) {
      if (grid[row][col] === null && isValidMove(grid, row, col, num)) {
        possibleRows.push(row)
      }
    }
    if (possibleRows.length === 1) {
      return { row: possibleRows[0], col, value: num }
    }
  }
  return null
}

/**
 * Find hidden single in 3x3 box
 */
function findHiddenSingleInBox(grid: SudokuGrid, boxIndex: number): { row: number; col: number; value: number } | null {
  const startRow = Math.floor(boxIndex / 3) * 3
  const startCol = (boxIndex % 3) * 3
  
  for (let num = 1; num <= 9; num++) {
    const possibleCells = []
    for (let row = startRow; row < startRow + 3; row++) {
      for (let col = startCol; col < startCol + 3; col++) {
        if (grid[row][col] === null && isValidMove(grid, row, col, num)) {
          possibleCells.push({ row, col })
        }
      }
    }
    if (possibleCells.length === 1) {
      return { row: possibleCells[0].row, col: possibleCells[0].col, value: num }
    }
  }
  return null
}

/**
 * Find pointing pairs/triples (advanced technique)
 */
function findPointingPairs(grid: SudokuGrid): { row: number; col: number; value: number } | null {
  // This is a simplified implementation
  // In a full implementation, this would identify eliminations rather than direct placements
  return null
}

/**
 * Analyze grid difficulty based on required techniques
 */
export function analyzeGridDifficulty(grid: SudokuGrid): {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  requiredTechniques: string[]
  score: number
} {
  const techniques = []
  let score = 0
  const gridCopy = grid.map(row => [...row])
  
  // Check for naked singles
  const nakedSingles = countNakedSingles(gridCopy)
  if (nakedSingles > 0) {
    techniques.push('naked_singles')
    score += nakedSingles
  }
  
  // Check for hidden singles
  const hiddenSingles = countHiddenSingles(gridCopy)
  if (hiddenSingles > 0) {
    techniques.push('hidden_singles')
    score += hiddenSingles * 2
  }
  
  // Determine difficulty
  let difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  if (score <= 30) difficulty = 'easy'
  else if (score <= 60) difficulty = 'medium'
  else if (score <= 100) difficulty = 'hard'
  else difficulty = 'expert'
  
  return { difficulty, requiredTechniques: techniques, score }
}

/**
 * Count naked singles in grid
 */
function countNakedSingles(grid: SudokuGrid): number {
  let count = 0
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === null) {
        const possible = getPossibleValues(grid, row, col)
        if (possible.length === 1) count++
      }
    }
  }
  return count
}

/**
 * Count hidden singles in grid
 */
function countHiddenSingles(grid: SudokuGrid): number {
  let count = 0
  
  // Check rows
  for (let row = 0; row < 9; row++) {
    if (findHiddenSingleInRow(grid, row)) count++
  }
  
  // Check columns
  for (let col = 0; col < 9; col++) {
    if (findHiddenSingleInCol(grid, col)) count++
  }
  
  // Check boxes
  for (let box = 0; box < 9; box++) {
    if (findHiddenSingleInBox(grid, box)) count++
  }
  
  return count
}

/**
 * Check for common Sudoku errors
 */
export function checkForErrors(grid: SudokuGrid): {
  hasErrors: boolean
  errors: Array<{ row: number; col: number; type: string; description: string }>
} {
  const errors = []
  
  // Check for duplicate numbers in rows
  for (let row = 0; row < 9; row++) {
    const seen = new Map()
    for (let col = 0; col < 9; col++) {
      const value = grid[row][col]
      if (value !== null) {
        if (seen.has(value)) {
          errors.push({
            row,
            col,
            type: 'duplicate_row',
            description: `Duplicate ${value} in row ${row + 1}`
          })
          errors.push({
            row,
            col: seen.get(value),
            type: 'duplicate_row',
            description: `Duplicate ${value} in row ${row + 1}`
          })
        } else {
          seen.set(value, col)
        }
      }
    }
  }
  
  // Check for duplicate numbers in columns
  for (let col = 0; col < 9; col++) {
    const seen = new Map()
    for (let row = 0; row < 9; row++) {
      const value = grid[row][col]
      if (value !== null) {
        if (seen.has(value)) {
          errors.push({
            row,
            col,
            type: 'duplicate_col',
            description: `Duplicate ${value} in column ${col + 1}`
          })
          errors.push({
            row: seen.get(value),
            col,
            type: 'duplicate_col',
            description: `Duplicate ${value} in column ${col + 1}`
          })
        } else {
          seen.set(value, row)
        }
      }
    }
  }
  
  // Check for duplicate numbers in 3x3 boxes
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Map()
      for (let row = boxRow * 3; row < (boxRow + 1) * 3; row++) {
        for (let col = boxCol * 3; col < (boxCol + 1) * 3; col++) {
          const value = grid[row][col]
          if (value !== null) {
            if (seen.has(value)) {
              errors.push({
                row,
                col,
                type: 'duplicate_box',
                description: `Duplicate ${value} in 3x3 box`
              })
              const prevPos = seen.get(value)
              errors.push({
                row: prevPos.row,
                col: prevPos.col,
                type: 'duplicate_box',
                description: `Duplicate ${value} in 3x3 box`
              })
            } else {
              seen.set(value, { row, col })
            }
          }
        }
      }
    }
  }
  
  return {
    hasErrors: errors.length > 0,
    errors
  }
}

/**
 * Save game state to localStorage
 */
export function saveGameState(gameId: string, state: any): void {
  try {
    localStorage.setItem(`sudoku_game_${gameId}`, JSON.stringify({
      ...state,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.error('Failed to save game state:', error)
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameState(gameId: string): any | null {
  try {
    const saved = localStorage.getItem(`sudoku_game_${gameId}`)
    if (saved) {
      const state = JSON.parse(saved)
      // Check if saved state is not too old (24 hours)
      if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
        return state
      }
    }
  } catch (error) {
    console.error('Failed to load game state:', error)
  }
  return null
}

/**
 * Clear saved game state
 */
export function clearGameState(gameId: string): void {
  try {
    localStorage.removeItem(`sudoku_game_${gameId}`)
  } catch (error) {
    console.error('Failed to clear game state:', error)
  }
}
