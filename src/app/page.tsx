'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SudokuGridComponent } from '@/components/sudoku/SudokuGrid';
import { generatePuzzle } from '@/utils/sudoku';
import { 
  Trophy, 
  Users, 
  Bot, 
  Wallet, 
  Play, 
  Crown,
  Timer,
  Target,
  Zap,
  User,
  Star,
  Sparkles,
  Gamepad2,
  Award
} from 'lucide-react';

export default function Home() {
  const [demoGrid] = useState(() => generatePuzzle('medium').puzzle);
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
      {/* Dynamic Cosmic Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary cosmic orbs */}
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-r from-[#e94560]/30 to-[#f9ed69]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-l from-[#0f3460]/40 to-[#e94560]/25 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-t from-[#f9ed69]/20 to-[#16213e]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Floating star particles */}
        <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-[#f9ed69] rounded-full animate-ping opacity-80 shadow-lg shadow-[#f9ed69]/50"></div>
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-[#e94560] rounded-full animate-ping opacity-90 shadow-lg shadow-[#e94560]/50" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-2.5 h-2.5 bg-[#0f3460] rounded-full animate-ping opacity-75 shadow-lg shadow-[#0f3460]/50" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-[#f9ed69] rounded-full animate-ping opacity-85" style={{animationDelay: '5s'}}></div>
        <div className="absolute top-1/6 left-2/3 w-2 h-2 bg-[#e94560] rounded-full animate-ping opacity-70" style={{animationDelay: '2.5s'}}></div>
        
        {/* Additional cosmic elements */}
        <div className="absolute top-1/2 left-10 w-1 h-20 bg-gradient-to-b from-[#f9ed69] to-transparent opacity-30 animate-pulse transform rotate-45"></div>
        <div className="absolute bottom-1/3 right-20 w-1 h-16 bg-gradient-to-t from-[#e94560] to-transparent opacity-40 animate-pulse transform -rotate-12" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* Header */}
      <header className="w-full border-b border-[#e94560]/30 bg-[#1a1a2e]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#e94560] to-[#f9ed69] rounded-lg flex items-center justify-center shadow-lg animate-pulse">
                <Target className="w-5 h-5 text-[#1a1a2e]" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#f9ed69]">
                  Sudoku Arena
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {session && (
                <Button variant="ghost" size="sm" className="hidden sm:flex text-[#e94560] hover:text-white hover:bg-[#e94560]/20 border border-[#e94560]/30">
                  <Wallet className="w-4 h-4 mr-2" />
                  ₹0.00
                </Button>
              )}
              {session ? (
                <Link href="/dashboard">
                  <Button size="sm" className="bg-gradient-to-r from-[#e94560] to-[#f9ed69] hover:from-[#d63847] hover:to-[#f7e742] text-[#1a1a2e] border-0 shadow-lg font-semibold">
                    <User className="w-4 h-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm" className="text-[#e94560] hover:text-white hover:bg-[#e94560]/20">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm" className="bg-gradient-to-r from-[#f9ed69] to-[#e94560] hover:from-[#f7e742] hover:to-[#d63847] text-[#1a1a2e] border-0 font-semibold shadow-lg">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/20 border border-[#e94560]/40 rounded-full text-[#f9ed69] text-sm font-medium backdrop-blur-sm animate-pulse">
                🌌 Welcome to the Cosmic Arena
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight">
              Master the
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#f9ed69] via-[#e94560] to-[#f9ed69] animate-pulse">
                Celestial Sudoku
              </span>
              <span className="text-[#e94560]">Universe</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 mb-8 sm:mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Embark on an epic journey through the cosmic realm where logic meets stellar strategy. 
              Battle AI constellations, duel cosmic warriors, and compete for galactic supremacy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {session ? (
                <Link href="/dashboard">
                  <Button size="xl" className="bg-gradient-to-r from-[#f9ed69] to-[#e94560] hover:from-[#f7e742] hover:to-[#d63847] text-[#1a1a2e] border-0 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse">
                    <Play className="w-6 h-6 mr-2" />
                    Launch into Space
                    <span className="ml-2">🚀</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button size="xl" className="bg-gradient-to-r from-[#f9ed69] to-[#e94560] hover:from-[#f7e742] hover:to-[#d63847] text-[#1a1a2e] border-0 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse">
                    <Play className="w-6 h-6 mr-2" />
                    Launch into Space
                    <span className="ml-2">🚀</span>
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="xl" className="border-[#0f3460] text-[#f9ed69] hover:bg-[#0f3460]/20 hover:text-white backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f3460]/0 via-[#e94560]/10 to-[#0f3460]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Sparkles className="w-5 h-5 mr-2" />
                Watch Cosmic Demo
                <span className="ml-2">✨</span>
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-12 pt-8 border-t border-[#e94560]/30">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[#f9ed69] mb-1">50K+</div>
                <div className="text-sm text-white/70">Cosmic Battles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[#f9ed69] mb-1">₹5M+</div>
                <div className="text-sm text-white/70">Stellar Rewards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-[#f9ed69] mb-1">1K+</div>
                <div className="text-sm text-white/70">Daily Explorers</div>
              </div>
            </div>
          </div>
          
          {/* Demo Sudoku Grid */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Cosmic glow effects */}
              <div className="absolute -inset-8 bg-gradient-to-r from-[#e94560] via-[#f9ed69] to-[#0f3460] rounded-3xl blur-2xl opacity-40 animate-pulse"></div>
              <div className="absolute -inset-4 bg-gradient-to-r from-[#f9ed69] to-[#e94560] rounded-2xl blur-xl opacity-50"></div>
              
              {/* Grid container */}
              <div className="relative bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 rounded-2xl p-6 shadow-2xl border border-[#e94560]/50 backdrop-blur-md">
                <div className="absolute top-2 left-2 w-3 h-3 bg-[#f9ed69] rounded-full animate-ping"></div>
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#e94560] rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-2 left-1/2 w-2 h-2 bg-[#0f3460] rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
                
                <SudokuGridComponent
                  grid={demoGrid}
                  isReadonly={true}
                  className="w-72 sm:w-80 drop-shadow-xl"
                />
                
                {/* Cosmic overlay text */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                  <span className="text-[#f9ed69] text-sm font-medium bg-[#1a1a2e]/80 px-3 py-1 rounded-full border border-[#f9ed69]/30">
                    🌟 Stellar Puzzle
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/20 border border-[#e94560]/30 rounded-full text-[#f9ed69] text-sm font-medium backdrop-blur-sm">
              ⚔️ Choose Your Destiny
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f9ed69] to-[#e94560]">
              Cosmic Battle Modes
            </span>
          </h2>
          <p className="text-lg text-white/80 max-w-3xl mx-auto leading-relaxed">
            Each path offers unique challenges and stellar rewards. Choose your destiny among the stars.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          {/* Single Player - Cosmic Training */}
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-2 border-[#e94560]/30 hover:border-[#e94560]/60 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e94560]/30 to-[#f9ed69]/20 rounded-bl-full opacity-60"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#f9ed69] rounded-full animate-ping"></div>
            
            <CardHeader className="relative z-10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#e94560] to-[#f9ed69] rounded-xl flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-[#1a1a2e]" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white font-bold">Cosmic Training</CardTitle>
                  <div className="text-sm text-[#f9ed69] font-medium">Solo Quest</div>
                </div>
              </div>
              <CardDescription className="text-white/80 leading-relaxed">
                Train with stellar AI guardians across different cosmic difficulty realms
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-white/90">
                  <Star className="w-3 h-3 text-[#f9ed69] mr-3" />
                  Rookie to Master levels
                </li>
                <li className="flex items-center text-sm text-white/90">
                  <Timer className="w-3 h-3 text-[#f9ed69] mr-3" />
                  Timed cosmic challenges
                </li>
                <li className="flex items-center text-sm text-white/90">
                  <Award className="w-3 h-3 text-[#f9ed69] mr-3" />
                  Stellar achievements
                </li>
              </ul>
              <Link href={session ? "/dashboard?mode=ai" : "/auth/signin"}>
                <Button className="w-full bg-gradient-to-r from-[#e94560] to-[#f9ed69] hover:from-[#d63847] hover:to-[#f7e742] text-[#1a1a2e] border-0 font-semibold shadow-lg group-hover:shadow-xl transform transition-all duration-300">
                  <Bot className="w-4 h-4 mr-2" />
                  Begin Training
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Multiplayer Free - Stellar Duels */}
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-2 border-[#0f3460]/30 hover:border-[#0f3460]/60 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#0f3460]/30 to-[#e94560]/20 rounded-bl-full opacity-60"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#0f3460] rounded-full animate-ping"></div>
            
            <CardHeader className="relative z-10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0f3460] to-[#e94560] rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white font-bold">Stellar Duels</CardTitle>
                  <div className="text-sm text-[#f9ed69] font-medium">Free Combat</div>
                </div>
              </div>
              <CardDescription className="text-white/80 leading-relaxed">
                Challenge fellow space warriors in real-time cosmic battles across the galaxy
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-white/90">
                  <Zap className="w-3 h-3 text-[#f9ed69] mr-3" />
                  1v1 stellar duels
                </li>
                <li className="flex items-center text-sm text-white/90">
                  <Gamepad2 className="w-3 h-3 text-[#f9ed69] mr-3" />
                  Real-time cosmic action
                </li>
                <li className="flex items-center text-sm text-white/90">
                  <Trophy className="w-3 h-3 text-[#f9ed69] mr-3" />
                  Galactic ranking system
                </li>
              </ul>
              <Link href={session ? "/dashboard?mode=multiplayer" : "/auth/signin"}>
                <Button className="w-full bg-gradient-to-r from-[#0f3460] to-[#e94560] hover:from-[#0a2850] hover:to-[#d63847] text-white border-0 font-semibold shadow-lg group-hover:shadow-xl transform transition-all duration-300">
                  <Users className="w-4 h-4 mr-2" />
                  Find Opponent
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Paid Competitions - Galactic Championships */}
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-500 border-2 border-[#f9ed69]/50 hover:border-[#f9ed69]/80 bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 backdrop-blur-md transform hover:scale-105">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#f9ed69]/40 to-[#e94560]/20 rounded-bl-full opacity-60"></div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#f9ed69] rounded-full animate-ping"></div>
            
            {/* Premium badge */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-[#f9ed69] to-[#e94560] text-[#1a1a2e] text-xs font-bold px-2 py-1 rounded-full">
              PREMIUM
            </div>
            
            <CardHeader className="relative z-10">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="w-6 h-6 text-[#1a1a2e]" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white font-bold">Galactic Championships</CardTitle>
                  <div className="text-sm text-[#f9ed69] font-medium">Epic Prizes</div>
                </div>
              </div>
              <CardDescription className="text-white/80 leading-relaxed">
                Enter high-stakes tournaments and compete for cosmic treasure and eternal glory
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-sm text-white/90">
                  <Sparkles className="w-3 h-3 text-[#f9ed69] mr-3" />
                  Real cosmic rewards
                </li>
                <li className="flex items-center text-sm text-white/90">
                  <Target className="w-3 h-3 text-[#f9ed69] mr-3" />
                  Championship brackets
                </li>
                <li className="flex items-center text-sm text-white/90">
                  <Wallet className="w-3 h-3 text-[#f9ed69] mr-3" />
                  Secure stellar vaults
                </li>
              </ul>
              <Link href={session ? "/tournaments" : "/auth/signin"}>
                <Button className="w-full bg-gradient-to-r from-[#f9ed69] to-[#e94560] hover:from-[#f7e742] hover:to-[#d63847] text-[#1a1a2e] border-0 font-semibold shadow-lg group-hover:shadow-xl transform transition-all duration-300">
                  <Crown className="w-4 h-4 mr-2" />
                  View Tournaments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section className="bg-gradient-to-br from-[#16213e]/50 to-[#0f3460]/50 py-16 sm:py-20 backdrop-blur-md relative z-10 border-y border-[#e94560]/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f9ed69] to-[#e94560]">
                Why Choose Sudoku Arena?
              </span>
            </h3>
            <p className="text-white/70">Experience the ultimate competitive Sudoku platform</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="text-center p-6 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 rounded-xl border border-[#e94560]/30 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#e94560] to-[#f9ed69] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="w-6 h-6 text-[#1a1a2e]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#f9ed69] mb-2">50K+</div>
              <div className="text-sm text-white/80">Active Players</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 rounded-xl border border-[#e94560]/30 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Trophy className="w-6 h-6 text-[#1a1a2e]" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#f9ed69] mb-2">₹10M+</div>
              <div className="text-sm text-white/80">Prize Pool</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 rounded-xl border border-[#e94560]/30 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0f3460] to-[#e94560] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#f9ed69] mb-2">2K+</div>
              <div className="text-sm text-white/80">Daily Battles</div>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 rounded-xl border border-[#e94560]/30 backdrop-blur-sm transform hover:scale-105 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-[#e94560] to-[#0f3460] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-[#f9ed69] mb-2">99.9%</div>
              <div className="text-sm text-white/80">Uptime</div>
            </div>
          </div>
          
          {/* Additional Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
            <div className="flex items-start space-x-4 p-6 bg-gradient-to-br from-[#1a1a2e]/40 to-[#16213e]/40 rounded-xl border border-[#e94560]/20 backdrop-blur-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-[#f9ed69] to-[#e94560] rounded-lg flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-[#1a1a2e]" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Lightning Fast</h4>
                <p className="text-white/70 text-sm">Real-time gameplay with millisecond precision for the ultimate competitive experience.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-6 bg-gradient-to-br from-[#1a1a2e]/40 to-[#16213e]/40 rounded-xl border border-[#e94560]/20 backdrop-blur-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-[#e94560] to-[#0f3460] rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Smart Matchmaking</h4>
                <p className="text-white/70 text-sm">Advanced algorithms pair you with players of similar skill levels for fair competition.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-6 bg-gradient-to-br from-[#1a1a2e]/40 to-[#16213e]/40 rounded-xl border border-[#e94560]/20 backdrop-blur-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0f3460] to-[#f9ed69] rounded-lg flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-[#1a1a2e]" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Secure Payments</h4>
                <p className="text-white/70 text-sm">Bank-grade security for all transactions with instant withdrawals and deposits.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] via-[#e94560]/10 to-[#1a1a2e]"></div>
        <div className="absolute inset-0">
          {/* Animated cosmic elements */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-[#f9ed69]/20 to-[#e94560]/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-l from-[#0f3460]/30 to-[#f9ed69]/20 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#f9ed69] rounded-full animate-ping"></div>
          <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-[#e94560] rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-[#0f3460] rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="inline-block px-6 py-3 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/20 border border-[#e94560]/40 rounded-full text-[#f9ed69] text-sm font-medium backdrop-blur-sm animate-pulse">
                🚀 Ready for the Ultimate Challenge?
              </span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f9ed69] via-[#e94560] to-[#f9ed69] animate-pulse">
                Join the Cosmic Battle
              </span>
              <br />
              <span className="text-white">Today!</span>
            </h2>
            
            <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Don't let this stellar opportunity slip away. Start your journey to become the ultimate Sudoku champion across the galaxy.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              {session ? (
                <Link href="/dashboard">
                  <Button size="xl" className="bg-gradient-to-r from-[#f9ed69] to-[#e94560] hover:from-[#f7e742] hover:to-[#d63847] text-[#1a1a2e] border-0 font-bold text-lg px-8 py-4 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 animate-pulse">
                    <Play className="w-6 h-6 mr-3" />
                    Enter the Arena Now
                    <span className="ml-3">⚡</span>
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signup">
                    <Button size="xl" className="bg-gradient-to-r from-[#f9ed69] to-[#e94560] hover:from-[#f7e742] hover:to-[#d63847] text-[#1a1a2e] border-0 font-bold text-lg px-8 py-4 shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300 animate-pulse">
                      <Play className="w-6 h-6 mr-3" />
                      Start Your Journey
                      <span className="ml-3">🚀</span>
                    </Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button variant="outline" size="xl" className="border-2 border-[#0f3460] text-[#f9ed69] hover:bg-[#0f3460]/20 hover:text-white backdrop-blur-sm relative overflow-hidden group text-lg px-8 py-4">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0f3460]/0 via-[#e94560]/10 to-[#0f3460]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <User className="w-6 h-6 mr-3" />
                      Sign In
                      <span className="ml-3">⭐</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Trust indicators */}
            <div className="mt-12 pt-8 border-t border-[#e94560]/20">
              <div className="flex flex-wrap justify-center items-center gap-8 text-white/60">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#f9ed69] rounded-full animate-pulse"></div>
                  <span className="text-sm">Trusted by 50K+ players</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#e94560] rounded-full animate-pulse"></div>
                  <span className="text-sm">₹10M+ in rewards distributed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#0f3460] rounded-full animate-pulse"></div>
                  <span className="text-sm">99.9% uptime guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e94560]/30 bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-md py-12 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#e94560] to-[#f9ed69] rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-[#1a1a2e]" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#e94560] to-[#f9ed69]">
                    Sudoku Arena
                  </span>
                </h3>
              </div>
              <p className="text-white/70 mb-4 max-w-md">
                The ultimate competitive Sudoku platform. Battle AI, challenge players worldwide, 
                and compete for stellar rewards in the cosmic arena.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-[#e94560]/20 border border-[#e94560]/30 rounded-lg flex items-center justify-center hover:bg-[#e94560]/40 transition-colors cursor-pointer">
                  <div className="w-4 h-4 bg-[#f9ed69] rounded-sm"></div>
                </div>
                <div className="w-8 h-8 bg-[#0f3460]/20 border border-[#0f3460]/30 rounded-lg flex items-center justify-center hover:bg-[#0f3460]/40 transition-colors cursor-pointer">
                  <div className="w-4 h-4 bg-[#f9ed69] rounded-sm"></div>
                </div>
                <div className="w-8 h-8 bg-[#f9ed69]/20 border border-[#f9ed69]/30 rounded-lg flex items-center justify-center hover:bg-[#f9ed69]/40 transition-colors cursor-pointer">
                  <div className="w-4 h-4 bg-[#e94560] rounded-sm"></div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Game Modes</h4>
              <ul className="space-y-2">
                <li><Link href="/dashboard?mode=ai" className="text-white/70 hover:text-[#f9ed69] transition-colors">Single Player</Link></li>
                <li><Link href="/dashboard?mode=multiplayer" className="text-white/70 hover:text-[#f9ed69] transition-colors">Multiplayer</Link></li>
                <li><Link href="/tournaments" className="text-white/70 hover:text-[#f9ed69] transition-colors">Tournaments</Link></li>
                <li><Link href="/leaderboard" className="text-white/70 hover:text-[#f9ed69] transition-colors">Leaderboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-white/70 hover:text-[#f9ed69] transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="text-white/70 hover:text-[#f9ed69] transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="text-white/70 hover:text-[#f9ed69] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white/70 hover:text-[#f9ed69] transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-[#e94560]/20 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-white/60 text-sm mb-4 md:mb-0">
              © 2024 Sudoku Arena. All rights reserved.
            </div>
            <div className="flex items-center space-x-6">
              <span className="text-white/60 text-sm">Made with</span>
              <div className="w-4 h-4 bg-gradient-to-r from-[#e94560] to-[#f9ed69] rounded-full animate-pulse"></div>
              <span className="text-white/60 text-sm">for cosmic warriors</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
