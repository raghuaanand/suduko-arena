import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/tournaments/[id]/join - Join tournament
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const tournamentId = params.id

    // Check user's wallet balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For mock tournament, assume entry fee is 50
    const entryFee = 50
    
    if (user.walletBalance < entryFee) {
      return NextResponse.json(
        { error: 'Insufficient wallet balance' },
        { status: 400 }
      )
    }

    // Deduct entry fee
    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletBalance: { decrement: entryFee } }
    })

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'ENTRY_FEE',
        amount: -entryFee,
        description: `Tournament entry fee for tournament ${tournamentId}`,
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({
      message: 'Successfully joined tournament',
      tournamentId,
      entryFee,
      remainingBalance: user.walletBalance - entryFee
    })

  } catch (error) {
    console.error('Error joining tournament:', error)
    return NextResponse.json(
      { error: 'Failed to join tournament' },
      { status: 500 }
    )
  }
}

// DELETE /api/tournaments/[id]/join - Leave tournament (if registration still open)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const tournamentId = params.id

    // Refund entry fee (for mock tournament)
    const entryFee = 50

    await prisma.user.update({
      where: { id: session.user.id },
      data: { walletBalance: { increment: entryFee } }
    })

    // Create refund transaction
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        type: 'ADMIN_CREDIT',
        amount: entryFee,
        description: `Tournament entry refund for tournament ${tournamentId}`,
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({
      message: 'Successfully left tournament',
      tournamentId,
      refundAmount: entryFee
    })

  } catch (error) {
    console.error('Error leaving tournament:', error)
    return NextResponse.json(
      { error: 'Failed to leave tournament' },
      { status: 500 }
    )
  }
}
