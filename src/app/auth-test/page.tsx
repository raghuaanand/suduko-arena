'use client'

import { useState } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function AuthTest() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('testpass123')
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState('')

  const handleSignIn = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        setTestResult(`Sign in failed: ${result.error}`)
      } else {
        setTestResult('Sign in successful!')
      }
    } catch (error) {
      setTestResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testMatchCreation = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'SINGLE_PLAYER',
          difficulty: 'medium'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        setTestResult(`Match creation failed: ${response.status} - ${errorData.message}`)
      } else {
        const data = await response.json()
        setTestResult(`Match creation successful! Match ID: ${data.match?.id}`)
      }
    } catch (error) {
      setTestResult(`Match creation error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Session Status:</strong> {status}
            </div>
            {session && (
              <div>
                <strong>User:</strong> {session.user?.name} ({session.user?.email})
                <br />
                <strong>User ID:</strong> {session.user?.id}
              </div>
            )}
            
            {!session && (
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button onClick={handleSignIn} disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </div>
            )}
            
            {session && (
              <div className="space-y-4">
                <Button onClick={() => signOut()}>Sign Out</Button>
                <Button onClick={testMatchCreation} disabled={loading}>
                  {loading ? 'Testing...' : 'Test Match Creation'}
                </Button>
              </div>
            )}
            
            {testResult && (
              <div className="p-4 bg-gray-100 rounded">
                <strong>Result:</strong> {testResult}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
