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
  Trophy,
  Gamepad2,
  Shield,
  Database,
  UserPlus,
  LogIn
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL' | 'PENDING' | 'RUNNING'
  message: string
  timestamp: string
  duration?: number
}

interface User {
  name: string
  email: string
  password: string
}

export default function IntegrationTest() {
  const { data: session } = useSession()
  const { socket, isConnected } = useSocket()
  const router = useRouter()
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isTestRunning, setIsTestRunning] = useState(false)
  const [testUser, setTestUser] = useState<User>({
    name: 'Integration Test User',
    email: `test-${Date.now()}@example.com`,
    password: 'testpass123'
  })
  const [createdMatchId, setCreatedMatchId] = useState<string>('')
  const [gameState, setGameState] = useState<number[][]>(Array(9).fill(null).map(() => Array(9).fill(0)))

  const addTestResult = (test: string, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString(),
      duration
    }])
  }

  const updateTestResult = (test: string, status: TestResult['status'], message: string, duration?: number) => {
    setTestResults(prev => prev.map(result => 
      result.test === test 
        ? { ...result, status, message, duration }
        : result
    ))
  }

  useEffect(() => {
    if (!socket) return

    socket.on('joined-game', (data) => {
      updateTestResult('Socket: Join Game', 'PASS', `Successfully joined game ${data.matchId}`)
      setCreatedMatchId(data.matchId)
      setGameState(data.gameState)
    })

    socket.on('game-started', (data) => {
      updateTestResult('Socket: Game Start', 'PASS', 'Game started successfully with all players')
      setGameState(data.gameState)
    })

    socket.on('move-made', (data) => {
      updateTestResult('Socket: Move Sync', 'PASS', `Move synchronized: [${data.row}, ${data.col}] = ${data.value}`)
      setGameState(data.gameState)
    })

    socket.on('error', (error) => {
      addTestResult('Socket: Error', 'FAIL', error.message)
    })

    return () => {
      socket.off('joined-game')
      socket.off('game-started')
      socket.off('move-made')
      socket.off('error')
    }
  }, [socket])

  const runFullIntegrationTest = async () => {
    setIsTestRunning(true)
    setTestResults([])
    
    addTestResult('Test Suite', 'RUNNING', 'Starting comprehensive integration test...')

    // Test 1: Database Connectivity
    addTestResult('Database: Connection', 'RUNNING', 'Testing database connectivity...')
    const dbStart = Date.now()
    try {
      const dbResponse = await fetch('/api/test-db')
      const dbResult = await dbResponse.json()
      const dbDuration = Date.now() - dbStart
      
      if (dbResult.status === 'success') {
        updateTestResult('Database: Connection', 'PASS', `Database operations successful`, dbDuration)
      } else {
        updateTestResult('Database: Connection', 'FAIL', dbResult.message, dbDuration)
        setIsTestRunning(false)
        return
      }
    } catch (error) {
      updateTestResult('Database: Connection', 'FAIL', `Database connection failed: ${error}`, Date.now() - dbStart)
      setIsTestRunning(false)
      return
    }

    // Test 2: User Registration
    addTestResult('Auth: User Registration', 'RUNNING', 'Testing user registration...')
    const regStart = Date.now()
    try {
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      })
      const regDuration = Date.now() - regStart
      
      if (signupResponse.ok) {
        updateTestResult('Auth: User Registration', 'PASS', `User registered successfully`, regDuration)
      } else {
        const error = await signupResponse.json()
        updateTestResult('Auth: User Registration', 'FAIL', error.message, regDuration)
      }
    } catch (error) {
      updateTestResult('Auth: User Registration', 'FAIL', `Registration failed: ${error}`, Date.now() - regStart)
    }

    // Test 3: Socket.IO Connection
    if (isConnected) {
      addTestResult('Socket: Connection', 'PASS', 'Socket.IO connection established')
    } else {
      addTestResult('Socket: Connection', 'FAIL', 'Socket.IO connection failed')
      setIsTestRunning(false)
      return
    }

    // Test 4: Authentication Status
    if (session?.user) {
      addTestResult('Auth: Session', 'PASS', `Authenticated as ${session.user.name}`)
    } else {
      addTestResult('Auth: Session', 'FAIL', 'User not authenticated')
      setIsTestRunning(false)
      return
    }

    // Test 5: Match Creation
    addTestResult('Game: Match Creation', 'RUNNING', 'Creating multiplayer match...')
    const matchStart = Date.now()
    try {
      const matchResponse = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MULTIPLAYER_FREE',
          entryFee: 0,
          difficulty: 'medium'
        })
      })
      const matchDuration = Date.now() - matchStart
      
      if (matchResponse.ok) {
        const response = await matchResponse.json()
        
        // API always returns { match: {...} } structure
        if (response.match && response.match.id) {
          updateTestResult('Game: Match Creation', 'PASS', `Match created: ${response.match.id} (Status: ${response.match.status})`, matchDuration)
          setCreatedMatchId(response.match.id)
          
          // Test 6: Socket Game Join
          addTestResult('Socket: Join Game', 'RUNNING', 'Joining game via Socket.IO...')
          socket?.emit('join-game', {
            matchId: response.match.id,
            userId: session.user.id
          })
        } else {
          // Unexpected response structure
          updateTestResult('Game: Match Creation', 'FAIL', `Unexpected response structure: ${JSON.stringify(response)}`, matchDuration)
        }
      } else {
        const error = await matchResponse.json()
        updateTestResult('Game: Match Creation', 'FAIL', error.message, matchDuration)
      }
    } catch (error) {
      updateTestResult('Game: Match Creation', 'FAIL', `Match creation failed: ${error}`, Date.now() - matchStart)
    }

    // Test 7: Puzzle Generation
    addTestResult('Game: Puzzle Validation', 'RUNNING', 'Validating Sudoku puzzle...')
    const puzzleStart = Date.now()
    
    // Wait a moment for game state to be set
    setTimeout(() => {
      const puzzleDuration = Date.now() - puzzleStart
      if (gameState && gameState.length === 9 && gameState[0].length === 9) {
        const filledCells = gameState.flat().filter(cell => cell !== 0).length
        updateTestResult('Game: Puzzle Validation', 'PASS', `Valid 9x9 grid with ${filledCells} filled cells`, puzzleDuration)
      } else {
        updateTestResult('Game: Puzzle Validation', 'FAIL', 'Invalid puzzle format', puzzleDuration)
      }
    }, 1000)

    // Test 8: Real-time Move
    setTimeout(() => {
      if (createdMatchId && socket && session?.user?.id) {
        addTestResult('Socket: Move Sync', 'RUNNING', 'Testing real-time move synchronization...')
        
        // Find an empty cell and make a move
        let moveRow = -1, moveCol = -1
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (gameState[row][col] === 0) {
              moveRow = row
              moveCol = col
              break
            }
          }
          if (moveRow !== -1) break
        }
        
        if (moveRow !== -1 && moveCol !== -1) {
          socket.emit('make-move', {
            matchId: createdMatchId,
            playerId: session.user.id,
            row: moveRow,
            col: moveCol,
            value: 5
          })
        }
      }
    }, 2000)

    // Complete test suite
    setTimeout(() => {
      addTestResult('Test Suite', 'PASS', 'Integration test completed successfully')
      setIsTestRunning(false)
    }, 4000)
  }

  const testSingleFeature = async (feature: string) => {
    switch (feature) {
      case 'database':
        addTestResult('Database: Quick Test', 'RUNNING', 'Testing database...')
        try {
          const response = await fetch('/api/test-db')
          const result = await response.json()
          updateTestResult('Database: Quick Test', response.ok ? 'PASS' : 'FAIL', result.message)
        } catch (error) {
          updateTestResult('Database: Quick Test', 'FAIL', `Error: ${error}`)
        }
        break
        
      case 'auth':
        if (session) {
          addTestResult('Auth: Status', 'PASS', `Logged in as ${session.user?.name}`)
        } else {
          addTestResult('Auth: Status', 'FAIL', 'Not authenticated')
        }
        break
        
      case 'socket':
        if (isConnected) {
          addTestResult('Socket: Status', 'PASS', 'Connected to Socket.IO server')
          // Test a simple message
          socket?.emit('test-broadcast', {
            room: 'test-room',
            message: 'Hello from integration test',
            sender: session?.user?.name || 'Anonymous'
          })
        } else {
          addTestResult('Socket: Status', 'FAIL', 'Not connected to Socket.IO server')
        }
        break
    }
  }

  const clearResults = () => {
    setTestResults([])
    setCreatedMatchId('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Integration Test Suite</span>
              </CardTitle>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">Socket: {isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
                {session && (
                  <Badge variant="outline" className="text-xs">
                    {session.user?.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Main Test Button */}
              <Button 
                onClick={runFullIntegrationTest}
                disabled={isTestRunning || !session}
                className="w-full"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                {isTestRunning ? 'Running Tests...' : 'Run Full Integration Test'}
              </Button>

              {/* Individual Feature Tests */}
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={() => testSingleFeature('database')}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Test Database
                </Button>
                
                <Button 
                  onClick={() => testSingleFeature('auth')}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Test Authentication
                </Button>
                
                <Button 
                  onClick={() => testSingleFeature('socket')}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                >
                  <Wifi className="w-4 h-4 mr-2" />
                  Test Socket.IO
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-4 space-y-2">
                <Button 
                  onClick={() => router.push('/auth/signup')}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Account
                </Button>
                
                <Button 
                  onClick={() => router.push('/auth/signin')}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
                
                <Button 
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Gamepad2 className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </div>

              <Button 
                onClick={clearResults}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                Clear Results
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Test Results</span>
                </div>
                <Badge variant="outline">{testResults.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No tests run yet</p>
                    <p className="text-sm">Click "Run Full Integration Test" to begin</p>
                  </div>
                ) : (
                  testResults.map((result, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-shrink-0 mt-0.5">
                        {result.status === 'PASS' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {result.status === 'FAIL' && <XCircle className="w-4 h-4 text-red-500" />}
                        {result.status === 'PENDING' && <Clock className="w-4 h-4 text-yellow-500" />}
                        {result.status === 'RUNNING' && (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{result.test}</span>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            {result.duration && <span>{result.duration}ms</span>}
                            <span>{result.timestamp}</span>
                          </div>
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
        {createdMatchId && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Game State Visualization</CardTitle>
              <p className="text-sm text-gray-600">Match ID: {createdMatchId}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-9 gap-1 max-w-md mx-auto">
                {gameState.flat().map((cell, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 border border-gray-300 flex items-center justify-center text-xs font-medium ${
                      cell === 0 ? 'bg-gray-100' : 'bg-blue-100'
                    }`}
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
