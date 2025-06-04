import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isComplete, isValidMove } from '@/utils/sudoku'
import { z } from 'zod'

const moveSchema = z.object({
  row: z.number().min(0).max(8),
  col: z.number().min(0).max(8),
  value: z.number().min(0).max(9),
  grid: z.array(z.array(z.number().min(0).max(9))),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { row, col, value, grid } = moveSchema.parse(body)

    // Get the match
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        player1: { select: { id: true, name: true } },
        player2: { select: { id: true, name: true } }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 })
    }

    // Check if user is part of this match
    if (match.player1Id !== session.user.id && match.player2Id !== session.user.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    // Check if match is ongoing
    if (match.status !== 'ONGOING') {
      return NextResponse.json({ message: 'Match is not ongoing' }, { status: 400 })
    }

    // Validate the move
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const solution = JSON.parse(match.solution || '[]')
    if (!isValidMove(grid, row, col, value) && value !== 0) {
      return NextResponse.json({ message: 'Invalid move' }, { status: 400 })
    }

    // Check if puzzle is completed
    const isGameComplete = isComplete(grid)
    let winnerId: string | null = null
    let updatedMatch

    if (isGameComplete) {
      winnerId = session.user.id
      
      // Handle game completion
      updatedMatch = await prisma.$transaction(async (tx) => {
        // Update match status
        const updated = await tx.match.update({
          where: { id },
          data: {
            status: 'FINISHED',
            winnerId,
            endedAt: new Date(),
          },
          include: {
            player1: { select: { id: true, name: true } },
            player2: { select: { id: true, name: true } }
          }
        })

        // Award prize if it's a paid match
        if (updated.prize > 0 && winnerId) {
          await tx.user.update({
            where: { id: winnerId },
            data: { walletBalance: { increment: updated.prize } }
          })

          // Create win transaction
          await tx.transaction.create({
            data: {
              userId: winnerId,
              amount: updated.prize,
              type: 'MATCH_WIN',
              description: `Prize for winning match ${updated.id}`,
              status: 'completed'
            }
          })
        }

        return updated
      })
    } else {
      // Just update the grid state (this could be enhanced with real-time sync)
      updatedMatch = match
    }

    return NextResponse.json({
      match: updatedMatch,
      isComplete: isGameComplete,
      winnerId,
      grid
    }, { status: 200 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Match move error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const { id } = await params
    const match = await prisma.match.findUnique({
      where: { id: id },
      include: {
        player1: {
          select: { id: true, name: true, image: true }
        },
        player2: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    if (!match) {
      return NextResponse.json({ message: 'Match not found' }, { status: 404 })
    }

    // Check if user is part of this match or if it's a completed public match
    if (match.player1Id !== session.user.id && 
        match.player2Id !== session.user.id && 
        match.status !== 'FINISHED') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ match }, { status: 200 })

  } catch (error) {
    console.error('Get match error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
