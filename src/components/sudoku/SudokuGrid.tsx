'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SudokuCellProps, SudokuGridProps } from '@/types'
import { isValidMove, isComplete } from '@/utils/sudoku'

// Individual Sudoku Cell Component
const SudokuCellComponent: React.FC<SudokuCellProps> = ({
  value,
  row,
  col,
  isSelected,
  isHighlighted,
  isError,
  isReadonly,
  onChange,
  onSelect,
}) => {
  const handleClick = useCallback(() => {
    if (!isReadonly) {
      onSelect(row, col)
    }
  }, [row, col, isReadonly, onSelect])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isReadonly) return

      const key = e.key
      if (key >= '1' && key <= '9') {
        const num = parseInt(key, 10)
        onChange(row, col, num)
      } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        onChange(row, col, 0) // 0 represents clearing the cell
      }
    },
    [row, col, isReadonly, onChange]
  )

  // Determine cell styling based on position and state
  const getCellClasses = () => {
    const baseClasses = [
      'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14',
      'border border-gray-300 dark:border-gray-600',
      'flex items-center justify-center',
      'text-sm sm:text-base md:text-lg lg:text-xl font-medium',
      'transition-all duration-150',
      'cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
    ]

    // Thick borders for 3x3 box separation
    if (row % 3 === 0) baseClasses.push('border-t-2 border-t-gray-800 dark:border-t-gray-300')
    if (col % 3 === 0) baseClasses.push('border-l-2 border-l-gray-800 dark:border-l-gray-300')
    if (row === 8) baseClasses.push('border-b-2 border-b-gray-800 dark:border-b-gray-300')
    if (col === 8) baseClasses.push('border-r-2 border-r-gray-800 dark:border-r-gray-300')

    // State-based styling
    if (isSelected) {
      baseClasses.push('bg-blue-200 dark:bg-blue-800 ring-2 ring-blue-500')
    } else if (isHighlighted) {
      baseClasses.push('bg-blue-100 dark:bg-blue-900')
    } else if (isError) {
      baseClasses.push('bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400')
    } else if (isReadonly && value !== null) {
      baseClasses.push('bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold')
    } else {
      baseClasses.push('bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800')
    }

    if (isReadonly) {
      baseClasses.push('cursor-default')
    }

    return baseClasses.join(' ')
  }

  return (
    <div
      className={getCellClasses()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isReadonly ? -1 : 0}
      role="gridcell"
      aria-label={`Cell ${row + 1}, ${col + 1}${value ? `, value ${value}` : ', empty'}`}
    >
      {value || ''}
    </div>
  )
}

// Main Sudoku Grid Component
export const SudokuGridComponent: React.FC<SudokuGridProps> = ({
  grid,
  solution,
  isReadonly = false,
  onGridChange,
  className,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null)
  const [errors, setErrors] = useState<Set<string>>(new Set())

  const handleCellSelect = useCallback((row: number, col: number) => {
    setSelectedCell({ row, col })
    const cellValue = grid[row][col]
    setHighlightedNumber(cellValue)
  }, [grid])

  const handleCellChange = useCallback(
    (row: number, col: number, value: number) => {
      if (isReadonly) return

      const newGrid = grid.map((gridRow, rowIndex) =>
        gridRow.map((cell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return value === 0 ? null : value
          }
          return cell
        })
      )

      // Check for errors
      const newErrors = new Set<string>()
      if (value !== 0 && !isValidMove(grid, row, col, value)) {
        newErrors.add(`${row}-${col}`)
      }
      setErrors(newErrors)

      onGridChange?.(newGrid)
      setHighlightedNumber(value === 0 ? null : value)
    },
    [grid, isReadonly, onGridChange]
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isReadonly) return

      const { row, col } = selectedCell
      let newRow = row
      let newCol = col

      switch (e.key) {
        case 'ArrowUp':
          newRow = Math.max(0, row - 1)
          break
        case 'ArrowDown':
          newRow = Math.min(8, row + 1)
          break
        case 'ArrowLeft':
          newCol = Math.max(0, col - 1)
          break
        case 'ArrowRight':
          newCol = Math.min(8, col + 1)
          break
        default:
          return
      }

      e.preventDefault()
      setSelectedCell({ row: newRow, col: newCol })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCell, isReadonly])

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {/* Grid */}
      <div
        className="grid grid-cols-9 gap-0 border-2 border-gray-800 dark:border-gray-300 bg-white dark:bg-gray-900 rounded-lg overflow-hidden"
        role="grid"
        aria-label="Sudoku puzzle"
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`
            const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex
            const isHighlighted = highlightedNumber !== null && cell === highlightedNumber
            const isError = errors.has(cellKey)
            const cellIsReadonly = isReadonly || (solution && solution[rowIndex][colIndex] !== null) || false

            return (
              <SudokuCellComponent
                key={cellKey}
                value={cell}
                row={rowIndex}
                col={colIndex}
                isSelected={isSelected}
                isHighlighted={isHighlighted}
                isError={isError}
                isReadonly={cellIsReadonly}
                onChange={handleCellChange}
                onSelect={handleCellSelect}
              />
            )
          })
        )}
      </div>

      {/* Number Input Buttons for Mobile */}
      <div className="grid grid-cols-5 gap-2 sm:hidden w-full max-w-xs">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            className="h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-lg font-medium transition-colors"
            onClick={() => {
              if (selectedCell && !isReadonly) {
                handleCellChange(selectedCell.row, selectedCell.col, num)
              }
            }}
            disabled={!selectedCell || isReadonly}
          >
            {num}
          </button>
        ))}
        <button
          className="h-10 bg-red-500 hover:bg-red-600 text-white rounded-md text-lg font-medium transition-colors col-span-1"
          onClick={() => {
            if (selectedCell && !isReadonly) {
              handleCellChange(selectedCell.row, selectedCell.col, 0)
            }
          }}
          disabled={!selectedCell || isReadonly}
        >
          ×
        </button>
      </div>

      {/* Game Status */}
      <div className="text-center space-y-2">
        {isComplete(grid) && (
          <div className="text-green-600 dark:text-green-400 font-bold text-lg">
            🎉 Puzzle Completed!
          </div>
        )}
        {errors.size > 0 && (
          <div className="text-red-600 dark:text-red-400 text-sm">
            Invalid move detected
          </div>
        )}
      </div>
    </div>
  )
}
