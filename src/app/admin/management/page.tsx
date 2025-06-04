'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  Trophy, 
  DollarSign, 
  Activity,
  Settings,
  RefreshCw,
  Search,
  Edit,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  Square
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  walletBalance: number
  createdAt: string
  totalMatches: number
  totalTransactions: number
}

interface Match {
  id: string
  type: string
  status: string
  createdAt: string
  player1: { name: string; email: string }
  player2?: { name: string; email: string }
}

interface Transaction {
  id: string
  amount: number
  type: string
  status: string
  description: string
  createdAt: string
  user: { name: string; email: string }
}

interface Tournament {
  id: string
  name: string
  status: string
  entryFee: number
  maxParticipants: number
  startTime: string
  createdBy: { name: string }
  _count: { participants: number }
}

interface AdminData {
  users: User[]
  matches: Match[]
  transactions: Transaction[]
  tournaments: Tournament[]
}

export default function AdminManagement() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'users' | 'matches' | 'transactions' | 'tournaments'>('users')
  const [data, setData] = useState<AdminData>({
    users: [],
    matches: [],
    transactions: [],
    tournaments: []
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }
    
    fetchData()
  }, [session, router, activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      let endpoint = ''
      switch (activeTab) {
        case 'users':
          endpoint = '/api/admin/users'
          break
        case 'matches':
          endpoint = '/api/admin/matches'
          break
        case 'transactions':
          endpoint = '/api/admin/transactions'
          break
        case 'tournaments':
          endpoint = '/api/admin/tournaments'
          break
      }

      const response = await fetch(`${endpoint}?search=${searchTerm}`)
      if (response.ok) {
        const result = await response.json()
        setData(prev => ({
          ...prev,
          [activeTab]: result[activeTab] || result.data || []
        }))
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (id: string, action: string, extraData?: any) => {
    try {
      let endpoint = ''
      switch (activeTab) {
        case 'users':
          endpoint = '/api/admin/users'
          break
        case 'matches':
          endpoint = '/api/admin/matches'
          break
        case 'transactions':
          endpoint = '/api/admin/transactions'
          break
        case 'tournaments':
          endpoint = '/api/admin/tournaments'
          break
      }

      const body: any = { action }
      if (activeTab === 'users') body.userId = id
      if (activeTab === 'matches') body.matchId = id
      if (activeTab === 'transactions') body.transactionId = id
      if (activeTab === 'tournaments') body.tournamentId = id
      if (extraData) Object.assign(body, extraData)

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error(`Error performing ${action} on ${activeTab}:`, error)
    }
  }

  const renderUsers = () => (
    <div className="space-y-4">
      {data.users.map((user) => (
        <Card key={user.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>Balance: ₹{user.walletBalance}</span>
                  <span>Matches: {user.totalMatches}</span>
                  <span>Transactions: {user.totalTransactions}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const amount = prompt('Enter amount to adjust (positive for credit, negative for debit):')
                    if (amount) {
                      handleAction(user.id, 'adjustBalance', { amount: parseFloat(amount) })
                    }
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleAction(user.id, 'ban')}
                >
                  <Ban className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderMatches = () => (
    <div className="space-y-4">
      {data.matches.map((match) => (
        <Card key={match.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{match.type}</h3>
                  <Badge variant={match.status === 'COMPLETED' ? 'default' : 'secondary'}>
                    {match.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {match.player1.name} vs {match.player2?.name || 'AI'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(match.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                {match.status === 'IN_PROGRESS' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAction(match.id, 'complete')}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleAction(match.id, 'cancel')}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderTransactions = () => (
    <div className="space-y-4">
      {data.transactions.map((transaction) => (
        <Card key={transaction.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">₹{transaction.amount}</h3>
                  <Badge variant={
                    transaction.status === 'COMPLETED' ? 'default' : 
                    transaction.status === 'PENDING' ? 'secondary' : 'destructive'
                  }>
                    {transaction.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{transaction.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {transaction.user.name} - {new Date(transaction.createdAt).toLocaleDateString()}
                </p>
              </div>
              {transaction.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAction(transaction.id, 'approve')}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleAction(transaction.id, 'reject')}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderTournaments = () => (
    <div className="space-y-4">
      {data.tournaments.map((tournament) => (
        <Card key={tournament.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{tournament.name}</h3>
                  <Badge variant={
                    tournament.status === 'COMPLETED' ? 'default' : 
                    tournament.status === 'IN_PROGRESS' ? 'secondary' : 'outline'
                  }>
                    {tournament.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Entry Fee: ₹{tournament.entryFee} | 
                  Participants: {tournament._count.participants}/{tournament.maxParticipants}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Created by: {tournament.createdBy.name}
                </p>
              </div>
              <div className="flex gap-2">
                {tournament.status === 'REGISTRATION_OPEN' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAction(tournament.id, 'start')}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                {tournament.status === 'IN_PROGRESS' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAction(tournament.id, 'complete')}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleAction(tournament.id, 'cancel')}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="text-gray-600">Manage users, matches, transactions, and tournaments</p>
        </div>
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'users', label: 'Users', icon: Users },
          { key: 'matches', label: 'Matches', icon: Activity },
          { key: 'transactions', label: 'Transactions', icon: DollarSign },
          { key: 'tournaments', label: 'Tournaments', icon: Trophy }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={activeTab === key ? 'default' : 'outline'}
            onClick={() => setActiveTab(key as any)}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={fetchData}>
          Search
        </Button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'matches' && renderMatches()}
            {activeTab === 'transactions' && renderTransactions()}
            {activeTab === 'tournaments' && renderTournaments()}
          </>
        )}
      </div>
    </div>
  )
}
