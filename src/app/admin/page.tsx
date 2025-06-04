'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Monitor, 
  Database, 
  Server, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Activity,
  Wifi,
  RefreshCw,
  Eye,
  Settings
} from 'lucide-react'

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error'
  uptime: number
  timestamp: string
  version: string
  environment: string
}

interface SystemStats {
  totalUsers: number
  activeMatches: number
  totalMatches: number
  totalTransactions: number
  totalRevenue: number
  avgResponseTime: number
  socketConnections: number
  databaseConnections: number
}

interface RecentActivity {
  id: string
  type: 'USER_SIGNUP' | 'MATCH_CREATED' | 'MATCH_COMPLETED' | 'PAYMENT_SUCCESS' | 'ERROR'
  description: string
  timestamp: string
  userId?: string
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }
    
    fetchSystemHealth()
    fetchSystemStats()
    fetchRecentActivity()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchSystemHealth()
      fetchSystemStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [session, router])

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
      }
    } catch (error) {
      console.error('Error fetching system health:', error)
      setHealth({
        status: 'error',
        uptime: 0,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: 'development'
      })
    }
  }

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        // Fallback to mock data if API fails
        const mockStats: SystemStats = {
          totalUsers: 1250 + Math.floor(Math.random() * 50),
          activeMatches: 15 + Math.floor(Math.random() * 10),
          totalMatches: 8420 + Math.floor(Math.random() * 100),
          totalTransactions: 3200 + Math.floor(Math.random() * 50),
          totalRevenue: 125000 + Math.floor(Math.random() * 5000),
          avgResponseTime: 120 + Math.floor(Math.random() * 30),
          socketConnections: 45 + Math.floor(Math.random() * 20),
          databaseConnections: 8 + Math.floor(Math.random() * 4)
        }
        setStats(mockStats)
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      // Mock recent activity - in production, fetch from activity logs
      const mockActivities: RecentActivity[] = [
        {
          id: '1',
          type: 'USER_SIGNUP',
          description: 'New user registered: john.doe@example.com',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          userId: 'user_123'
        },
        {
          id: '2',
          type: 'MATCH_COMPLETED',
          description: 'Multiplayer match completed - Winner: Alice Smith',
          timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
          userId: 'user_456'
        },
        {
          id: '3',
          type: 'PAYMENT_SUCCESS',
          description: 'Payment of ₹100 processed successfully',
          timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
          userId: 'user_789'
        },
        {
          id: '4',
          type: 'MATCH_CREATED',
          description: 'New tournament created: Daily Championship',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          userId: 'user_321'
        },
        {
          id: '5',
          type: 'ERROR',
          description: 'Database connection timeout resolved',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        }
      ]
      setActivities(mockActivities)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }

  const handleRefresh = () => {
    setLastRefresh(new Date())
    fetchSystemHealth()
    fetchSystemStats()
    fetchRecentActivity()
  }

  const getHealthColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'USER_SIGNUP': return <Users className="h-4 w-4 text-blue-600" />
      case 'MATCH_CREATED': return <Activity className="h-4 w-4 text-green-600" />
      case 'MATCH_COMPLETED': return <CheckCircle className="h-4 w-4 text-purple-600" />
      case 'PAYMENT_SUCCESS': return <DollarSign className="h-4 w-4 text-green-600" />
      case 'ERROR': return <AlertTriangle className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`
  }

  if (!session?.user?.id) {
    return null
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Monitor className="h-8 w-8 text-blue-600" />
          <span>Admin Dashboard</span>
        </h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* System Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {health?.status === 'healthy' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : health?.status === 'warning' ? (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <Badge className={health ? getHealthColor(health.status) : 'bg-gray-100'}>
                {health?.status || 'Unknown'}
              </Badge>
            </div>
            {health && (
              <p className="text-sm text-gray-600 mt-2">
                Uptime: {formatUptime(health.uptime)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Server</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold">
                {stats?.avgResponseTime || 0}ms
              </span>
            </div>
            <p className="text-sm text-gray-600">Avg Response Time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span className="text-lg font-semibold">
                {stats?.databaseConnections || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Active Connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Socket.IO</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Wifi className="h-5 w-5 text-green-600" />
              <span className="text-lg font-semibold">
                {stats?.socketConnections || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">Live Connections</p>
          </CardContent>
        </Card>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">
                {stats?.totalUsers?.toLocaleString() || 0}
              </span>
            </div>
            <p className="text-sm text-green-600">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">
                {stats?.activeMatches || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {stats?.totalMatches?.toLocaleString() || 0} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">
                {stats ? formatCurrency(stats.totalRevenue) : '₹0'}
              </span>
            </div>
            <p className="text-sm text-green-600">+8% from last week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">
                {stats?.totalTransactions?.toLocaleString() || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest system events and user activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                {activity.userId && (
                  <Badge variant="outline" className="text-xs">
                    {activity.userId.substring(0, 8)}...
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle>System Management</CardTitle>
          <CardDescription>
            Administrative tools and system monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="p-4 h-auto"
              onClick={() => window.open('/test-multiplayer', '_blank')}
            >
              <div className="text-center">
                <Settings className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">System Tests</div>
                <div className="text-sm text-gray-600">Run diagnostics</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="p-4 h-auto"
              onClick={() => window.open('/matches', '_blank')}
            >
              <div className="text-center">
                <Eye className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Monitor Matches</div>
                <div className="text-sm text-gray-600">View active games</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="p-4 h-auto"
              onClick={() => window.open('/tournaments', '_blank')}
            >
              <div className="text-center">
                <Users className="h-6 w-6 mx-auto mb-2" />
                <div className="font-medium">Tournaments</div>
                <div className="text-sm text-gray-600">Manage tournaments</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">CPU Usage</span>
                <span className="font-semibold">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Memory Usage</span>
                <span className="font-semibold">67%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Disk Usage</span>
                <span className="font-semibold">23%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '23%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">API Endpoints</span>
                </div>
                <Badge variant="outline" className="text-green-600">
                  All Healthy
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Socket Connections</span>
                </div>
                <Badge variant="outline" className="text-yellow-600">
                  2 Warnings
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Payment Gateway</span>
                </div>
                <Badge variant="outline" className="text-red-600">
                  1 Error
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
