const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3003

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  // Enhanced game room management
  const gameRooms = new Map()
  const playerSockets = new Map() // Map of userId to socketId

  // Check if grid is completely filled
  const isGridComplete = (grid) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) return false
      }
    }
    return true
  }

  // Sudoku validation function - only validate when grid is complete
  const validateSudokuCompletion = (grid, solution) => {
    // First check if grid is completely filled
    if (!isGridComplete(grid)) return { isComplete: false, isValid: false }

    // If solution is available, check against it
    if (solution) {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] !== solution[row][col]) {
            return { isComplete: true, isValid: false } // Grid complete but wrong
          }
        }
      }
      return { isComplete: true, isValid: true } // Grid complete and correct
    }

    // Otherwise validate Sudoku rules (when no solution provided)
    // Check rows
    for (let row = 0; row < 9; row++) {
      const numbers = new Set(grid[row])
      if (numbers.size !== 9 || !hasAllNumbers(numbers)) {
        return { isComplete: true, isValid: false }
      }
    }

    // Check columns
    for (let col = 0; col < 9; col++) {
      const numbers = new Set()
      for (let row = 0; row < 9; row++) {
        numbers.add(grid[row][col])
      }
      if (numbers.size !== 9 || !hasAllNumbers(numbers)) {
        return { isComplete: true, isValid: false }
      }
    }

    // Check 3x3 boxes
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const numbers = new Set()
        for (let row = boxRow * 3; row < (boxRow + 1) * 3; row++) {
          for (let col = boxCol * 3; col < (boxCol + 1) * 3; col++) {
            numbers.add(grid[row][col])
          }
        }
        if (numbers.size !== 9 || !hasAllNumbers(numbers)) {
          return { isComplete: true, isValid: false }
        }
      }
    }

    return { isComplete: true, isValid: true }
  }

  const hasAllNumbers = (numberSet) => {
    for (let i = 1; i <= 9; i++) {
      if (!numberSet.has(i)) return false
    }
    return true
  }
  
  const createDefaultGameState = () => ({
    grid: Array(9).fill(null).map(() => Array(9).fill(0)),
    solution: Array(9).fill(null).map(() => Array(9).fill(0)),
    difficulty: 'medium',
    startTime: new Date(),
    gameMode: 'SIMULTANEOUS'
  })

  const createDefaultRoomState = (matchId) => ({
    id: matchId,
    status: 'WAITING',
    players: [],
    spectatorCount: 0,
    gameState: createDefaultGameState(),
    settings: {
      timeLimit: 1800, // 30 minutes
      hintsAllowed: 3,
      spectatorMode: true,
      privateRoom: false,
      maxSpectators: 10
    }
  })

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    // Enhanced join-game handler
    socket.on('join-game', async (data) => {
      const { matchId, userId } = data
      console.log(`User ${userId} joining game ${matchId}`)
      
      socket.join(matchId)
      playerSockets.set(userId, socket.id)
      
      if (!gameRooms.has(matchId)) {
        // Load match data directly from database
        try {
          const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
              player1: { select: { id: true, name: true, image: true } },
              player2: { select: { id: true, name: true, image: true } }
            }
          })
          
          if (match) {
            console.log(`Loading match data for ${matchId}:`, match.type, match.status)
            
            // Parse the sudoku grid and solution
            const sudokuGrid = JSON.parse(match.sudokuGrid)
            const solution = match.solution ? JSON.parse(match.solution) : null
            
            // Create room state based on match data
            const roomState = {
              id: matchId,
              status: match.status, // Use actual match status (ONGOING for single player)
              players: [],
              spectatorCount: 0,
              gameState: {
                grid: sudokuGrid,
                solution: solution,
                difficulty: 'medium',
                startTime: new Date(match.startedAt || match.createdAt),
                gameMode: match.type === 'SINGLE_PLAYER' ? 'SINGLE_PLAYER' : 'SIMULTANEOUS',
                timeRemaining: 1800 // 30 minutes
              },
              settings: {
                timeLimit: 1800,
                hintsAllowed: 3,
                spectatorMode: true,
                privateRoom: false,
                maxSpectators: 10
              }
            }
            
            gameRooms.set(matchId, roomState)
          } else {
            // Fallback to default room state
            gameRooms.set(matchId, createDefaultRoomState(matchId))
          }
        } catch (error) {
          console.error('Error loading match data:', error)
          // Fallback to default room state
          gameRooms.set(matchId, createDefaultRoomState(matchId))
        }
      }
      
      const roomState = gameRooms.get(matchId)
      let existingPlayer = roomState.players.find(p => p.id === userId)
      
      if (!existingPlayer) {
        existingPlayer = {
          id: userId,
          name: `Player ${userId.substring(0, 8)}`,
          isReady: roomState.gameState.gameMode === 'SINGLE_PLAYER', // Auto-ready for single player
          isConnected: true,
          score: 0,
          moves: 0,
          hintsUsed: 0,
          hintsRemaining: roomState.settings.hintsAllowed,
          progress: roomState.gameState.grid.map(row => [...row]) // Initialize with current grid
        }
        roomState.players.push(existingPlayer)
      } else {
        existingPlayer.isConnected = true
      }
      
      // For single player games, make sure status is IN_PROGRESS
      if (roomState.gameState.gameMode === 'SINGLE_PLAYER' && roomState.status === 'ONGOING') {
        roomState.status = 'IN_PROGRESS'
      }
      
      // Send updated room state
      socket.emit('game-state', roomState)
      socket.to(matchId).emit('player-joined', { 
        userId, 
        playerName: existingPlayer.name, 
        roomState 
      })
      
      console.log(`Game ${matchId} now has ${roomState.players.length} players, status: ${roomState.status}`)
    })

    // Enhanced make-move handler
    socket.on('make-move', (data) => {
      const { row, col, value } = data
      const matchId = [...socket.rooms].find(room => room !== socket.id)
      const userId = [...playerSockets.entries()].find(([, socketId]) => socketId === socket.id)?.[0]
      
      if (!matchId || !userId) return
      
      console.log(`Move made in game ${matchId}: ${userId} placed ${value} at (${row}, ${col})`)
      
      const roomState = gameRooms.get(matchId)
      if (!roomState) return
      
      const player = roomState.players.find(p => p.id === userId)
      if (!player) return
      
      // Validate move (basic validation - just check if number is valid)
      const isValidValue = value === null || (value >= 1 && value <= 9)
      
      if (isValidValue) {
        // Update game state
        roomState.gameState.grid[row][col] = value || 0
        player.moves++
        player.score += value ? 10 : 0 // Simple scoring
        
        const moveData = {
          move: {
            playerId: userId,
            row,
            col,
            value,
            timestamp: new Date(),
            isValid: true
          },
          playerProgress: roomState.gameState.grid,
          playerStats: {
            moves: player.moves,
            score: player.score,
            hintsUsed: player.hintsUsed
          }
        }
        
        io.to(matchId).emit('move-made', moveData)
        socket.emit('game-state', roomState)
        socket.to(matchId).emit('game-state', roomState)
        
        // Only check for game completion when grid is potentially complete
        const completionResult = validateSudokuCompletion(roomState.gameState.grid, roomState.gameState.solution)
        
        if (completionResult.isComplete) {
          roomState.status = 'COMPLETED'
          
          if (completionResult.isValid) {
            // Player won - correct solution
            const winner = roomState.players.reduce((prev, current) => 
              (prev.score > current.score) ? prev : current
            )
            
            io.to(matchId).emit('game-completed', { 
              result: 'won',
              winner: {
                id: winner.id,
                name: winner.name,
                score: winner.score,
                stats: {
                  moves: winner.moves,
                  hintsUsed: winner.hintsUsed,
                  timeSpent: Math.floor((new Date() - roomState.gameState.startTime) / 1000)
                }
              },
              roomState,
              message: 'Congratulations! You solved the puzzle correctly!'
            })
          } else {
            // Player lost - incorrect solution
            io.to(matchId).emit('game-completed', { 
              result: 'lost',
              roomState,
              message: 'Game Over! The solution is incorrect. Try again!'
            })
          }
        }
      } else {
        socket.emit('move-invalid', {
          reason: 'Invalid value - must be between 1-9',
          move: { row, col, value }
        })
      }
    })

    // Hint request handler
    socket.on('request-hint', () => {
      const matchId = [...socket.rooms].find(room => room !== socket.id)
      const userId = [...playerSockets.entries()].find(([, socketId]) => socketId === socket.id)?.[0]
      
      if (!matchId || !userId) return
      
      const roomState = gameRooms.get(matchId)
      if (!roomState) return
      
      const player = roomState.players.find(p => p.id === userId)
      if (!player || player.hintsRemaining <= 0) {
        socket.emit('error', { message: 'No hints remaining' })
        return
      }
      
      // Find an empty cell and provide a hint (simplified)
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (roomState.gameState.grid[row][col] === 0) {
            const hintValue = Math.floor(Math.random() * 9) + 1 // Random hint
            
            player.hintsUsed++
            player.hintsRemaining--
            
            socket.emit('hint-provided', { row, col, value: hintValue })
            io.to(matchId).emit('hint-used', {
              playerId: userId,
              hintsRemaining: player.hintsRemaining,
              hintCell: { row, col, value: hintValue }
            })
            return
          }
        }
      }
    })

    // Ready state handler
    socket.on('set-ready', (data) => {
      const { isReady } = data
      const matchId = [...socket.rooms].find(room => room !== socket.id)
      const userId = [...playerSockets.entries()].find(([, socketId]) => socketId === socket.id)?.[0]
      
      if (!matchId || !userId) return
      
      const roomState = gameRooms.get(matchId)
      if (!roomState) return
      
      const player = roomState.players.find(p => p.id === userId)
      if (player) {
        player.isReady = isReady
        
        const allReady = roomState.players.length >= 2 && 
                        roomState.players.every(p => p.isReady)
        
        io.to(matchId).emit('player-ready-changed', {
          playerId: userId,
          isReady,
          allReady
        })
        
        if (allReady && roomState.status === 'WAITING') {
          roomState.status = 'STARTING'
          setTimeout(() => {
            roomState.status = 'IN_PROGRESS'
            roomState.gameState.startTime = new Date()
            io.to(matchId).emit('game-started', { roomState, countdown: 0 })
          }, 3000) // 3 second countdown
        }
      }
    })

    // Message handler
    socket.on('send-message', (data) => {
      const { message } = data
      const matchId = [...socket.rooms].find(room => room !== socket.id)
      const userId = [...playerSockets.entries()].find(([, socketId]) => socketId === socket.id)?.[0]
      
      if (!matchId || !userId) return
      
      const roomState = gameRooms.get(matchId)
      if (!roomState) return
      
      const player = roomState.players.find(p => p.id === userId)
      if (player) {
        io.to(matchId).emit('message-received', {
          playerId: userId,
          playerName: player.name,
          message,
          timestamp: new Date().toISOString()
        })
      }
    })

    // Surrender handler
    socket.on('surrender', () => {
      const matchId = [...socket.rooms].find(room => room !== socket.id)
      const userId = [...playerSockets.entries()].find(([, socketId]) => socketId === socket.id)?.[0]
      
      if (!matchId || !userId) return
      
      const roomState = gameRooms.get(matchId)
      if (roomState) {
        roomState.status = 'COMPLETED'
        const winner = roomState.players.find(p => p.id !== userId)
        
        io.to(matchId).emit('player-surrendered', {
          playerId: userId,
          timestamp: new Date().toISOString()
        })
        
        if (winner) {
          io.to(matchId).emit('game-completed', {
            winner: {
              id: winner.id,
              name: winner.name,
              score: winner.score,
              stats: {
                moves: winner.moves,
                hintsUsed: winner.hintsUsed,
                timeSpent: Math.floor((new Date() - roomState.gameState.startTime) / 1000)
              }
            },
            roomState
          })
        }
      }
    })

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id)
      
      // Find and clean up user data
      const userId = [...playerSockets.entries()].find(([, socketId]) => socketId === socket.id)?.[0]
      if (userId) {
        playerSockets.delete(userId)
        
        // Mark player as disconnected in all rooms
        for (const [matchId, roomState] of gameRooms.entries()) {
          const player = roomState.players.find(p => p.id === userId)
          if (player) {
            player.isConnected = false
            socket.to(matchId).emit('player-disconnected', {
              userId,
              timestamp: new Date().toISOString()
            })
            
            // Remove player after 30 seconds if still disconnected
            setTimeout(() => {
              const currentPlayer = roomState.players.find(p => p.id === userId)
              if (currentPlayer && !currentPlayer.isConnected) {
                roomState.players = roomState.players.filter(p => p.id !== userId)
                io.to(matchId).emit('player-left', { playerId: userId, roomState })
                
                if (roomState.players.length === 0) {
                  gameRooms.delete(matchId)
                  console.log(`Deleted empty game room: ${matchId}`)
                }
              }
            }, 30000)
          }
        }
      }
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log('> Socket.IO server running alongside Next.js')
    })
})
