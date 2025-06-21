import { Server as SocketIOServer } from 'socket.io'
import { prisma } from './prisma'
import { MatchType, MatchStatus } from '@prisma/client'

interface GameRoom {
  id: string
  players: string[]
  gameState: number[][]
  currentPlayer: number
  gameMode: MatchType
}

interface SocketData {
  userId?: string
  matchId?: string
}

const gameRooms = new Map<string, GameRoom>()

export function setupSocketIO(io: SocketIOServer) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    socket.on('join-game', async (data: { matchId: string; userId: string }) => {
      try {
        const { matchId, userId } = data
        
        // Get match details
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

        // Check if user is part of the match
        const isPlayer = match.player1Id === userId || match.player2Id === userId
        if (!isPlayer) {
          socket.emit('error', { message: 'Not authorized to join this match' })
          return
        }

        // Store user data on socket
        const socketData = socket.data as SocketData
        socketData.userId = userId
        socketData.matchId = matchId

        // Join socket room
        socket.join(matchId)

        // Parse sudoku grid from string
        const sudokuGrid = JSON.parse(match.sudokuGrid) as number[][]

        // Initialize or update game room
        if (!gameRooms.has(matchId)) {
          gameRooms.set(matchId, {
            id: matchId,
            players: [userId],
            gameState: sudokuGrid,
            currentPlayer: 0,
            gameMode: match.type,
          })
        } else {
          const gameRoom = gameRooms.get(matchId)!
          if (!gameRoom.players.includes(userId)) {
            gameRoom.players.push(userId)
          }
        }

        const gameRoom = gameRooms.get(matchId)!

        // Calculate max players based on match type
        const maxPlayers = match.type === MatchType.SINGLE_PLAYER ? 1 : 2

        // Start game if all players joined
        if (gameRoom.players.length === maxPlayers && match.status === MatchStatus.WAITING) {
          await prisma.match.update({
            where: { id: matchId },
            data: { status: MatchStatus.ONGOING, startedAt: new Date() }
          })

          io.to(matchId).emit('game-started', {
            gameState: gameRoom.gameState,
            currentPlayer: gameRoom.currentPlayer
          })
        }

        socket.emit('joined-game', {
          matchId,
          gameState: gameRoom.gameState,
          players: gameRoom.players,
          currentPlayer: gameRoom.currentPlayer
        })

      } catch (error) {
        console.error('Error joining game:', error)
        socket.emit('error', { message: 'Failed to join game' })
      }
    })

    socket.on('make-move', async (data: { matchId: string; row: number; col: number; value: number }) => {
      try {
        const gameRoom = gameRooms.get(data.matchId)
        if (!gameRoom) {
          socket.emit('error', { message: 'Game room not found' })
          return
        }

        // Update game state
        gameRoom.gameState[data.row][data.col] = data.value

        // Update database
        await prisma.match.update({
          where: { id: data.matchId },
          data: {
            sudokuGrid: JSON.stringify(gameRoom.gameState),
          }
        })

        // Broadcast move to all players
        io.to(data.matchId).emit('move-made', {
          row: data.row,
          col: data.col,
          value: data.value,
          gameState: gameRoom.gameState
        })

        // Check for game completion
        if (isGameComplete(gameRoom.gameState)) {
          await prisma.match.update({
            where: { id: data.matchId },
            data: {
              status: MatchStatus.FINISHED,
              endedAt: new Date()
            }
          })

          io.to(data.matchId).emit('game-completed', {
            gameState: gameRoom.gameState
          })
        }

      } catch (error) {
        console.error('Error making move:', error)
        socket.emit('error', { message: 'Failed to make move' })
      }
    })

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id)
      
      // Clean up user from game rooms
      const socketData = socket.data as SocketData
      if (socketData.matchId && socketData.userId) {
        const gameRoom = gameRooms.get(socketData.matchId)
        if (gameRoom) {
          gameRoom.players = gameRoom.players.filter(id => id !== socketData.userId)
          if (gameRoom.players.length === 0) {
            gameRooms.delete(socketData.matchId)
          }
        }
      }
    })

  })
}

function isGameComplete(gameState: number[][]): boolean {
  // Check if all cells are filled
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (gameState[row][col] === 0) {
        return false
      }
    }
  }
  return true
}
