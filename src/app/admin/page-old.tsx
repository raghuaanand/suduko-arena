'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Trophy, 
  DollarSign, 
  Activity,
  Database,
  Server,
  Wifi,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

export default function AdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeMatches: 0,
    totalMatches: 0,
    totalTransactions: 0,
    serverStatus: 'unknown',
    dbStatus: 'unknown',
    socketStatus: 'unknown'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simple admin check - in production, implement proper role-based access
    if (!session?.user?.email?.includes('admin')) {
      router.push('/dashboard')
      return
    }

    fetchSystemStats()
    const interval = setInterval(fetchSystemStats, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [session, router])

  const fetchSystemStats = async () => {
    try {
      // Check server status
      const serverResponse = await fetch('/api/health')
      const serverOk = serverResponse.ok

      // Check database status
      const dbResponse = await fetch('/api/test-db')
      const dbData = await dbResponse.json()
      const dbOk = dbData.status === 'connected'

      // Check Socket.IO status (simple check)
      const socketOk = window.location.host === 'localhost:3003' // In dev mode

      setSystemStats({
        totalUsers: 150, // Mock data - replace with real API calls
        activeMatches: 12,
        totalMatches: 1250,
        totalTransactions: 890,
        serverStatus: serverOk ? 'online' : 'offline',
        dbStatus: dbOk ? 'connected' : 'disconnected',
        socketStatus: socketOk ? 'active' : 'inactive'
      })
    } catch (error) {
      console.error('Error fetching system stats:', error)
      setSystemStats(prev => ({
        ...prev,
        serverStatus: 'error',
        dbStatus: 'error',
        socketStatus: 'error'
      }))
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'offline':
      case 'disconnected':
      case 'inactive':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'active':
        return <Badge variant="default">Online</Badge>
      case 'offline':
      case 'disconnected':
      case 'inactive':
        return <Badge variant="destructive">Offline</Badge>
      case 'error':
        return <Badge variant="secondary">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (!session?.user?.email?.includes('admin')) {
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading admin dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-blue-500" />
            <span>Sudoku Arena - Admin Dashboard</span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* System Status */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-5 w-5" />
                <span>Server Status</span>
              </CardTitle>
              {getStatusIcon(systemStats.serverStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                {getStatusBadge(systemStats.serverStatus)}
              </div>
              <div className="flex justify-between">
                <span>Port:</span>
                <span className="font-mono">3003</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span className="text-green-600">24h 15m</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Database</span>
              </CardTitle>
              {getStatusIcon(systemStats.dbStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                {getStatusBadge(systemStats.dbStatus)}
              </div>
              <div className="flex justify-between">
                <span>Provider:</span>
                <span>Supabase</span>
              </div>
              <div className="flex justify-between">
                <span>Connections:</span>
                <span className="text-blue-600">8/100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="h-5 w-5" />
                <span>Socket.IO</span>
              </CardTitle>
              {getStatusIcon(systemStats.socketStatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Status:</span>
                {getStatusBadge(systemStats.socketStatus)}
              </div>
              <div className="flex justify-between">
                <span>Active Rooms:</span>
                <span>{systemStats.activeMatches}</span>
              </div>
              <div className="flex justify-between">
                <span>Connections:</span>
                <span className="text-green-600">24</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +12 from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeMatches}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.totalMatches} total played
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              ₹45,230 total volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹9,046</div>
            <p className="text-xs text-muted-foreground">
              20% platform fee
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline"
              onClick={() => window.open('/test-multiplayer', '_blank')}
              className="w-full"
            >
              System Tests
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/matches', '_blank')}
              className="w-full"
            >
              View Matches
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('/tournaments', '_blank')}
              className="w-full"
            >
              Tournaments
            </Button>
            <Button 
              variant="outline"
              onClick={fetchSystemStats}
              className="w-full"
            >
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Match completed</p>
                <p className="text-xs text-gray-600">User john_doe won ₹80 prize</p>
              </div>
              <span className="text-xs text-gray-500">2 min ago</span>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">New user registered</p>
                <p className="text-xs text-gray-600">sarah_player joined the platform</p>
              </div>
              <span className="text-xs text-gray-500">5 min ago</span>
            </div>
            
            <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Payment received</p>
                <p className="text-xs text-gray-600">₹100 added to wallet</p>
              </div>
              <span className="text-xs text-gray-500">8 min ago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
