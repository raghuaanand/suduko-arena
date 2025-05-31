// Type definitions for the Sudoku Arena application

export type MatchType = 'SINGLE_PLAYER' | 'MULTIPLAYER_FREE' | 'MULTIPLAYER_PAID'
export type MatchStatus = 'WAITING' | 'ONGOING' | 'FINISHED' | 'CANCELLED'
export type TransactionType = 'ADD_FUNDS' | 'WITHDRAW' | 'MATCH_WIN' | 'ENTRY_FEE'

export interface User {
  id: string
  name?: string
  email: string
  password?: string
  emailVerified?: Date
  image?: string
  walletBalance: number
  createdAt: Date
  updatedAt: Date
}

export interface Match {
  id: string
  type: MatchType
  entryFee: number
  prize: number
  sudokuGrid: string
  solution?: string
  player1Id: string
  player2Id?: string
  winnerId?: string
  startedAt: Date
  endedAt?: Date
  status: MatchStatus
  createdAt: Date
  updatedAt: Date
  player1?: User
  player2?: User
}

export interface Transaction {
  id: string
  userId: string
  amount: number
  type: TransactionType
  description?: string
  razorpayId?: string
  status: string
  createdAt: Date
  updatedAt: Date
  user?: User
}

// Sudoku grid types
export type SudokuCell = number | null
export type SudokuGrid = SudokuCell[][]

// Game state types
export interface GameState {
  grid: SudokuGrid
  solution: SudokuGrid
  startTime: Date
  endTime?: Date
  isComplete: boolean
  errors: number
}

// Socket event types
export interface SocketEvents {
  'player:join': (matchId: string) => void
  'player:progress': (grid: SudokuGrid) => void
  'player:solved': (time: number) => void
  'player:left': () => void
  'game:start': (match: Match) => void
  'game:end': (winner: string) => void
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface WalletForm {
  amount: number
}

// Component props types
export interface SudokuCellProps {
  value: SudokuCell
  row: number
  col: number
  isSelected: boolean
  isHighlighted: boolean
  isError: boolean
  isReadonly: boolean
  onChange: (row: number, col: number, value: number) => void
  onSelect: (row: number, col: number) => void
}

export interface SudokuGridProps {
  grid: SudokuGrid
  solution?: SudokuGrid
  isReadonly?: boolean
  onGridChange?: (grid: SudokuGrid) => void
  className?: string
}

export interface MatchCardProps {
  match: Match
  onJoin?: (matchId: string) => void
  onView?: (matchId: string) => void
}

// Responsive breakpoint types
export type BreakpointKey = 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface ResponsiveValue<T> {
  base?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  '2xl'?: T
}
