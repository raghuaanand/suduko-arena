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
    
    // Shuffle players for random seeding
    const shuffledPlayers = [...this.tournament.players].sort(() => Math.random() - 0.5)
    
    // First round - pair up all players
    let position = 0
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      if (i + 1 < shuffledPlayers.length) {
        matches.push({
          id: `tournament_${this.tournament.id}_r1_p${position}`,
          tournamentId: this.tournament.id,
          round: 1,
          position: position++,
          player1Id: shuffledPlayers[i].id,
          player2Id: shuffledPlayers[i + 1].id,
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
          player1Id: shuffledPlayers[i].id,
          player2Id: null,
          winnerId: shuffledPlayers[i].id, // Auto-advance
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

  // Enhanced tournament bracket management with comprehensive features
  
  // Generate double elimination bracket
  generateDoubleEliminationBracket(): TournamentMatch[] {
    const playerCount = this.tournament.players.length
    
    if (playerCount < 2) {
      throw new Error('Tournament needs at least 2 players')
    }

    const matches: TournamentMatch[] = []
    const shuffledPlayers = [...this.tournament.players].sort(() => Math.random() - 0.5)
    
    // Winners bracket - same as single elimination
    const winnersMatches = this.generateWinnersBracket(shuffledPlayers)
    matches.push(...winnersMatches)
    
    // Losers bracket - more complex structure
    const losersMatches = this.generateLosersBracket(playerCount)
    matches.push(...losersMatches)
    
    // Grand finals
    const grandFinalsMatch: TournamentMatch = {
      id: `tournament_${this.tournament.id}_grand_finals`,
      tournamentId: this.tournament.id,
      round: 999, // Special round number for grand finals
      position: 0,
      player1Id: null, // Winner of winners bracket
      player2Id: null, // Winner of losers bracket
      winnerId: null,
      status: 'PENDING',
      matchId: null
    }
    matches.push(grandFinalsMatch)
    
    return matches
  }

  private generateWinnersBracket(players: TournamentPlayer[]): TournamentMatch[] {
    const matches: TournamentMatch[] = []
    const rounds = Math.ceil(Math.log2(players.length))
    
    // First round
    let position = 0
    for (let i = 0; i < players.length; i += 2) {
      if (i + 1 < players.length) {
        matches.push({
          id: `tournament_${this.tournament.id}_wb_r1_p${position}`,
          tournamentId: this.tournament.id,
          round: 1,
          position: position++,
          player1Id: players[i].id,
          player2Id: players[i + 1].id,
          winnerId: null,
          status: 'PENDING',
          matchId: null
        })
      } else {
        // Bye
        matches.push({
          id: `tournament_${this.tournament.id}_wb_r1_bye_p${position}`,
          tournamentId: this.tournament.id,
          round: 1,
          position: position++,
          player1Id: players[i].id,
          player2Id: null,
          winnerId: players[i].id,
          status: 'COMPLETED',
          matchId: null
        })
      }
    }

    // Subsequent rounds
    for (let round = 2; round <= rounds; round++) {
      const prevRoundMatches = matches.filter(m => m.round === round - 1)
      const nextRoundMatchCount = Math.ceil(prevRoundMatches.length / 2)
      
      for (let i = 0; i < nextRoundMatchCount; i++) {
        matches.push({
          id: `tournament_${this.tournament.id}_wb_r${round}_p${i}`,
          tournamentId: this.tournament.id,
          round: round,
          position: i,
          player1Id: null,
          player2Id: null,
          winnerId: null,
          status: 'PENDING',
          matchId: null
        })
      }
    }
    
    return matches
  }

  private generateLosersBracket(playerCount: number): TournamentMatch[] {
    const matches: TournamentMatch[] = []
    // Losers bracket has 2n-2 rounds where n is number of rounds in winners bracket
    const winnersRounds = Math.ceil(Math.log2(playerCount))
    const losersRounds = (winnersRounds - 1) * 2
    
    // Generate losers bracket structure (simplified for this implementation)
    for (let round = 1; round <= losersRounds; round++) {
      const matchesInRound = Math.max(1, Math.floor(playerCount / Math.pow(2, Math.ceil(round / 2))))
      
      for (let pos = 0; pos < matchesInRound; pos++) {
        matches.push({
          id: `tournament_${this.tournament.id}_lb_r${round}_p${pos}`,
          tournamentId: this.tournament.id,
          round: round + 100, // Offset to distinguish from winners bracket
          position: pos,
          player1Id: null,
          player2Id: null,
          winnerId: null,
          status: 'PENDING',
          matchId: null
        })
      }
    }
    
    return matches
  }

  // Advanced match progression with elimination tracking
  advanceWinnerWithElimination(matchId: string, winnerId: string, loserId: string): {
    updatedMatches: TournamentMatch[]
    eliminatedPlayer: string | null
    nextMatches: TournamentMatch[]
  } {
    const updatedMatches = [...this.tournament.matches]
    const currentMatch = updatedMatches.find(m => m.id === matchId)
    
    if (!currentMatch) {
      return { updatedMatches, eliminatedPlayer: null, nextMatches: [] }
    }

    // Mark current match as completed
    currentMatch.winnerId = winnerId
    currentMatch.status = 'COMPLETED'

    let eliminatedPlayer: string | null = null
    const nextMatches: TournamentMatch[] = []

    if (this.tournament.bracketType === 'SINGLE_ELIMINATION') {
      // In single elimination, loser is eliminated
      eliminatedPlayer = loserId
      
      // Advance winner to next round
      const nextMatch = this.findNextMatch(currentMatch, updatedMatches)
      if (nextMatch) {
        this.assignPlayerToMatch(nextMatch, winnerId)
        nextMatches.push(nextMatch)
      }
    } else if (this.tournament.bracketType === 'DOUBLE_ELIMINATION') {
      // More complex logic for double elimination
      const result = this.handleDoubleEliminationAdvancement(
        currentMatch, winnerId, loserId, updatedMatches
      )
      eliminatedPlayer = result.eliminatedPlayer
      nextMatches.push(...result.nextMatches)
    }

    return { updatedMatches, eliminatedPlayer, nextMatches }
  }

  private findNextMatch(currentMatch: TournamentMatch, matches: TournamentMatch[]): TournamentMatch | null {
    const nextRound = currentMatch.round + 1
    const nextPosition = Math.floor(currentMatch.position / 2)
    
    return matches.find(
      m => m.round === nextRound && m.position === nextPosition
    ) || null
  }

  private assignPlayerToMatch(match: TournamentMatch, playerId: string): void {
    if (!match.player1Id) {
      match.player1Id = playerId
    } else if (!match.player2Id) {
      match.player2Id = playerId
      match.status = 'PENDING' // Both players assigned, ready to start
    }
  }

  private handleDoubleEliminationAdvancement(
    currentMatch: TournamentMatch,
    winnerId: string,
    loserId: string,
    matches: TournamentMatch[]
  ): { eliminatedPlayer: string | null; nextMatches: TournamentMatch[] } {
    const nextMatches: TournamentMatch[] = []
    let eliminatedPlayer: string | null = null

    // Check if this is a winners bracket or losers bracket match
    const isWinnersBracket = currentMatch.round < 100
    
    if (isWinnersBracket) {
      // Winner advances in winners bracket
      const nextWinnersMatch = this.findNextMatch(currentMatch, matches)
      if (nextWinnersMatch) {
        this.assignPlayerToMatch(nextWinnersMatch, winnerId)
        nextMatches.push(nextWinnersMatch)
      }
      
      // Loser drops to losers bracket
      const losersMatch = this.findLosersMatchForDroppedPlayer(currentMatch, matches)
      if (losersMatch) {
        this.assignPlayerToMatch(losersMatch, loserId)
        nextMatches.push(losersMatch)
      }
    } else {
      // This is a losers bracket match - loser is eliminated
      eliminatedPlayer = loserId
      
      // Winner continues in losers bracket
      const nextLosersMatch = this.findNextMatch(currentMatch, matches)
      if (nextLosersMatch) {
        this.assignPlayerToMatch(nextLosersMatch, winnerId)
        nextMatches.push(nextLosersMatch)
      }
    }

    return { eliminatedPlayer, nextMatches }
  }

  private findLosersMatchForDroppedPlayer(
    winnersMatch: TournamentMatch,
    matches: TournamentMatch[]
  ): TournamentMatch | null {
    // Simplified logic - in practice this would be more complex
    const losersRound = 100 + (winnersMatch.round - 1) * 2 + 1
    return matches.find(
      m => m.round === losersRound && !m.player1Id && !m.player2Id
    ) || null
  }

  // Tournament progression and automation
  startNextRound(): TournamentMatch[] {
    const readyMatches = this.tournament.matches.filter(
      m => m.status === 'PENDING' && m.player1Id && m.player2Id
    )
    
    readyMatches.forEach(match => {
      match.status = 'IN_PROGRESS'
    })
    
    return readyMatches
  }

  // Check if tournament is complete
  isTournamentComplete(): boolean {
    if (this.tournament.bracketType === 'SINGLE_ELIMINATION') {
      // Find the final match
      const maxRound = Math.max(...this.tournament.matches.map(m => m.round))
      const finalMatch = this.tournament.matches.find(m => m.round === maxRound)
      return finalMatch?.status === 'COMPLETED'
    } else {
      // Double elimination - check grand finals
      const grandFinals = this.tournament.matches.find(m => m.round === 999)
      return grandFinals?.status === 'COMPLETED'
    }
  }

  // Get tournament winner
  getTournamentWinner(): string | null {
    if (!this.isTournamentComplete()) return null
    
    if (this.tournament.bracketType === 'SINGLE_ELIMINATION') {
      const maxRound = Math.max(...this.tournament.matches.map(m => m.round))
      const finalMatch = this.tournament.matches.find(m => m.round === maxRound)
      return finalMatch?.winnerId || null
    } else {
      const grandFinals = this.tournament.matches.find(m => m.round === 999)
      return grandFinals?.winnerId || null
    }
  }

  // Enhanced prize distribution calculation
  calculatePrizeDistribution(): { [playerId: string]: number } {
    const distribution: { [playerId: string]: number } = {}
    const totalPrize = this.tournament.prizePool
    
    if (!this.isTournamentComplete()) return distribution
    
    const winner = this.getTournamentWinner()
    if (!winner) return distribution
    
    // Enhanced distribution: 60% winner, 30% runner-up, 10% semi-finalists
    const winnerPrize = Math.floor(totalPrize * 0.6)
    const runnerUpPrize = Math.floor(totalPrize * 0.3)
    const remainingPrize = totalPrize - winnerPrize - runnerUpPrize
    
    distribution[winner] = winnerPrize
    
    // Find runner-up and semi-finalists based on bracket structure
    const finalMatch = this.findFinalMatch()
    if (finalMatch) {
      const runnerUp = finalMatch.player1Id === winner ? finalMatch.player2Id : finalMatch.player1Id
      if (runnerUp) {
        distribution[runnerUp] = runnerUpPrize
      }
      
      // Distribute remaining prize among semi-finalists
      const semiFinalists = this.getSemiFinalists()
      if (semiFinalists.length > 0) {
        const semiFinalsPrize = Math.floor(remainingPrize / semiFinalists.length)
        semiFinalists.forEach(playerId => {
          distribution[playerId] = semiFinalsPrize
        })
      }
    }
    
    return distribution
  }

  private getSemiFinalists(): string[] {
    // Find players who lost in semi-finals
    const semiFinalists: string[] = []
    const finalMatch = this.findFinalMatch()
    
    if (finalMatch && finalMatch.round > 1) {
      // Find matches from previous round (semi-finals)
      const semiMatches = this.tournament.matches.filter(
        m => m.round === finalMatch.round - 1 && m.status === 'COMPLETED'
      )
      
      semiMatches.forEach(match => {
        const loser = match.player1Id === match.winnerId ? match.player2Id : match.player1Id
        if (loser && !semiFinalists.includes(loser)) {
          semiFinalists.push(loser)
        }
      })
    }
    
    return semiFinalists
  }

  private findFinalMatch(): TournamentMatch | null {
    if (this.tournament.bracketType === 'SINGLE_ELIMINATION') {
      const maxRound = Math.max(...this.tournament.matches.map(m => m.round))
      return this.tournament.matches.find(m => m.round === maxRound) || null
    } else {
      return this.tournament.matches.find(m => m.round === 999) || null
    }
  }

  // Get tournament statistics
  getTournamentStats(): {
    totalMatches: number
    completedMatches: number
    remainingMatches: number
    currentRound: number
    totalRounds: number
    averageMatchDuration: number
    activePlayers: number
    eliminatedPlayers: number
  } {
    const totalMatches = this.tournament.matches.length
    const completedMatches = this.tournament.matches.filter(m => m.status === 'COMPLETED').length
    const remainingMatches = totalMatches - completedMatches
    
    const maxRound = Math.max(...this.tournament.matches.map(m => m.round))
    const currentRound = Math.min(...this.tournament.matches
      .filter(m => m.status !== 'COMPLETED')
      .map(m => m.round)) || maxRound
    
    const eliminatedPlayers = this.tournament.players.filter(p => p.isEliminated).length
    const activePlayers = this.tournament.players.length - eliminatedPlayers
    
    return {
      totalMatches,
      completedMatches,
      remainingMatches,
      currentRound,
      totalRounds: maxRound,
      averageMatchDuration: 0, // Would calculate from actual match durations
      activePlayers,
      eliminatedPlayers
    }
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
