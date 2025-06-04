'use client'

import { useState, useEffect } from 'react'
import { useSocket } from '@/contexts/SocketContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SocketTest() {
  const { socket, isConnected } = useSocket()
  const [messages, setMessages] = useState<string[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [testRoom, setTestRoom] = useState('test-room')

  useEffect(() => {
    if (!socket) return

    socket.on('connect', () => {
      setMessages(prev => [...prev, '✅ Connected to Socket.IO server'])
    })

    socket.on('disconnect', () => {
      setMessages(prev => [...prev, '❌ Disconnected from Socket.IO server'])
    })

    socket.on('test-message', (data) => {
      setMessages(prev => [...prev, `📨 Received: ${data.message} from ${data.sender}`])
    })

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('test-message')
    }
  }, [socket])

  const joinRoom = () => {
    if (socket && testRoom) {
      socket.emit('join-room', testRoom)
      setMessages(prev => [...prev, `🚪 Joined room: ${testRoom}`])
    }
  }

  const sendTestMessage = () => {
    if (socket && inputMessage && testRoom) {
      socket.emit('test-broadcast', {
        room: testRoom,
        message: inputMessage,
        sender: 'Test User'
      })
      setMessages(prev => [...prev, `📤 Sent: ${inputMessage}`])
      setInputMessage('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Socket.IO Real-time Test</CardTitle>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Room Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Room:</label>
              <div className="flex space-x-2">
                <Input
                  value={testRoom}
                  onChange={(e) => setTestRoom(e.target.value)}
                  placeholder="Enter room name"
                />
                <Button onClick={joinRoom} disabled={!isConnected}>
                  Join Room
                </Button>
              </div>
            </div>

            {/* Message Controls */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Message:</label>
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Enter test message"
                  onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
                />
                <Button onClick={sendTestMessage} disabled={!isConnected || !inputMessage}>
                  Send
                </Button>
              </div>
            </div>

            {/* Messages Log */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Socket Messages:</label>
              <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-sm">No messages yet...</p>
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className="text-sm mb-2 p-2 bg-white dark:bg-gray-700 rounded">
                      {message}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Clear and Reset */}
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setMessages([])}
              >
                Clear Messages
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/dashboard'}
              >
                Back to Dashboard
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}
