import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test basic database operations
    const tests = []
    
    // Test 1: Check database connection
    const userCount = await prisma.user.count()
    tests.push({
      test: 'Database Connection',
      status: 'PASS',
      result: `Connected successfully. Users: ${userCount}`
    })
    
    // Test 2: Create a test user (if not exists)
    const testEmail = 'test@sudoku.com'
    let testUser = await prisma.user.findUnique({
      where: { email: testEmail }
    })
    
    if (!testUser) {
      const bcrypt = await import('bcryptjs')
      const hashedPassword = await bcrypt.hash('testpass123', 12)
      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: testEmail,
          password: hashedPassword,
          walletBalance: 1000
        }
      })
      tests.push({
        test: 'User Creation',
        status: 'PASS',
        result: `Test user created with ID: ${testUser.id}`
      })
    } else {
      tests.push({
        test: 'User Creation',
        status: 'SKIP',
        result: `Test user already exists with ID: ${testUser.id}`
      })
    }
    
    // Test 3: Create a test match
    const existingMatch = await prisma.match.findFirst({
      where: { player1Id: testUser.id, status: 'WAITING' }
    })
    
    if (!existingMatch) {
      const testMatch = await prisma.match.create({
        data: {
          type: 'MULTIPLAYER_FREE',
          status: 'WAITING',
          player1Id: testUser.id,
          sudokuGrid: JSON.stringify(Array(9).fill(null).map(() => Array(9).fill(0))),
          entryFee: 0
        }
      })
      tests.push({
        test: 'Match Creation',
        status: 'PASS',
        result: `Test match created with ID: ${testMatch.id}`
      })
    } else {
      tests.push({
        test: 'Match Creation',
        status: 'SKIP',
        result: `Test match already exists with ID: ${existingMatch.id}`
      })
    }
    
    return NextResponse.json({
      status: 'success',
      message: 'Database tests completed',
      tests,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Database tests failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
