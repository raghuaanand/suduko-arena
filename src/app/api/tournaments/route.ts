import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/tournaments - Get all tournaments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    // const playerId = searchParams.get('playerId') // Commented out as unused for now

    // For now, return mock data until we implement full tournament system
    const mockTournaments = [
      {
        id: '1',
        name: 'Daily Championship',
        entryFee: 100,
        prizePool: 5000,
        maxPlayers: 16,
        currentPlayers: 8,
        status: 'REGISTRATION',
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        description: 'Daily tournament with exciting prizes for Sudoku masters!',
        bracketType: 'SINGLE_ELIMINATION',
        currentRound: 0,
        totalRounds: 4,
        players: [],
        matches: []
      },
      {
        id: '2',
        name: 'Weekend Warrior',
        entryFee: 50,
        prizePool: 2000,
        maxPlayers: 8,
        currentPlayers: 8,
        status: 'IN_PROGRESS',
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        description: 'Perfect for weekend players looking for competitive action.',
        bracketType: 'SINGLE_ELIMINATION',
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
        matches: [
          {
            id: '2-r1-m1',
            tournamentId: '2',
            round: 1,
            position: 1,
            player1Id: '1',
            player2Id: '2',
            winnerId: '1',
            status: 'COMPLETED' as const,
            matchId: 'match_1'
          },
          {
            id: '2-r1-m2',
            tournamentId: '2',
            round: 1,
            position: 2,
            player1Id: '3',
            player2Id: '4',
            winnerId: null,
            status: 'IN_PROGRESS' as const,
            matchId: 'match_2'
          },
          {
            id: '2-r1-m3',
            tournamentId: '2',
            round: 1,
            position: 3,
            player1Id: '5',
            player2Id: '6',
            winnerId: null,
            status: 'PENDING' as const,
            matchId: null
          },
          {
            id: '2-r1-m4',
            tournamentId: '2',
            round: 1,
            position: 4,
            player1Id: '7',
            player2Id: '8',
            winnerId: null,
            status: 'PENDING' as const,
            matchId: null
          },
          {
            id: '2-r2-m1',
            tournamentId: '2',
            round: 2,
            position: 1,
            player1Id: '1',
            player2Id: null,
            winnerId: null,
            status: 'PENDING' as const,
            matchId: null
          },
          {
            id: '2-r2-m2',
            tournamentId: '2',
            round: 2,
            position: 2,
            player1Id: null,
            player2Id: null,
            winnerId: null,
            status: 'PENDING' as const,
            matchId: null
          },
          {
            id: '2-r3-m1',
            tournamentId: '2',
            round: 3,
            position: 1,
            player1Id: null,
            player2Id: null,
            winnerId: null,
            status: 'PENDING' as const,
            matchId: null
          }
        ]
      }
    ]

    let filteredTournaments = mockTournaments

    if (status) {
      filteredTournaments = filteredTournaments.filter(t => t.status === status)
    }

    return NextResponse.json({ 
      tournaments: filteredTournaments,
      count: filteredTournaments.length 
    })

  } catch (error) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    )
  }
}

// POST /api/tournaments - Create new tournament
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, entryFee, maxPlayers, description, startTime } = body

    // Validate input
    if (!name || !entryFee || !maxPlayers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate prize pool (90% of total entry fees, 10% platform fee)
    const prizePool = Math.floor(entryFee * maxPlayers * 0.9)
    const totalRounds = Math.ceil(Math.log2(maxPlayers)) // Calculate rounds based on tournament size

    // For now, return mock tournament creation
    const tournament = {
      id: `tournament_${Date.now()}`,
      name,
      entryFee,
      prizePool,
      maxPlayers,
      currentPlayers: 0,
      status: 'REGISTRATION' as const,
      startTime,
      description,
      bracketType: 'SINGLE_ELIMINATION' as const,
      currentRound: 0,
      totalRounds,
      players: [],
      matches: [],
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({ 
      tournament,
      message: 'Tournament created successfully' 
    })

  } catch (error) {
    console.error('Error creating tournament:', error)
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    )
  }
}
