import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyPaymentSignature } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, paymentId, signature, transactionId } = await request.json()

    if (!orderId || !paymentId || !signature || !transactionId) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    // Verify Razorpay signature
    const isValid = verifyPaymentSignature(orderId, paymentId, signature)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Process the successful payment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get the pending transaction
      const transaction = await tx.transaction.findUnique({
        where: { 
          id: transactionId,
          userId: session.user.id,
          status: 'PENDING'
        }
      })

      if (!transaction) {
        throw new Error('Transaction not found or already processed')
      }

      // Update transaction status
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          razorpayId: paymentId
        }
      })

      // Get current user balance
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
        select: { walletBalance: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Update user wallet balance
      const newBalance = (user.walletBalance || 0) + transaction.amount
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { walletBalance: newBalance }
      })

      return { transaction, newBalance: updatedUser.walletBalance }
    })

    return NextResponse.json({
      success: true,
      balance: result.newBalance,
      transaction: result.transaction
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Transaction not found or already processed') {
        return NextResponse.json({ error: 'Transaction not found or already processed' }, { status: 404 })
      }
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
