'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Medal, 
  Star,
  TrendingUp,
  Users,
  Calendar,
  Award,
  Crown,
  Target
} from 'lucide-react'

interface UserRanking {
  id: string
  name: string
  email: string
  rank: number
  totalWins: number
  totalMatches: number
  winRate: number
  joinedAt: string
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  points: number
  unlocked: boolean
  unlockedAt?: string
}

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [rankings, setRankings] = useState<UserRanking[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [currentUser, setCurrentUser] = useState<UserRanking | null>(null)
  const [activeTab, setActiveTab] = useState<'rankings' | 'achievements'>('rankings')
  const [period, setPeriod] = useState<'all' | 'week' | 'month'>('all')
  const [loading, setLoading] = useState(true)
  const [totalPoints, setTotalPoints] = useState(0)

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }
    
    fetchData()
  }, [session, router, period])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch rankings
      const rankingsResponse = await fetch(`/api/rankings?period=${period}&limit=50`)
      if (rankingsResponse.ok) {
        const rankingsData = await rankingsResponse.json()
        setRankings(rankingsData.rankings)
        setCurrentUser(rankingsData.currentUser)
      }

      // Fetch achievements
      const achievementsResponse = await fetch('/api/achievements')
      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json()
        setAchievements(achievementsData.achievements)
        setTotalPoints(achievementsData.totalPoints)
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-gray-600">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500'
    if (rank === 3) return 'bg-gradient-to-r from-amber-400 to-amber-600'
    if (rank <= 10) return 'bg-gradient-to-r from-blue-400 to-blue-600'
    return 'bg-gradient-to-r from-gray-400 to-gray-600'
  }

  const renderRankings = () => (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'All Time' },
          { key: 'month', label: 'This Month' },
          { key: 'week', label: 'This Week' }
        ].map(({ key, label }) => (
          <Button
            key={key}
            variant={period === key ? 'default' : 'outline'}
            onClick={() => setPeriod(key as any)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Current User Stats */}
      {currentUser && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Your Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getRankBadgeColor(currentUser.rank)}`}>
                  {currentUser.rank <= 3 ? getRankIcon(currentUser.rank) : `#${currentUser.rank}`}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{currentUser.name}</h3>
                  <p className="text-sm text-gray-600">
                    {currentUser.totalWins} wins • {currentUser.winRate}% win rate
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">#{currentUser.rank}</div>
                <div className="text-sm text-gray-500">{currentUser.totalMatches} matches</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Players */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Players
          </CardTitle>
          <CardDescription>
            {period === 'all' ? 'All-time' : period === 'month' ? 'This month' : 'This week'} leaderboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rankings.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  user.id === session?.user?.id ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getRankBadgeColor(user.rank)}`}>
                    {user.rank <= 3 ? getRankIcon(user.rank) : user.rank}
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-gray-600">
                      Joined {new Date(user.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{user.totalWins} wins</div>
                  <div className="text-sm text-gray-500">
                    {user.winRate}% • {user.totalMatches} matches
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderAchievements = () => (
    <div className="space-y-6">
      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{achievements.filter(a => a.unlocked).length}</div>
            <div className="text-sm text-gray-600">Achievements Unlocked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{totalPoints}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" />
            Achievements
          </CardTitle>
          <CardDescription>
            Unlock achievements by completing various challenges and milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card
                key={achievement.id}
                className={`relative overflow-hidden ${
                  achievement.unlocked 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50 opacity-75'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-2xl">{achievement.icon}</div>
                    {achievement.unlocked && (
                      <Badge variant="default" className="bg-green-600">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-600">
                      {achievement.points} points
                    </span>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading Leaderboard...</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-gray-600">Track your progress and compete with other players</p>
        </div>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'rankings', label: 'Rankings', icon: Trophy },
          { key: 'achievements', label: 'Achievements', icon: Award }
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

      {/* Content */}
      {activeTab === 'rankings' && renderRankings()}
      {activeTab === 'achievements' && renderAchievements()}
    </div>
  )
}
