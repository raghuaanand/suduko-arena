'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Users, 
  Clock,
  Crown,
  Play,
  CheckCircle
} from 'lucide-react'
import { Tournament, TournamentMatch, TournamentBracket } from '@/lib/tournament'

interface TournamentBracketProps {
  tournament: Tournament
  onMatchStart?: (matchId: string) => void
  onMatchComplete?: (matchId: string, winnerId: string) => void
}

export default function TournamentBracketComponent({ 
  tournament, 
  onMatchStart,
  onMatchComplete 
}: TournamentBracketProps) {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  
  const bracket = new TournamentBracket(tournament)
  const schedule = generateSchedule(tournament)

  // Helper function to get player name
  const getPlayerName = (playerId: string | null): string => {
    if (!playerId) return 'TBD'
    const player = tournament.players.find(p => p.id === playerId)
    return player?.name || 'Unknown Player'
  }

  // Helper function to generate schedule
  function generateSchedule(tournament: Tournament) {
    const matches = tournament.matches
    const rounds: { round: number; matches: TournamentMatch[] }[] = []
    const totalRounds = Math.ceil(Math.log2(tournament.players.length))
    
    for (let i = 1; i <= totalRounds; i++) {
      rounds.push({
        round: i,
        matches: matches.filter(m => m.round === i)
      })
    }
    
    return { rounds }
  }

  // Render individual match card
  const renderMatch = (match: TournamentMatch) => {
    const player1Name = getPlayerName(match.player1Id)
    const player2Name = getPlayerName(match.player2Id)
    const isActive = match.status === 'PENDING' && match.player1Id && match.player2Id
    const isCompleted = match.status === 'COMPLETED'
    const winner = match.winnerId ? getPlayerName(match.winnerId) : null

    return (
      <Card 
        key={match.id}
        className={`
          w-64 mb-4 cursor-pointer transition-all duration-200
          ${isActive ? 'border-green-400 shadow-lg' : ''}
          ${isCompleted ? 'border-gray-300 bg-gray-50' : ''}
          ${selectedMatch === match.id ? 'ring-2 ring-blue-400' : ''}
        `}
        onClick={() => setSelectedMatch(match.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              Round {match.round} - Match {match.position}
            </CardTitle>
            <Badge 
              variant={isCompleted ? 'default' : isActive ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {isCompleted ? 'Complete' : isActive ? 'Ready' : 'Waiting'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {/* Player 1 */}
            <div className={`
              flex items-center justify-between p-2 rounded
              ${match.winnerId === match.player1Id ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}
            `}>
              <span className="text-sm font-medium">
                {player1Name}
              </span>
              {match.winnerId === match.player1Id && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>

            {/* VS */}
            <div className="text-center text-xs text-gray-500 font-medium">
              VS
            </div>

            {/* Player 2 */}
            <div className={`
              flex items-center justify-between p-2 rounded
              ${match.winnerId === match.player2Id ? 'bg-green-100 border border-green-300' : 'bg-gray-50'}
            `}>
              <span className="text-sm font-medium">
                {player2Name}
              </span>
              {match.winnerId === match.player2Id && (
                <Crown className="h-4 w-4 text-yellow-500" />
              )}
            </div>

            {/* Action buttons */}
            {isActive && onMatchStart && (
              <Button 
                size="sm" 
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onMatchStart(match.id)
                }}
              >
                <Play className="h-4 w-4 mr-1" />
                Start Match
              </Button>
            )}

            {isCompleted && winner && (
              <div className="flex items-center justify-center mt-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Winner: {winner}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render tournament header
  const renderTournamentHeader = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              {tournament.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {tournament.description}
            </p>
          </div>
          <Badge 
            className={`
              ${tournament.status === 'REGISTRATION' ? 'bg-blue-500' : ''}
              ${tournament.status === 'IN_PROGRESS' ? 'bg-green-500' : ''}
              ${tournament.status === 'COMPLETED' ? 'bg-gray-500' : ''}
            `}
          >
            {tournament.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ₹{tournament.prizePool.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Prize Pool</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {tournament.currentPlayers}/{tournament.maxPlayers}
            </div>
            <div className="text-sm text-gray-600">Players</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {tournament.currentRound}/{tournament.totalRounds}
            </div>
            <div className="text-sm text-gray-600">Round</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ₹{tournament.entryFee}
            </div>
            <div className="text-sm text-gray-600">Entry Fee</div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )

  return (
    <div className="space-y-6">
      {renderTournamentHeader()}
      
      {/* Tournament Bracket */}
      <div className="space-y-8">
        {schedule.rounds.map((round) => (
          <div key={round.round} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Round {round.round}
              {round.round === tournament.totalRounds && (
                <Badge variant="outline" className="ml-2">Final</Badge>
              )}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {round.matches.map(renderMatch)}
            </div>
          </div>
        ))}
      </div>

      {/* Tournament Complete */}
      {tournament.status === 'COMPLETED' && (
        <Card className="border-green-400 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Crown className="h-6 w-6 text-yellow-500" />
              Tournament Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800 mb-2">
                Winner: {tournament.winnerId ? getPlayerName(tournament.winnerId) : 'Unknown'}
              </div>
              <div className="text-lg text-green-600">
                Prize: ₹{(tournament.prizePool * 0.7).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
