import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, bankDetails } = await request.json()

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is ₹100' }, { status: 400 })
    }

    if (!bankDetails?.accountNumber || !bankDetails?.ifscCode || !bankDetails?.accountHolderName) {
      return NextResponse.json({ error: 'Bank details are required for withdrawal' }, { status: 400 })
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

      if (user.walletBalance < amount) {
        throw new Error('Insufficient balance')
      }

      // Deduct amount from wallet
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          walletBalance: {
            decrement: amount
          }
        }
      })

      // Create withdrawal transaction
      const transaction = await tx.transaction.create({
        data: {
          userId: session.user.id,
          amount,
          type: 'WITHDRAW',
          description: `Wallet withdrawal - ₹${amount} to ${bankDetails.accountNumber}`,
          status: 'PENDING'
        }
      })

      return { transaction, newBalance: user.walletBalance - amount }
    })

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      transactionId: result.transaction.id,
      newBalance: result.newBalance
    })
  } catch (error: unknown) {
    console.error('Withdrawal error:', error)
    
    if (error instanceof Error && error.message === 'Insufficient balance') {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
