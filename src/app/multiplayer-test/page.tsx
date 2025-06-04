'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSocket } from '@/contexts/SocketContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Play, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle,
  Clock,
  Trophy
} from 'lucide-react'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'PENDING'
  message: string
  timestamp: string
}

export default function MultiplayerTest() {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [testMatchId, setTestMatchId] = useState<string>('')
  const [connectedPlayers, setConnectedPlayers] = useState<string[]>([])
  const [gameState, setGameState] = useState<number[][]>(Array(9).fill(null).map(() => Array(9).fill(0)))
  const [isTestRunning, setIsTestRunning] = useState(false)

  const addTestResult = (test: string, status: 'PASS' | 'FAIL' | 'PENDING', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  useEffect(() => {
    if (!socket) return

    socket.on('joined-game', (data) => {
      addTestResult('Join Game', 'PASS', `Joined game ${data.matchId} with ${data.players.length} players`)
      setTestMatchId(data.matchId)
      setConnectedPlayers(data.players)
      setGameState(data.gameState)
    })

    socket.on('player-joined', (data) => {
      addTestResult('Player Join', 'PASS', `Player joined. Total players: ${data.playersCount}`)
      setConnectedPlayers(prev => [...prev, data.userId])
    })

    socket.on('game-started', (data) => {
      addTestResult('Game Start', 'PASS', 'Game started successfully')
      setGameState(data.gameState)
    })

    socket.on('move-made', (data) => {
      addTestResult('Move Sync', 'PASS', `Move received: [${data.row}, ${data.col}] = ${data.value}`)
      setGameState(data.gameState)
    })

    socket.on('game-completed', (data) => {
      addTestResult('Game Complete', 'PASS', `Game completed. Winner: ${data.winnerId || 'Draw'}`)
    })

    socket.on('error', (error) => {
      addTestResult('Socket Error', 'FAIL', error.message)
    })

    return () => {
      socket.off('joined-game')
      socket.off('player-joined')
      socket.off('game-started')
      socket.off('move-made')
      socket.off('game-completed')
      socket.off('error')
    }
  }, [socket])

  const runComprehensiveTest = async () => {
    setIsTestRunning(true)
    setTestResults([])
    
    addTestResult('Test Suite', 'PENDING', 'Starting comprehensive multiplayer test...')

    // Test 1: Database Connection
    try {
      const dbResponse = await fetch('/api/test-db')
      const dbResult = await dbResponse.json()
      if (dbResult.status === 'success') {
        addTestResult('Database', 'PASS', 'Database connection and operations successful')
      } else {
        addTestResult('Database', 'FAIL', dbResult.message)
      }
    } catch (error) {
      addTestResult('Database', 'FAIL', 'Database connection failed')
    }

    // Test 2: Socket Connection
    if (isConnected) {
      addTestResult('Socket.IO', 'PASS', 'Socket.IO connection established')
    } else {
      addTestResult('Socket.IO', 'FAIL', 'Socket.IO connection failed')
      setIsTestRunning(false)
      return
    }

    // Test 3: Authentication
    if (session?.user) {
      addTestResult('Authentication', 'PASS', `Authenticated as ${session.user.name}`)
    } else {
      addTestResult('Authentication', 'FAIL', 'User not authenticated')
      setIsTestRunning(false)
      return
    }

    // Test 4: Create Match
    try {
      const matchResponse = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MULTIPLAYER_FREE',
          entryFee: 0
        })
      })
      
      if (matchResponse.ok) {
        const match = await matchResponse.json()
        addTestResult('Match Creation', 'PASS', `Match created with ID: ${match.id}`)
        
        // Test 5: Join Game via Socket
        socket?.emit('join-game', {
          matchId: match.id,
          userId: session.user.id
        })
      } else {
        addTestResult('Match Creation', 'FAIL', 'Failed to create match')
      }
    } catch (error) {
      addTestResult('Match Creation', 'FAIL', 'Match creation request failed')
    }

    setIsTestRunning(false)
  }

  const testMove = () => {
    if (!socket || !testMatchId || !session?.user?.id) return
    
    // Make a test move
    const row = Math.floor(Math.random() * 9)
    const col = Math.floor(Math.random() * 9)
    const value = Math.floor(Math.random() * 9) + 1
    
    socket.emit('make-move', {
      matchId: testMatchId,
      playerId: session.user.id,
      row,
      col,
      value
    })
    
    addTestResult('Test Move', 'PENDING', `Sending move: [${row}, ${col}] = ${value}`)
  }

  const clearResults = () => {
    setTestResults([])
    setTestMatchId('')
    setConnectedPlayers([])
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please sign in to run multiplayer tests</p>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Multiplayer Test Suite</span>
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <Badge variant="outline">
                  {session.user.name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Test Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  onClick={runComprehensiveTest}
                  disabled={isTestRunning || !isConnected}
                  className="w-full"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isTestRunning ? 'Running...' : 'Run Full Test'}
                </Button>
                
                <Button 
                  onClick={testMove}
                  disabled={!testMatchId || !isConnected}
                  variant="outline"
                  className="w-full"
                >
                  Test Move
                </Button>
              </div>

              <Button 
                onClick={clearResults}
                variant="outline"
                className="w-full"
              >
                Clear Results
              </Button>

              {/* Match Info */}
              {testMatchId && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-sm font-medium mb-1">Active Match</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    ID: {testMatchId}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">Players: {connectedPlayers.length}</span>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={() => window.open('/dashboard', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  Open Dashboard
                </Button>
                <Button 
                  onClick={() => window.open('/test', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  Socket Test
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Test Results</span>
                <Badge variant="outline">{testResults.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No test results yet. Run the test suite to begin.
                  </p>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        {result.status === 'PASS' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {result.status === 'FAIL' && <XCircle className="w-4 h-4 text-red-500" />}
                        {result.status === 'PENDING' && <Clock className="w-4 h-4 text-yellow-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{result.test}</span>
                          <span className="text-xs text-gray-500">{result.timestamp}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {result.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Game State Visualization */}
        {testMatchId && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Game State Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-9 gap-1 max-w-md mx-auto">
                {gameState.flat().map((cell, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 border border-gray-300 flex items-center justify-center text-xs font-medium bg-white"
                  >
                    {cell || ''}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
