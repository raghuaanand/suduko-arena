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
  User
} from 'lucide-react';

export default function Home() {
  const [demoGrid] = useState(() => generatePuzzle('medium').puzzle);
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* Header */}
      <header className="w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Sudoku Arena
              </h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {session && (
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <Wallet className="w-4 h-4 mr-2" />
                  ₹0.00
                </Button>
              )}
              {session ? (
                <Link href="/dashboard">
                  <Button size="sm" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Master Sudoku.
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Win Prizes.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-2xl mx-auto lg:mx-0">
              Join the ultimate Sudoku battleground. Play against AI, challenge friends, 
              or compete in tournaments with real cash prizes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {session ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Play className="w-5 h-5 mr-2" />
                    Start Playing
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Play className="w-5 h-5 mr-2" />
                    Start Playing
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="lg">
                Watch Demo
              </Button>
            </div>
          </div>
          
          {/* Demo Sudoku Grid */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-2xl border border-gray-200 dark:border-gray-700">
                <SudokuGridComponent
                  grid={demoGrid}
                  isReadonly={true}
                  className="w-64 sm:w-80"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Battle
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Multiple ways to test your Sudoku skills and win exciting rewards
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {/* Single Player */}
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200 dark:hover:border-blue-800">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-bl-full opacity-10"></div>
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">Single Player</CardTitle>
              </div>
              <CardDescription>
                Challenge our AI opponents across different difficulty levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Zap className="w-4 h-4 mr-2 text-green-500" />
                  Practice mode
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Timer className="w-4 h-4 mr-2 text-orange-500" />
                  Timed challenges
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                  Achievement system
                </li>
              </ul>
              <Link href={session ? "/dashboard?mode=ai" : "/auth/signin"}>
                <Button className="w-full" variant="outline">
                  Play vs AI
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Multiplayer Free */}
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-200 dark:hover:border-green-800">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-bl-full opacity-10"></div>
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl">Multiplayer Free</CardTitle>
              </div>
              <CardDescription>
                Battle friends and players worldwide in real-time matches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Users className="w-4 h-4 mr-2 text-blue-500" />
                  1v1 matches
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Zap className="w-4 h-4 mr-2 text-purple-500" />
                  Real-time gameplay
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                  Ranking system
                </li>
              </ul>
              <Link href={session ? "/dashboard?mode=multiplayer" : "/auth/signin"}>
                <Button className="w-full" variant="outline">
                  Find Match
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Paid Competitions */}
          <Card className="relative overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-200 dark:hover:border-purple-800">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-bl-full opacity-10"></div>
            <CardHeader>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl">Competitions</CardTitle>
              </div>
              <CardDescription>
                Enter paid tournaments and win real cash prizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Crown className="w-4 h-4 mr-2 text-gold-500" />
                  Cash prizes
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Timer className="w-4 h-4 mr-2 text-red-500" />
                  Tournament brackets
                </li>
                <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <Wallet className="w-4 h-4 mr-2 text-green-500" />
                  Secure payments
                </li>
              </ul>
              <Link href={session ? "/tournaments" : "/auth/signin"}>
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  View Tournaments
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gray-50 dark:bg-gray-800/50 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                10K+
              </div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Active Players
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                ₹50L+
              </div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Prizes Won
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                1M+
              </div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Games Played
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                24/7
              </div>
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                Live Matches
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Sudoku Arena
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 Sudoku Arena. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
