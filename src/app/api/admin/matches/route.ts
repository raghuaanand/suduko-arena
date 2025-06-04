import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MatchStatus, MatchType, Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    })

    const isAdmin = user?.email?.includes('admin') || false
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    
    const skip = (page - 1) * limit

    const where: Prisma.MatchWhereInput = {}
    if (status && Object.values(MatchStatus).includes(status as MatchStatus)) {
      where.status = status as MatchStatus
    }
    if (type && Object.values(MatchType).includes(type as MatchType)) {
      where.type = type as MatchType
    }

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          player1: {
            select: { id: true, name: true, email: true }
          },
          player2: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.match.count({ where })
    ])

    return NextResponse.json({
      matches,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin matches error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true }
    })

    const isAdmin = user?.email?.includes('admin') || false
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { matchId, action } = await request.json()

    if (!matchId || !action) {
      return NextResponse.json({ error: 'Match ID and action are required' }, { status: 400 })
    }

    switch (action) {
      case 'cancel':
        await prisma.match.update({
          where: { id: matchId },
          data: { status: 'CANCELLED' }
        })
        return NextResponse.json({ message: 'Match cancelled successfully' })

      case 'complete':
        await prisma.match.update({
          where: { id: matchId },
          data: { status: 'FINISHED' }
        })
        return NextResponse.json({ message: 'Match completed successfully' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin match action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
