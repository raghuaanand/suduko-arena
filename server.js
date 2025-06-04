const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

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

  const gameRooms = new Map()

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id)

    socket.on('join-game', (data) => {
      const { matchId, userId } = data
      console.log(`User ${userId} joining game ${matchId}`)
      
      socket.join(matchId)
      
      if (!gameRooms.has(matchId)) {
        gameRooms.set(matchId, {
          matchId,
          players: [],
          gameState: Array(9).fill(null).map(() => Array(9).fill(0)),
          currentPlayer: 0,
          isActive: true
        })
      }
      
      const game = gameRooms.get(matchId)
      if (!game.players.includes(userId)) {
        game.players.push(userId)
      }
      
      socket.emit('joined-game', game)
      socket.to(matchId).emit('player-joined', { userId, game })
    })

    socket.on('make-move', (data) => {
      const { matchId, playerId, row, col, value } = data
      console.log(`Move made in game ${matchId}: ${playerId} placed ${value} at (${row}, ${col})`)
      
      const game = gameRooms.get(matchId)
      if (game && game.gameState[row] && game.gameState[row][col] === 0) {
        game.gameState[row][col] = value
        
        const moveData = {
          playerId,
          row,
          col,
          value,
          gameState: game.gameState
        }
        
        io.to(matchId).emit('move-made', moveData)
        
        // Check for game completion (simple check - all cells filled)
        const isComplete = game.gameState.every(row => row.every(cell => cell !== 0))
        if (isComplete) {
          io.to(matchId).emit('game-completed', { winner: playerId, game })
          game.isActive = false
        }
      }
    })

    socket.on('leave-game', (data) => {
      const { matchId, userId } = data
      console.log(`User ${userId} leaving game ${matchId}`)
      
      socket.leave(matchId)
      socket.to(matchId).emit('player-left', { userId })
      
      const game = gameRooms.get(matchId)
      if (game) {
        game.players = game.players.filter(id => id !== userId)
        if (game.players.length === 0) {
          gameRooms.delete(matchId)
        }
      }
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id)
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
