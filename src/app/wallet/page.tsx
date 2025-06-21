'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Wallet, 
  Plus, 
  Minus,
  ArrowUpRight, 
  ArrowDownLeft,
  History,
  CreditCard,
  Trophy,
  RefreshCw
} from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  description: string
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  createdAt: string
}

interface WalletData {
  balance: number
  transactions: Transaction[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export default function WalletPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [walletData, setWalletData] = useState<WalletData>({
    balance: 0,
    transactions: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  })

  useEffect(() => {
    if (!session?.user?.id) {
      router.push('/auth/signin')
      return
    }
    fetchWalletData()
  }, [session, router])

  const fetchWalletData = async () => {
    try {
      setLoading(true)
      
      // Fetch wallet balance
      const balanceResponse = await fetch('/api/wallet')
      const balanceData = await balanceResponse.json()
      
      // Fetch transaction history
      const transactionsResponse = await fetch('/api/transactions')
      const transactionsData = await transactionsResponse.json()
      
      setWalletData({
        balance: balanceData.balance || 0,
        transactions: transactionsData.transactions || [],
        pagination: transactionsData.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 }
      })
    } catch (error) {
      console.error('Error fetching wallet data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount)
    
    if (!amount || amount < 1) {
      alert('Please enter a valid amount')
      return
    }

    setIsProcessing(true)
    
    try {
      // Create payment order
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
      
      const orderData = await response.json()
      
      if (!response.ok) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Mock Razorpay payment flow for development
      const mockPaymentSuccess = await simulatePayment(orderData)
      
      if (mockPaymentSuccess) {
        // Verify payment
        const verifyResponse = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.orderId,
            paymentId: `pay_${Date.now()}`,
            signature: 'mock_signature',
            transactionId: orderData.transactionId
          })
        })
        
        const verifyData = await verifyResponse.json()
        
        if (verifyResponse.ok) {
          setWalletData(prev => ({ ...prev, balance: verifyData.balance }))
          setRechargeAmount('')
          fetchWalletData() // Refresh all data
          alert(`Payment successful! ₹${amount} added to your wallet.`)
        } else {
          throw new Error(verifyData.error || 'Payment verification failed')
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    
    if (!amount || amount < 100) {
      alert('Minimum withdrawal amount is ₹100')
      return
    }

    if (amount > walletData.balance) {
      alert('Insufficient balance')
      return
    }

    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      alert('Please provide complete bank details')
      return
    }

    setIsProcessing(true)
    
    try {
      const response = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bankDetails })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Withdrawal request submitted successfully!')
        setWithdrawAmount('')
        setBankDetails({ accountNumber: '', ifscCode: '', accountHolderName: '' })
        setShowWithdrawForm(false)
        fetchWalletData()
      } else {
        alert(data.error || 'Withdrawal failed')
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      alert('Withdrawal failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  const simulatePayment = (orderData: any): Promise<boolean> => {
    return new Promise((resolve) => {
      // Simulate payment processing time
      setTimeout(() => {
        // Mock 100% success rate in development
        resolve(true)
      }, 1000)
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!session?.user?.id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <Wallet className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-4">Please sign in to access your wallet.</p>
              <Button onClick={() => router.push('/auth/signin')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Loading Wallet...</h3>
              <p className="text-gray-600">Fetching your wallet information.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <Wallet className="h-8 w-8 text-blue-600" />
          <span>My Wallet</span>
        </h1>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          Back to Dashboard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wallet Balance & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" />
                <span>Wallet Balance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  ₹{walletData.balance.toFixed(2)}
                </div>
                <Button 
                  onClick={fetchWalletData}
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recharge Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Add Money</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  min="1"
                  max="10000"
                />
              </div>
              
              {/* Quick amount buttons */}
              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setRechargeAmount(amount.toString())}
                  >
                    ₹{amount}
                  </Button>
                ))}
              </div>
              
              <Button 
                onClick={handleRecharge}
                disabled={isProcessing || !rechargeAmount}
                className="w-full"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Add Money</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Withdrawal Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Minus className="h-5 w-5" />
                <span>Withdraw Money</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">
                  Withdrawals are processed within 24 hours.
                </p>
                <Button 
                  onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                  variant={showWithdrawForm ? 'destructive' : 'default'}
                  className="w-full"
                >
                  {showWithdrawForm ? 'Cancel' : 'Withdraw Funds'}
                </Button>
              </div>

              {showWithdrawForm && (
                <div className="space-y-4">
                  <div>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      min="100"
                      max={walletData.balance}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Input
                      placeholder="Account Number"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    />
                    <Input
                      placeholder="IFSC Code"
                      value={bankDetails.ifscCode}
                      onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                    />
                    <Input
                      placeholder="Account Holder Name"
                      value={bankDetails.accountHolderName}
                      onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleWithdraw}
                    disabled={isProcessing || !withdrawAmount}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <ArrowUpRight className="h-4 w-4" />
                        <span>Withdraw Money</span>
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Quick Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Transactions:</span>
                <span className="font-semibold">{walletData.pagination.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">This Month:</span>
                <span className="font-semibold">
                  {walletData.transactions.filter(t => 
                    new Date(t.createdAt).getMonth() === new Date().getMonth()
                  ).length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Transaction History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {walletData.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Your transaction history will appear here once you make your first transaction.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {walletData.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          transaction.type === 'CREDIT' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {transaction.type === 'CREDIT' ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'CREDIT' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                        </p>
                        <Badge 
                          variant={
                            transaction.status === 'COMPLETED' ? 'default' :
                            transaction.status === 'PENDING' ? 'secondary' : 'destructive'
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
