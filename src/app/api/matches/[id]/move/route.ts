import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GameScoringService } from '@/lib/gameScoring'

// POST /api/matches/[id]/move - Make a move in the game
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { row, col, value, grid, timeElapsed, movesCount, hintsUsed, errorsCount } = await request.json()

    // Validate move
    if (row < 0 || row > 8 || col < 0 || col > 8 || value < 0 || value > 9) {
      return NextResponse.json({ error: 'Invalid move' }, { status: 400 })
    }

    // Update player progress and check for completion
    const completion = await GameScoringService.updatePlayerProgress(
      session.user.id,
      matchId,
      grid,
      timeElapsed,
      movesCount,
      hintsUsed,
      errorsCount
    )

    return NextResponse.json({
      success: true,
      move: { row, col, value },
      completion
    })
  } catch (error) {
    console.error('Error processing move:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/matches/[id]/move - Get current game state
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if game is complete
    const completion = await GameScoringService.checkGameCompletion(matchId)

    return NextResponse.json({
      success: true,
      completion
    })
  } catch (error) {
    console.error('Error getting game state:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
