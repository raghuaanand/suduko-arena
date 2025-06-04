// Tournament bracket management utilities

export interface TournamentPlayer {
  id: string
  name: string
  email: string
  isEliminated: boolean
  currentRound: number
}

export interface TournamentMatch {
  id: string
  tournamentId: string
  round: number
  position: number
  player1Id: string | null
  player2Id: string | null
  winnerId: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  matchId: string | null // Reference to actual game match
}

export interface Tournament {
  id: string
  name: string
  entryFee: number
  prizePool: number
  maxPlayers: number
  currentPlayers: number
  status: 'REGISTRATION' | 'IN_PROGRESS' | 'COMPLETED'
  startTime: string
  endTime?: string
  description: string
  bracketType: 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION'
  currentRound: number
  totalRounds: number
  players: TournamentPlayer[]
  matches: TournamentMatch[]
  winnerId?: string
}

export class TournamentBracket {
  private tournament: Tournament

  constructor(tournament: Tournament) {
    this.tournament = tournament
  }

  // Generate bracket structure for single elimination
  generateSingleEliminationBracket(): TournamentMatch[] {
    const playerCount = this.tournament.players.length
    
    if (playerCount < 2) {
      throw new Error('Tournament needs at least 2 players')
    }

    const matches: TournamentMatch[] = []
    const rounds = Math.ceil(Math.log2(playerCount))
    
    // First round - pair up all players
    let position = 0
    for (let i = 0; i < playerCount; i += 2) {
      if (i + 1 < playerCount) {
        matches.push({
          id: `tournament_${this.tournament.id}_r1_p${position}`,
          tournamentId: this.tournament.id,
          round: 1,
          position: position++,
          player1Id: this.tournament.players[i].id,
          player2Id: this.tournament.players[i + 1].id,
          winnerId: null,
          status: 'PENDING',
          matchId: null
        })
      } else {
        // Bye for odd player
        matches.push({
          id: `tournament_${this.tournament.id}_r1_bye_p${position}`,
          tournamentId: this.tournament.id,
          round: 1,
          position: position++,
          player1Id: this.tournament.players[i].id,
          player2Id: null,
          winnerId: this.tournament.players[i].id, // Auto-advance
          status: 'COMPLETED',
          matchId: null
        })
      }
    }

    // Generate subsequent rounds structure
    for (let round = 2; round <= rounds; round++) {
      const prevRoundMatches = matches.filter(m => m.round === round - 1)
      const nextRoundMatchCount = Math.ceil(prevRoundMatches.length / 2)
      
      for (let i = 0; i < nextRoundMatchCount; i++) {
        matches.push({
          id: `tournament_${this.tournament.id}_r${round}_p${i}`,
          tournamentId: this.tournament.id,
          round: round,
          position: i,
          player1Id: null, // To be filled when previous round completes
          player2Id: null,
          winnerId: null,
          status: 'PENDING',
          matchId: null
        })
      }
    }
    
    return matches
  }

  // Advance winner to next round
  advanceWinner(matchId: string, winnerId: string): TournamentMatch[] {
    const updatedMatches = [...this.tournament.matches]
    const currentMatch = updatedMatches.find(m => m.id === matchId)
    
    if (!currentMatch) return updatedMatches

    // Mark current match as completed
    currentMatch.winnerId = winnerId
    currentMatch.status = 'COMPLETED'

    // Find next round match
    const nextRound = currentMatch.round + 1
    const nextPosition = Math.ceil(currentMatch.position / 2)
    const nextMatch = updatedMatches.find(
      m => m.round === nextRound && m.position === nextPosition
    )

    if (nextMatch) {
      // Assign winner to next match
      if (!nextMatch.player1Id) {
        nextMatch.player1Id = winnerId
      } else if (!nextMatch.player2Id) {
        nextMatch.player2Id = winnerId
        // Both players assigned, match can start
        nextMatch.status = 'PENDING'
      }
    }

    return updatedMatches
  }

  // Get current active matches (ready to play)
  getActiveMatches(): TournamentMatch[] {
    return this.tournament.matches.filter(
      match => match.status === 'PENDING' && 
      match.player1Id && 
      match.player2Id
    )
  }

  // Check if tournament is complete
  isComplete(): boolean {
    const finalMatch = this.tournament.matches.find(
      match => match.round === this.tournament.totalRounds
    )
    return finalMatch?.status === 'COMPLETED'
  }

  // Get tournament winner
  getWinner(): string | null {
    if (!this.isComplete()) return null
    
    const finalMatch = this.tournament.matches.find(
      match => match.round === this.tournament.totalRounds
    )
    return finalMatch?.winnerId || null
  }

  // Calculate prize distribution
  calculatePrizeDistribution(): { [playerId: string]: number } {
    const distribution: { [playerId: string]: number } = {}
    const totalPrize = this.tournament.prizePool
    
    // Simple distribution: 70% winner, 30% runner-up
    const winner = this.getWinner()
    if (winner) {
      distribution[winner] = totalPrize * 0.7
      
      const finalMatch = this.tournament.matches.find(
        match => match.round === this.tournament.totalRounds
      )
      if (finalMatch) {
        const runnerUp = finalMatch.player1Id === winner 
          ? finalMatch.player2Id 
          : finalMatch.player1Id
        if (runnerUp) {
          distribution[runnerUp] = totalPrize * 0.3
        }
      }
    }
    
    return distribution
  }
}

// Tournament utilities
export const TournamentUtils = {
  // Validate tournament can start
  canStartTournament(tournament: Tournament): boolean {
    return tournament.currentPlayers >= 4 && // Minimum 4 players
           tournament.currentPlayers <= tournament.maxPlayers &&
           tournament.status === 'REGISTRATION'
  },

  // Calculate total rounds needed
  calculateTotalRounds(playerCount: number): number {
    return Math.ceil(Math.log2(playerCount))
  },

  // Generate tournament schedule
  generateSchedule(tournament: Tournament): {
    rounds: { round: number; matches: TournamentMatch[] }[]
  } {
    const bracket = new TournamentBracket(tournament)
    const matches = bracket.generateSingleEliminationBracket()
    
    const rounds: { round: number; matches: TournamentMatch[] }[] = []
    const totalRounds = TournamentUtils.calculateTotalRounds(tournament.players.length)
    
    for (let i = 1; i <= totalRounds; i++) {
      rounds.push({
        round: i,
        matches: matches.filter(m => m.round === i)
      })
    }
    
    return { rounds }
  },

  // Format prize money
  formatPrize(amount: number): string {
    return `₹${amount.toLocaleString()}`
  },

  // Get tournament status badge color
  getStatusColor(status: Tournament['status']): string {
    switch (status) {
      case 'REGISTRATION': return 'bg-blue-500'
      case 'IN_PROGRESS': return 'bg-green-500'
      case 'COMPLETED': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }
}
