import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateWebhookSignature, parseWebhookEvent } from '@/lib/razorpay'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Validate webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Skip signature validation for mock/development mode
    if (!webhookSecret.includes('mock')) {
      const isValid = validateWebhookSignature(body, signature, webhookSecret)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    }

    const event = parseWebhookEvent(JSON.parse(body))

    // Handle different webhook events
    switch (event.type) {
      case 'payment_success':
        await handlePaymentSuccess(event.data)
        break
      
      case 'payment_failed':
        await handlePaymentFailed(event.data)
        break
      
      case 'refund_processed':
        await handleRefundProcessed(event.data)
        break
      
      default:
        console.log('Unhandled webhook event:', event.type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handlePaymentSuccess(paymentData: any) {
  try {
    const orderId = paymentData.order_id
    const paymentId = paymentData.id
    const amount = paymentData.amount / 100 // Convert from paisa to rupees

    // Find the transaction by Razorpay order ID
    const transaction = await prisma.transaction.findFirst({
      where: {
        razorpayId: orderId,
        status: 'PENDING'
      },
      include: {
        user: true
      }
    })

    if (!transaction) {
      console.error('Transaction not found for order:', orderId)
      return
    }

    // Update transaction and user wallet in a database transaction
    await prisma.$transaction(async (tx) => {
      // Update transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          razorpayId: paymentId
        }
      })

      // Update user wallet balance
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          walletBalance: {
            increment: amount
          }
        }
      })
    })

    console.log(`Payment successful for user ${transaction.userId}, amount: ₹${amount}`)
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handlePaymentFailed(paymentData: any) {
  try {
    const orderId = paymentData.order_id

    // Find and update the transaction
    await prisma.transaction.updateMany({
      where: {
        razorpayId: orderId,
        status: 'PENDING'
      },
      data: {
        status: 'FAILED'
      }
    })

    console.log('Payment failed for order:', orderId)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

async function handleRefundProcessed(refundData: any) {
  try {
    const paymentId = refundData.payment_id
    const refundAmount = refundData.amount / 100 // Convert from paisa to rupees

    // Find the original transaction
    const transaction = await prisma.transaction.findFirst({
      where: {
        razorpayId: paymentId,
        status: 'COMPLETED'
      }
    })

    if (!transaction) {
      console.error('Transaction not found for refund:', paymentId)
      return
    }

    // Create refund transaction and update user wallet
    await prisma.$transaction(async (tx) => {
      // Create refund transaction record
      await tx.transaction.create({
        data: {
          userId: transaction.userId,
          amount: -refundAmount,
          type: 'ADMIN_CREDIT',
          description: `Refund for transaction ${transaction.id}`,
          status: 'completed',
          razorpayId: refundData.id
        }
      })

      // Update user wallet balance
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          walletBalance: {
            decrement: refundAmount
          }
        }
      })
    })

    console.log(`Refund processed for user ${transaction.userId}, amount: ₹${refundAmount}`)
  } catch (error) {
    console.error('Error handling refund:', error)
  }
}
