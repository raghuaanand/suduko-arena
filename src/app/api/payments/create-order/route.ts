import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createRazorpayOrder } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await request.json()

    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Create Razorpay order
    const order = await createRazorpayOrder(amount, session.user.id, `Wallet recharge - ₹${amount}`)

    // Save pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount,
        type: 'ADD_FUNDS',
        description: `Wallet recharge - ₹${amount}`,
        status: 'PENDING',
        razorpayId: order.id
      }
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      transactionId: transaction.id,
      razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock_key'
    })
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
