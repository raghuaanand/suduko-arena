// Socket.IO connection handling
import { Server as NetServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { prisma } from '@/lib/prisma'
import { MatchType, MatchStatus } from '@prisma/client'

interface SocketData {
  userId?: string
  matchId?: string
}

interface GameRoom {
  id: string
  players: string[]
  gameState: number[][]
  currentPlayer: number
  gameMode: MatchType
  lastMove?: {
    playerId: string
    row: number
    col: number
    value: number
    timestamp: Date
  }
}

const gameRooms = new Map<string, GameRoom>()
let io: SocketIOServer | null = null

export async function GET() {
  if (!io) {
    console.log('Initializing Socket.IO server...')
    
    // Create a simple HTTP server for Socket.IO
    const httpServer = new NetServer()
    
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: ["http://localhost:3001", "http://localhost:3000", "http://localhost:3003"],
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling']
    })

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id)

      // Join a game room
      socket.on('join-game', async (data: { matchId: string; userId: string }) => {
        const { matchId, userId } = data
        
        try {
          // Get match from database
          const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: { 
              player1: true,
              player2: true 
            }
          })

          if (!match) {
            socket.emit('error', { message: 'Match not found' })
            return
          }

          // Check if user is part of this match
          const isPlayer = match.player1Id === userId || match.player2Id === userId
          if (!isPlayer) {
            socket.emit('error', { message: 'You are not part of this match' })
            return
          }

          // Join the room
          socket.join(matchId)
          const socketData = socket.data as SocketData
          socketData.userId = userId
          socketData.matchId = matchId

          // Create or update game room
          let gameRoom = gameRooms.get(matchId)
          if (!gameRoom) {
            gameRoom = {
              id: matchId,
              players: [userId],
              gameState: JSON.parse(match.sudokuGrid) as number[][],
              currentPlayer: 0,
              gameMode: match.type,
              startTime: match.createdAt,
            } as GameRoom
            gameRooms.set(matchId, gameRoom)
          } else if (!gameRoom.players.includes(userId)) {
            gameRoom.players.push(userId)
          }

          // Notify all players in the room
          io!.to(matchId).emit('player-joined', {
            userId,
            playersCount: gameRoom.players.length,
            gameState: gameRoom.gameState
          })

          // If match is ready to start (has required players)
          const maxPlayers = match.type === MatchType.SINGLE_PLAYER ? 1 : 2
          if (gameRoom.players.length === maxPlayers && match.status === MatchStatus.WAITING) {
            await prisma.match.update({
              where: { id: matchId },
              data: { status: MatchStatus.ONGOING, startedAt: new Date() }
            })

            io!.to(matchId).emit('game-started', {
              gameState: gameRoom.gameState,
              currentPlayer: gameRoom.currentPlayer,
              players: gameRoom.players
            })
          }

        } catch (error) {
          console.error('Error joining game:', error)
          socket.emit('error', { message: 'Failed to join game' })
        }
      })

      // Handle game moves
      socket.on('make-move', async (data: { row: number; col: number; value: number }) => {
        const { row, col, value } = data
        const socketData = socket.data as SocketData
        const matchId = socketData.matchId
        const userId = socketData.userId

        if (!matchId || !userId) {
          socket.emit('error', { message: 'Not in a game' })
          return
        }

        try {
          const gameRoom = gameRooms.get(matchId)
          if (!gameRoom) {
            socket.emit('error', { message: 'Game room not found' })
            return
          }

          // Validate move
          if (gameRoom.gameState[row][col] !== 0) {
            socket.emit('error', { message: 'Cell already filled' })
            return
          }

          // Check if it's the player's turn (for multiplayer)
          if (gameRoom.gameMode === MatchType.MULTIPLAYER_FREE) {
            const playerIndex = gameRoom.players.indexOf(userId)
            if (playerIndex !== gameRoom.currentPlayer) {
              socket.emit('error', { message: 'Not your turn' })
              return
            }
          }

          // Make the move
          gameRoom.gameState[row][col] = value
          gameRoom.lastMove = {
            playerId: userId,
            row,
            col,
            value,
            timestamp: new Date()
          }

          // Switch turns for multiplayer
          if (gameRoom.gameMode === MatchType.MULTIPLAYER_FREE) {
            gameRoom.currentPlayer = (gameRoom.currentPlayer + 1) % gameRoom.players.length
          }

          // Save move to database
          await prisma.match.update({
            where: { id: matchId },
            data: {
              sudokuGrid: JSON.stringify(gameRoom.gameState),
              updatedAt: new Date()
            }
          })

          // Check if game is complete
          const isComplete = checkGameComplete(gameRoom.gameState)
          
          if (isComplete) {
            // Game completed
            await prisma.match.update({
              where: { id: matchId },
              data: {
                status: MatchStatus.FINISHED,
                endedAt: new Date(),
                winnerId: userId
              }
            })

            io!.to(matchId).emit('game-completed', {
              winnerId: userId,
              gameState: gameRoom.gameState
            })

            // Clean up game room
            gameRooms.delete(matchId)
          } else {
            // Broadcast move to all players
            io!.to(matchId).emit('move-made', {
              playerId: userId,
              row,
              col,
              value,
              gameState: gameRoom.gameState,
              currentPlayer: gameRoom.currentPlayer
            })
          }

        } catch (error) {
          console.error('Error making move:', error)
          socket.emit('error', { message: 'Failed to make move' })
        }
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
        const socketData = socket.data as SocketData
        const matchId = socketData.matchId
        const userId = socketData.userId

        if (matchId && userId) {
          const gameRoom = gameRooms.get(matchId)
          if (gameRoom) {
            gameRoom.players = gameRoom.players.filter(id => id !== userId)
            
            // Notify other players
            socket.to(matchId).emit('player-left', {
              userId,
              playersCount: gameRoom.players.length
            })

            // If no players left, clean up room
            if (gameRoom.players.length === 0) {
              gameRooms.delete(matchId)
            }
          }
        }
      })
    })
  }

  return new Response('Socket.IO server running', { status: 200 })
}

// Helper functions
function checkGameComplete(grid: number[][]): boolean {
  // Check if all cells are filled
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (grid[i][j] === 0) return false
    }
  }

  // Check if solution is valid
  return isValidSudoku(grid)
}

function isValidSudoku(grid: number[][]): boolean {
  // Check rows
  for (let i = 0; i < 9; i++) {
    const seen = new Set<number>()
    for (let j = 0; j < 9; j++) {
      if (grid[i][j] !== 0) {
        if (seen.has(grid[i][j])) return false
        seen.add(grid[i][j])
      }
    }
  }

  // Check columns
  for (let j = 0; j < 9; j++) {
    const seen = new Set<number>()
    for (let i = 0; i < 9; i++) {
      if (grid[i][j] !== 0) {
        if (seen.has(grid[i][j])) return false
        seen.add(grid[i][j])
      }
    }
  }

  // Check 3x3 boxes
  for (let box = 0; box < 9; box++) {
    const seen = new Set<number>()
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const row = Math.floor(box / 3) * 3 + i
        const col = (box % 3) * 3 + j
        if (grid[row][col] !== 0) {
          if (seen.has(grid[row][col])) return false
          seen.add(grid[row][col])
        }
      }
    }
  }

  return true
}
