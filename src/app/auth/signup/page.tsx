'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Github, Mail, Eye, EyeOff, Target, User, Play, Sparkles } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpForm = z.infer<typeof signUpSchema>

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true)
    try {
      // Create user account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        setError('root', {
          type: 'manual',
          message: error.message || 'Failed to create account',
        })
        return
      }

      // Sign in the user after successful registration
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('root', {
          type: 'manual',
          message: 'Account created but failed to sign in. Please try signing in manually.',
        })
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('root', {
        type: 'manual',
        message: 'An error occurred. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    try {
      await signIn(provider, { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('OAuth sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden flex items-center justify-center p-4">
      {/* Cosmic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-80 h-80 bg-gradient-to-l from-[#f9ed69]/20 to-[#e94560]/15 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-gradient-to-r from-[#0f3460]/30 to-[#f9ed69]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {/* Floating star particles */}
        <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-[#e94560] rounded-full animate-ping opacity-70"></div>
        <div className="absolute top-1/4 right-1/3 w-1 h-1 bg-[#f9ed69] rounded-full animate-ping opacity-80" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-[#0f3460] rounded-full animate-ping opacity-60" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-xl flex items-center justify-center shadow-lg animate-pulse">
              <Target className="w-7 h-7 text-[#1a1a2e]" />
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f9ed69] to-[#e94560]">
              Sudoku Arena
            </h1>
          </div>
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#f9ed69]/20 to-[#e94560]/20 border border-[#f9ed69]/30 rounded-full text-[#f9ed69] text-sm font-medium backdrop-blur-sm">
              🚀 Join the Cosmic Adventure
            </span>
          </div>
          <p className="text-white/80 text-lg">
            Begin your stellar journey today
          </p>
        </div>

        <Card className="relative overflow-hidden border-2 border-[#f9ed69]/30 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md shadow-2xl">
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#f9ed69] to-[#e94560] rounded-2xl blur opacity-20"></div>
          <div className="absolute top-2 left-2 w-2 h-2 bg-[#e94560] rounded-full animate-ping"></div>
          <div className="absolute bottom-2 right-2 w-1 h-1 bg-[#f9ed69] rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl text-white font-bold text-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f9ed69] to-[#e94560]">
                Create Your Legend
              </span>
            </CardTitle>
            <CardDescription className="text-white/70 text-center text-base">
              Choose your path to become a cosmic champion
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            {/* OAuth Buttons */}
            <div className="space-y-4">
              <Button
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#f9ed69]/10 to-[#e94560]/10 hover:from-[#f9ed69]/20 hover:to-[#e94560]/20 text-white border-2 border-[#f9ed69]/30 hover:border-[#f9ed69]/50 backdrop-blur-sm transition-all duration-300 h-12"
                variant="outline"
              >
                <Mail className="w-5 h-5 mr-3 text-[#f9ed69]" />
                Continue with Google
              </Button>
              <Button
                onClick={() => handleOAuthSignIn('github')}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#0f3460] to-[#16213e] hover:from-[#0a2850] hover:to-[#12192e] text-white border-2 border-[#0f3460]/50 hover:border-[#0f3460]/70 transition-all duration-300 h-12"
              >
                <Github className="w-5 h-5 mr-3" />
                Continue with GitHub
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#f9ed69]/30" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white/70">or</span>
              </div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="relative">
                <Input
                  {...register('name')}
                  type="text"
                  placeholder="Your cosmic name"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#1a1a2e]/50 border-[#f9ed69]/30 focus:border-[#e94560] text-white placeholder:text-white/50 backdrop-blur-sm pl-12"
                />
                <User className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#f9ed69]" />
                {errors.name && (
                  <p className="text-sm text-[#e94560] mt-2 flex items-center">
                    <span className="w-1 h-1 bg-[#e94560] rounded-full mr-2"></span>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="relative">
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Email address"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#1a1a2e]/50 border-[#f9ed69]/30 focus:border-[#e94560] text-white placeholder:text-white/50 backdrop-blur-sm pl-12"
                />
                <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#f9ed69]" />
                {errors.email && (
                  <p className="text-sm text-[#e94560] mt-2 flex items-center">
                    <span className="w-1 h-1 bg-[#e94560] rounded-full mr-2"></span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="relative">
                <Input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#1a1a2e]/50 border-[#f9ed69]/30 focus:border-[#e94560] text-white placeholder:text-white/50 backdrop-blur-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-[#f9ed69] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.password && (
                  <p className="text-sm text-[#e94560] mt-2 flex items-center">
                    <span className="w-1 h-1 bg-[#e94560] rounded-full mr-2"></span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="relative">
                <Input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  disabled={isLoading}
                  className="w-full h-12 bg-[#1a1a2e]/50 border-[#f9ed69]/30 focus:border-[#e94560] text-white placeholder:text-white/50 backdrop-blur-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-[#f9ed69] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {errors.confirmPassword && (
                  <p className="text-sm text-[#e94560] mt-2 flex items-center">
                    <span className="w-1 h-1 bg-[#e94560] rounded-full mr-2"></span>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {errors.root && (
                <div className="text-center p-3 bg-[#e94560]/10 border border-[#e94560]/30 rounded-lg">
                  <p className="text-sm text-[#e94560]">{errors.root.message}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#f9ed69] to-[#e94560] hover:from-[#f7e742] hover:to-[#d63847] text-[#1a1a2e] border-0 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-[#1a1a2e]/20 border-t-[#1a1a2e] rounded-full animate-spin mr-3"></div>
                    Creating your legend...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Create Account
                    <span className="ml-2">🚀</span>
                  </>
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center pt-4 border-t border-[#f9ed69]/20">
              <p className="text-white/70">
                Already a cosmic warrior?{' '}
                <Link
                  href="/auth/signin"
                  className="font-semibold text-[#f9ed69] hover:text-white transition-colors duration-300"
                >
                  Enter the arena
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
