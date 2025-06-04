import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock Razorpay implementation for development
// In production, you would use the actual Razorpay SDK
const createRazorpayOrder = async (amount: number) => {
  // Mock order creation
  return {
    id: `order_${Date.now()}`,
    amount: amount * 100, // Razorpay uses paisa
    currency: 'INR',
    status: 'created'
  }
}

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
    const order = await createRazorpayOrder(amount)

    // Save pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount,
        type: 'ADD_FUNDS',
        description: `Wallet recharge - ₹${amount}`,
        status: 'PENDING',
        razorpayOrderId: order.id
      }
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      transactionId: transaction.id,
      // Mock Razorpay key for development
      razorpayKey: 'rzp_test_mock_key'
    })
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
