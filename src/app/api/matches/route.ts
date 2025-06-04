import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generatePuzzle } from '@/utils/sudoku'
import { MatchmakingService } from '@/lib/matchmaking'
import { z } from 'zod'
import { Prisma, MatchType, MatchStatus } from '@prisma/client'

const createMatchSchema = z.object({
  type: z.enum(['SINGLE_PLAYER', 'MULTIPLAYER_FREE', 'MULTIPLAYER_PAID']),
  entryFee: z.number().min(0).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, entryFee = 0, difficulty } = createMatchSchema.parse(body)

    // Generate a new Sudoku puzzle
    const puzzleData = generatePuzzle(difficulty)
    
    // For single player matches, create immediately
    if (type === 'SINGLE_PLAYER') {
      const match = await prisma.match.create({
        data: {
          type,
          entryFee: 0,
          prize: 0,
          sudokuGrid: JSON.stringify(puzzleData.puzzle),
          solution: JSON.stringify(puzzleData.solution),
          player1Id: session.user.id,
          status: 'ONGOING',
          startedAt: new Date(),
        },
        include: {
          player1: {
            select: { id: true, name: true, image: true }
          }
        }
      })
      
      return NextResponse.json({ match }, { status: 201 })
    }

    // For multiplayer matches, check if entry fee is valid
    if (type === 'MULTIPLAYER_PAID' && entryFee > 0) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { walletBalance: true }
      })

      if (!user || user.walletBalance < entryFee) {
        return NextResponse.json(
          { message: 'Insufficient wallet balance' },
          { status: 400 }
        )
      }
    }

    // For multiplayer free matches, use matchmaking service
    if (type === 'MULTIPLAYER_FREE') {
      try {
        const matchId = await MatchmakingService.addToQueue(session.user.id, difficulty, type)
        
        if (matchId) {
          // Match found immediately
          const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
              player1: { select: { id: true, name: true, image: true } },
              player2: { select: { id: true, name: true, image: true } }
            }
          })
          
          return NextResponse.json({ match, status: 'matched' }, { status: 200 })
        } else {
          // Added to queue, waiting for opponent
          return NextResponse.json({ 
            message: 'Added to matchmaking queue', 
            status: 'queued',
            queueStatus: MatchmakingService.getQueueStatus(session.user.id)
          }, { status: 202 })
        }
      } catch (error) {
        console.error('Matchmaking error:', error)
        // Fall back to original logic
      }
    }

    // Check for existing waiting matches of the same type
    const existingMatch = await prisma.match.findFirst({
      where: {
        type,
        entryFee,
        status: 'WAITING',
        player2Id: null,
        player1Id: { not: session.user.id }, // Don't match with yourself
      },
      include: {
        player1: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    if (existingMatch) {
      // Join existing match
      const updatedMatch = await prisma.$transaction(async (tx) => {
        // Deduct entry fees from both players if paid match
        if (type === 'MULTIPLAYER_PAID' && entryFee > 0) {
          await tx.user.update({
            where: { id: session.user.id },
            data: { walletBalance: { decrement: entryFee } }
          })
          
          await tx.user.update({
            where: { id: existingMatch.player1Id },
            data: { walletBalance: { decrement: entryFee } }
          })

          // Create entry fee transactions
          await tx.transaction.createMany({
            data: [
              {
                userId: session.user.id,
                amount: -entryFee,
                type: 'ENTRY_FEE',
                description: `Entry fee for match ${existingMatch.id}`,
                status: 'completed'
              },
              {
                userId: existingMatch.player1Id,
                amount: -entryFee,
                type: 'ENTRY_FEE',
                description: `Entry fee for match ${existingMatch.id}`,
                status: 'completed'
              }
            ]
          })
        }

        // Update match with second player
        return await tx.match.update({
          where: { id: existingMatch.id },
          data: {
            player2Id: session.user.id,
            status: 'ONGOING',
            startedAt: new Date(),
            prize: entryFee * 2, // Winner takes both entry fees
          },
          include: {
            player1: {
              select: { id: true, name: true, image: true }
            },
            player2: {
              select: { id: true, name: true, image: true }
            }
          }
        })
      })

      return NextResponse.json({ match: updatedMatch }, { status: 200 })
    }

    // Create new waiting match
    const match = await prisma.match.create({
      data: {
        type,
        entryFee,
        prize: 0,
        sudokuGrid: JSON.stringify(puzzleData.puzzle),
        solution: JSON.stringify(puzzleData.solution),
        player1Id: session.user.id,
        status: 'WAITING',
      },
      include: {
        player1: {
          select: { id: true, name: true, image: true }
        }
      }
    })

    return NextResponse.json({ match }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }

    console.error('Create match error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Prisma.MatchWhereInput = {
      OR: [
        { player1Id: session.user.id },
        { player2Id: session.user.id }
      ]
    }

    if (status) {
      where.status = status as MatchStatus
    }

    if (type) {
      where.type = type as MatchType
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        player1: {
          select: { id: true, name: true, image: true }
        },
        player2: {
          select: { id: true, name: true, image: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    return NextResponse.json({ matches }, { status: 200 })
  } catch (error) {
    console.error('Get matches error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
