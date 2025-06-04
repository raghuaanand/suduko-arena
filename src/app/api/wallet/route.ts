import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { walletBalance: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ balance: user.walletBalance })
  } catch (error) {
    console.error('Wallet balance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, type, description } = await request.json()

    if (!amount || !type) {
      return NextResponse.json({ error: 'Amount and type are required' }, { status: 400 })
    }

    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current user with balance
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { walletBalance: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const currentBalance = user.walletBalance || 0
      let newBalance: number

      if (type === 'CREDIT') {
        newBalance = currentBalance + amount
      } else if (type === 'DEBIT') {
        if (currentBalance < amount) {
          throw new Error('Insufficient balance')
        }
        newBalance = currentBalance - amount
      } else {
        throw new Error('Invalid transaction type')
      }

      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { walletBalance: newBalance }
      })

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount,
          type,
          description: description || `${type.toLowerCase()} transaction`,
          status: 'COMPLETED'
        }
      })

      return { user: updatedUser, transaction }
    })

    return NextResponse.json({
      balance: result.user.walletBalance,
      transaction: result.transaction
    })
  } catch (error) {
    console.error('Wallet transaction error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Insufficient balance') {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
