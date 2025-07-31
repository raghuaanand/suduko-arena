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
  RefreshCw,
  Sparkles,
  TrendingUp,
  Shield
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
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
        {/* Cosmic Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/15 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-[#0f3460]/30 to-[#e94560]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        </div>
        
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="w-96 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md border border-[#e94560]/30 rounded-2xl shadow-2xl">
            <div className="p-8">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full blur-lg opacity-50"></div>
                  <Wallet className="relative h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Access Denied</h3>
                <p className="text-white/70 mb-6">Please sign in to access your wallet.</p>
                <button 
                  onClick={() => router.push('/auth/signin')}
                  className="w-full bg-gradient-to-r from-[#e94560] to-[#f9ed69] hover:from-[#d63847] hover:to-[#f7e742] text-[#1a1a2e] font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
        {/* Cosmic Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/15 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-l from-[#0f3460]/30 to-[#e94560]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        </div>
        
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="w-96 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md border border-[#e94560]/30 rounded-2xl shadow-2xl">
            <div className="p-8">
              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full animate-spin opacity-20"></div>
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-white/20 border-t-[#f9ed69]"></div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Loading Wallet...</h3>
                <p className="text-white/70">Fetching your wallet information.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
      {/* Cosmic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/15 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-l from-[#0f3460]/40 to-[#e94560]/25 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-t from-[#f9ed69]/20 to-[#16213e]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Floating star particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#f9ed69] rounded-full animate-ping opacity-70"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#e94560] rounded-full animate-ping opacity-80" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#0f3460] rounded-full animate-ping opacity-60" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="container mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold flex items-center space-x-3 text-white">
            <div className="w-10 h-10 bg-gradient-to-br from-[#e94560] to-[#f9ed69] rounded-xl flex items-center justify-center shadow-lg">
              <Wallet className="h-6 w-6 text-[#1a1a2e]" />
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f9ed69] to-[#e94560]">
              My Wallet
            </span>
            <Sparkles className="h-6 w-6 text-[#f9ed69] animate-pulse" />
          </h1>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-gradient-to-r from-[#e94560]/20 to-[#0f3460]/20 border border-[#e94560]/30 rounded-xl text-white hover:from-[#e94560]/30 hover:to-[#0f3460]/30 hover:border-[#e94560]/50 transition-all duration-300 transform hover:scale-105 shadow-lg backdrop-blur-md"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wallet Balance & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Balance Card */}
            <div className="relative overflow-hidden border-2 border-[#f9ed69]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md rounded-xl">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#f9ed69]/20 to-[#e94560]/10 rounded-bl-full"></div>
              <div className="relative z-10 border-b border-[#f9ed69]/20 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-lg flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-[#1a1a2e]" />
                  </div>
                  <span className="text-white font-semibold text-lg">Wallet Balance</span>
                </div>
              </div>
              <div className="relative z-10 p-6">
                <div className="text-center">
                  <div className="relative inline-block">
                    <div className="text-5xl font-bold text-[#f9ed69] mb-4">
                      ₹{walletData.balance.toFixed(2)}
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <TrendingUp className="h-6 w-6 text-[#f9ed69] animate-pulse" />
                    </div>
                  </div>
                  <button 
                    onClick={fetchWalletData}
                    className="flex items-center space-x-2 mx-auto px-4 py-2 text-white/70 hover:text-white transition-colors duration-300 hover:bg-[#e94560]/20 rounded-lg"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Recharge Card */}
            <div className="relative overflow-hidden border-2 border-[#e94560]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md rounded-xl">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#e94560]/20 to-[#f9ed69]/10 rounded-bl-full"></div>
              <div className="relative z-10 border-b border-[#e94560]/20 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#e94560] to-[#f9ed69] rounded-lg flex items-center justify-center">
                    <Plus className="h-4 w-4 text-[#1a1a2e]" />
                  </div>
                  <span className="text-white font-semibold text-lg">Add Money</span>
                </div>
              </div>
              <div className="relative z-10 p-6 space-y-6">
                <div>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    min="1"
                    max="10000"
                    className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-[#e94560]/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#e94560] focus:border-transparent transition-all duration-300"
                  />
                </div>
                
                {/* Quick amount buttons */}
                <div className="grid grid-cols-3 gap-3">
                  {[100, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setRechargeAmount(amount.toString())}
                      className="px-4 py-2 bg-gradient-to-r from-[#e94560]/10 to-[#f9ed69]/10 border border-[#e94560]/20 text-white rounded-xl hover:from-[#e94560]/20 hover:to-[#f9ed69]/20 transition-all duration-300 transform hover:scale-105"
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
                
                <button 
                  onClick={handleRecharge}
                  disabled={isProcessing || !rechargeAmount}
                  className="w-full bg-gradient-to-r from-[#e94560] to-[#f9ed69] hover:from-[#d63847] hover:to-[#f7e742] disabled:from-gray-600 disabled:to-gray-700 text-[#1a1a2e] font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#1a1a2e]/20 border-t-[#1a1a2e]"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Add Money</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Withdrawal Card */}
            <div className="relative overflow-hidden border-2 border-[#0f3460]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md rounded-xl">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#0f3460]/20 to-[#e94560]/10 rounded-bl-full"></div>
              <div className="relative z-10 border-b border-[#0f3460]/20 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#0f3460] to-[#e94560] rounded-lg flex items-center justify-center">
                    <Minus className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-white font-semibold text-lg">Withdraw Money</span>
                </div>
              </div>
              <div className="relative z-10 p-6 space-y-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Shield className="h-5 w-5 text-[#f9ed69]" />
                    <p className="text-sm text-white/70">
                      Withdrawals are processed within 24 hours.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                    className={`w-full font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                      showWithdrawForm 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white' 
                        : 'w-full bg-gradient-to-r from-[#e94560] to-[#f9ed69] hover:from-[#d63847] hover:to-[#f7e742] text-[#1a1a2e] border-0 font-semibold shadow-lg group-hover:shadow-xl transform transition-all duration-300'
                    }`}
                  >
                    {showWithdrawForm ? 'Cancel' : 'Withdraw Funds'}
                  </button>
                </div>

                {showWithdrawForm && (
                  <div className="space-y-4">
                    <div>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="100"
                        max={walletData.balance}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <input
                        placeholder="Account Number"
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                      />
                      <input
                        placeholder="IFSC Code"
                        value={bankDetails.ifscCode}
                        onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                      />
                      <input
                        placeholder="Account Holder Name"
                        value={bankDetails.accountHolderName}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all duration-300"
                      />
                    </div>
                    
                    <button 
                      onClick={handleWithdraw}
                      disabled={isProcessing || !withdrawAmount}
                      className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white"></div>
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <ArrowUpRight className="h-5 w-5" />
                          <span>Withdraw Money</span>
                        </div>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="relative overflow-hidden border-2 border-[#f9ed69]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md rounded-xl">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#f9ed69]/20 to-[#e94560]/10 rounded-bl-full"></div>
              <div className="relative z-10 border-b border-[#f9ed69]/20 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-lg flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-[#1a1a2e]" />
                  </div>
                  <span className="text-white font-semibold text-lg">Quick Stats</span>
                </div>
              </div>
              <div className="relative z-10 p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">Total Transactions:</span>
                  <span className="font-bold text-[#f9ed69]">
                    {walletData.pagination.total}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">This Month:</span>
                  <span className="font-bold text-[#f9ed69]">
                    {walletData.transactions.filter(t => 
                      new Date(t.createdAt).getMonth() === new Date().getMonth()
                    ).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden border-2 border-[#0f3460]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md rounded-xl">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#0f3460]/10 to-[#e94560]/5 rounded-br-full"></div>
            <div className="relative z-10 border-b border-[#0f3460]/20 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0f3460] to-[#e94560] rounded-lg flex items-center justify-center">
                  <History className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-semibold text-lg">Transaction History</span>
              </div>
            </div>
            <div className="relative z-10 p-6">
              {walletData.transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative inline-flex items-center justify-center w-20 h-20 mx-auto mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#0f3460] to-[#e94560] rounded-full flex items-center justify-center opacity-50">
                      <History className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">No Transactions Yet</h3>
                  <p className="text-white/70 mb-6">
                    Your transaction history will appear here once you make your first transaction.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {walletData.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-6 bg-gradient-to-r from-white/5 to-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:from-white/10 hover:to-white/10 transition-all duration-300 transform hover:scale-[1.02] group"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full relative ${
                          transaction.type === 'CREDIT' 
                            ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30' 
                            : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30'
                        }`}>
                          <div className={`absolute inset-0 rounded-full blur-lg opacity-50 ${
                            transaction.type === 'CREDIT' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}></div>
                          {transaction.type === 'CREDIT' ? (
                            <ArrowDownLeft className="relative h-5 w-5 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="relative h-5 w-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white group-hover:text-white/90 transition-colors duration-300">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold text-lg ${
                          transaction.type === 'CREDIT' 
                            ? 'bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent' 
                            : 'bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent'
                        }`}>
                          {transaction.type === 'CREDIT' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                        </p>
                        <div className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          transaction.status === 'COMPLETED' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          transaction.status === 'PENDING' 
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {transaction.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
