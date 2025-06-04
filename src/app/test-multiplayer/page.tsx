'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function MultiplayerTestPage() {
  const [testResults, setTestResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runMultiplayerTest = async () => {
    setIsRunning(true)
    setTestResults([])
    
    addLog('Starting multiplayer test...')
    
    try {
      // Test 1: Create a multiplayer match
      addLog('Creating multiplayer match...')
      const matchResponse = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MULTIPLAYER_FREE',
          entryFee: 0
        })
      })
      
      if (!matchResponse.ok) {
        addLog('❌ Failed to create match')
        return
      }
      
      const matchData = await matchResponse.json()
      addLog(`✅ Match created: ${matchData.match.id}`)
      
      // Test 2: Test Socket.IO connection
      addLog('Testing Socket.IO connection...')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const socket = (window as any).io('http://localhost:3003')
      
      socket.on('connect', () => {
        addLog('✅ Socket.IO connected successfully')
        
        // Test 3: Join game room
        addLog('Joining game room...')
        socket.emit('join-game', {
          matchId: matchData.match.id,
          userId: 'test-user-1'
        })
      })
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('joined-game', (data: any) => {
        addLog(`✅ Joined game room. Players: ${data.players.length}`)
        
        // Test 4: Make a move
        addLog('Making test move...')
        socket.emit('make-move', {
          matchId: matchData.match.id,
          playerId: 'test-user-1',
          row: 0,
          col: 0,
          value: 5
        })
      })
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('move-made', (data: any) => {
        addLog(`✅ Move received: (${data.row}, ${data.col}) = ${data.value}`)
        
        // Clean up
        setTimeout(() => {
          socket.disconnect()
          addLog('🔌 Socket disconnected')
          addLog('✅ Multiplayer test completed successfully!')
          setIsRunning(false)
        }, 2000)
      })
      
      socket.on('disconnect', () => {
        addLog('Socket disconnected')
      })
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socket.on('connect_error', (error: any) => {
        addLog(`❌ Socket connection error: ${error.message}`)
        setIsRunning(false)
      })
      
    } catch (error) {
      addLog(`❌ Test failed: ${error}`)
      setIsRunning(false)
    }
  }

  const openGameRoom = () => {
    const url = '/game/test-match-id'
    window.open(url, '_blank', 'width=800,height=600')
    addLog('🎮 Opened game room in new window')
  }

  const testWalletAPI = async () => {
    addLog('Testing wallet API...')
    
    try {
      const response = await fetch('/api/wallet')
      if (response.ok) {
        const data = await response.json()
        addLog(`✅ Wallet API working. Balance: ₹${data.balance || 0}`)
      } else {
        addLog('❌ Wallet API test failed')
      }
    } catch (error) {
      addLog(`❌ Wallet API error: ${error}`)
    }
  }

  const testPaymentAPI = async () => {
    addLog('Testing payment API...')
    
    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 100 })
      })
      
      if (response.ok) {
        const data = await response.json()
        addLog(`✅ Payment API working. Order ID: ${data.orderId}`)
      } else {
        addLog('❌ Payment API test failed')
      }
    } catch (error) {
      addLog(`❌ Payment API error: ${error}`)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🧪</span>
            <span>Sudoku Arena - System Tests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Button 
              onClick={runMultiplayerTest}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? 'Running...' : 'Test Multiplayer'}
            </Button>
            
            <Button 
              onClick={openGameRoom}
              variant="outline"
              className="w-full"
            >
              Open Game Room
            </Button>
            
            <Button 
              onClick={testWalletAPI}
              variant="outline"
              className="w-full"
            >
              Test Wallet API
            </Button>
            
            <Button 
              onClick={testPaymentAPI}
              variant="outline"
              className="w-full"
            >
              Test Payment API
            </Button>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Test Instructions:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. <strong>Test Multiplayer:</strong> Tests Socket.IO connection and game room functionality</li>
              <li>2. <strong>Open Game Room:</strong> Opens a game room in a new tab for manual testing</li>
              <li>3. <strong>Test Wallet API:</strong> Verifies wallet balance retrieval</li>
              <li>4. <strong>Test Payment API:</strong> Tests payment order creation</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 italic">No tests run yet. Click a test button to start.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                  {result}
                </div>
              ))
            )}
          </div>
          
          {testResults.length > 0 && (
            <Button 
              onClick={() => setTestResults([])}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              Clear Results
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" onClick={() => window.open('/', '_blank')}>
              Homepage
            </Button>
            <Button variant="outline" onClick={() => window.open('/dashboard', '_blank')}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={() => window.open('/wallet', '_blank')}>
              Wallet
            </Button>
            <Button variant="outline" onClick={() => window.open('/tournaments', '_blank')}>
              Tournaments
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Badge variant="default" className="mb-2">✅ Online</Badge>
              <p className="text-sm font-semibold">Socket.IO Server</p>
              <p className="text-xs text-gray-600">Port 3003</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Badge variant="default" className="mb-2">✅ Online</Badge>
              <p className="text-sm font-semibold">Database</p>
              <p className="text-xs text-gray-600">Supabase PostgreSQL</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Badge variant="secondary" className="mb-2">🧪 Dev Mode</Badge>
              <p className="text-sm font-semibold">Payments</p>
              <p className="text-xs text-gray-600">Mock Razorpay</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
