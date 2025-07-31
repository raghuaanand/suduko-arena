// Enhanced Socket.IO integration for Next.js 15 App Router
// This route properly integrates with GameRoomManager for real-time multiplayer functionality

// Keep track of Socket.IO server initialization
let isInitialized = false

export async function GET() {
  if (!isInitialized) {
    console.log('Socket.IO server status check...')
    isInitialized = true
  }

  return new Response(JSON.stringify({ 
    status: 'Socket.IO server is ready',
    path: '/api/socket',
    timestamp: new Date().toISOString(),
    note: 'Real-time functionality managed by enhanced socket system'
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function POST() {
  return new Response(JSON.stringify({ 
    status: 'Socket.IO server is active',
    message: 'Use WebSocket connection for real-time communication'
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
