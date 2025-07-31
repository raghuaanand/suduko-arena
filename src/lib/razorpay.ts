import Razorpay from 'razorpay'
import crypto from 'crypto'

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret'
})

export interface RazorpayOrder {
  id: string
  amount: string | number
  currency: string
  status: string
  created_at: number
}

export interface PaymentVerificationData {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(
  amount: number,
  userId: string,
  description?: string
): Promise<RazorpayOrder> {
  try {
    // If using mock keys, return mock order
    if (process.env.RAZORPAY_KEY_ID?.includes('mock') || !process.env.RAZORPAY_KEY_ID) {
      return {
        id: `order_${Date.now()}`,
        amount: amount * 100, // Convert to paisa
        currency: 'INR',
        status: 'created',
        created_at: Date.now()
      }
    }

    const options = {
      amount: amount * 100, // Amount in paisa
      currency: 'INR',
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId,
        description: description || 'Wallet recharge'
      }
    }

    const order = await razorpay.orders.create(options)
    return order
  } catch (error) {
    console.error('Error creating Razorpay order:', error)
    throw new Error('Failed to create payment order')
  }
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    // If using mock keys, return true for development
    if (process.env.RAZORPAY_KEY_SECRET?.includes('mock') || !process.env.RAZORPAY_KEY_SECRET) {
      return true
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    return generatedSignature === signature
  } catch (error) {
    console.error('Error verifying payment signature:', error)
    return false
  }
}

/**
 * Get payment details from Razorpay
 */
export async function getPaymentDetails(paymentId: string) {
  try {
    // If using mock keys, return mock payment details
    if (process.env.RAZORPAY_KEY_ID?.includes('mock') || !process.env.RAZORPAY_KEY_ID) {
      return {
        id: paymentId,
        status: 'captured',
        method: 'card',
        amount: 0,
        currency: 'INR',
        created_at: Date.now()
      }
    }

    const payment = await razorpay.payments.fetch(paymentId)
    return payment
  } catch (error) {
    console.error('Error fetching payment details:', error)
    throw new Error('Failed to fetch payment details')
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentId: string,
  amount?: number,
  reason?: string
) {
  try {
    // If using mock keys, return mock refund
    if (process.env.RAZORPAY_KEY_ID?.includes('mock') || !process.env.RAZORPAY_KEY_ID) {
      return {
        id: `rfnd_${Date.now()}`,
        payment_id: paymentId,
        amount: amount || 0,
        currency: 'INR',
        status: 'processed',
        created_at: Date.now()
      }
    }

    const refundOptions: { amount?: number; notes?: { reason: string } } = {}
    if (amount) refundOptions.amount = amount * 100 // Convert to paisa
    if (reason) refundOptions.notes = { reason }

    const refund = await razorpay.payments.refund(paymentId, refundOptions)
    return refund
  } catch (error) {
    console.error('Error processing refund:', error)
    throw new Error('Failed to process refund')
  }
}

/**
 * Create a Razorpay customer
 */
export async function createCustomer(
  name: string,
  email: string,
  contact?: string
) {
  try {
    // If using mock keys, return mock customer
    if (process.env.RAZORPAY_KEY_ID?.includes('mock') || !process.env.RAZORPAY_KEY_ID) {
      return {
        id: `cust_${Date.now()}`,
        name,
        email,
        contact: contact || '',
        created_at: Date.now()
      }
    }

    const customerOptions: { name: string; email: string; contact?: string } = {
      name,
      email
    }

    if (contact) customerOptions.contact = contact

    const customer = await razorpay.customers.create(customerOptions)
    return customer
  } catch (error) {
    console.error('Error creating customer:', error)
    throw new Error('Failed to create customer')
  }
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  webhookBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(webhookBody)
      .digest('hex')

    return expectedSignature === signature
  } catch (error) {
    console.error('Error validating webhook signature:', error)
    return false
  }
}

/**
 * Handle Razorpay webhook events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseWebhookEvent(body: { event: string; payload: any }) {
  const event = body.event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = body.payload as any

  switch (event) {
    case 'payment.captured':
      return {
        type: 'payment_success',
        data: payload.payment?.entity
      }
    
    case 'payment.failed':
      return {
        type: 'payment_failed',
        data: payload.payment?.entity
      }
    
    case 'order.paid':
      return {
        type: 'order_paid',
        data: payload.order?.entity
      }
    
    case 'refund.created':
      return {
        type: 'refund_created',
        data: payload.refund?.entity
      }
    
    case 'refund.processed':
      return {
        type: 'refund_processed',
        data: payload.refund?.entity
      }
    
    default:
      return {
        type: 'unknown',
        data: payload
      }
  }
}

export default razorpay
