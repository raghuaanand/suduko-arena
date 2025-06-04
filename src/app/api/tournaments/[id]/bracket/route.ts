import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TournamentBracket } from '@/lib/tournament'

// GET /api/tournaments/[id]/bracket - Get tournament bracket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return mock bracket data
    const mockTournament = {
      id: tournamentId,
      name: 'Sample Tournament',
      entryFee: 100,
      prizePool: 5000,
      maxPlayers: 8,
      currentPlayers: 8,
      status: 'IN_PROGRESS' as const,
      startTime: new Date().toISOString(),
      description: 'Tournament bracket demonstration',
      bracketType: 'SINGLE_ELIMINATION' as const,
      currentRound: 1,
      totalRounds: 3,
      players: [
        { id: '1', name: 'Player 1', email: 'p1@test.com', isEliminated: false, currentRound: 1 },
        { id: '2', name: 'Player 2', email: 'p2@test.com', isEliminated: false, currentRound: 1 },
        { id: '3', name: 'Player 3', email: 'p3@test.com', isEliminated: false, currentRound: 1 },
        { id: '4', name: 'Player 4', email: 'p4@test.com', isEliminated: false, currentRound: 1 },
        { id: '5', name: 'Player 5', email: 'p5@test.com', isEliminated: false, currentRound: 1 },
        { id: '6', name: 'Player 6', email: 'p6@test.com', isEliminated: false, currentRound: 1 },
        { id: '7', name: 'Player 7', email: 'p7@test.com', isEliminated: false, currentRound: 1 },
        { id: '8', name: 'Player 8', email: 'p8@test.com', isEliminated: false, currentRound: 1 }
      ],
      matches: []
    }

    const bracket = new TournamentBracket(mockTournament)
    const bracketMatches = bracket.generateSingleEliminationBracket()

    // Add some completed matches for demo
    bracketMatches[0].status = 'COMPLETED'
    bracketMatches[0].winnerId = '1'
    bracketMatches[1].status = 'COMPLETED'
    bracketMatches[1].winnerId = '3'
    bracketMatches[2].status = 'IN_PROGRESS'
    bracketMatches[3].status = 'PENDING'

    return NextResponse.json({
      success: true,
      tournament: {
        ...mockTournament,
        matches: bracketMatches
      },
      bracket: bracketMatches
    })
  } catch (error) {
    console.error('Error getting tournament bracket:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tournaments/[id]/bracket/advance - Advance winner to next round
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { matchId, winnerId } = await request.json()

    if (!matchId || !winnerId) {
      return NextResponse.json({ error: 'Match ID and winner ID required' }, { status: 400 })
    }

    // In a real implementation, this would update the database
    console.log(`Tournament ${tournamentId}: Match ${matchId} won by ${winnerId}`)

    return NextResponse.json({
      success: true,
      message: 'Winner advanced to next round'
    })
  } catch (error) {
    console.error('Error advancing winner:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
