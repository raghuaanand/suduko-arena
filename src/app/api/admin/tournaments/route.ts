import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TournamentStatus, Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
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

    const { 
      name, 
      description, 
      entryFee, 
      maxParticipants, 
      startTime,
      prizes 
    } = await request.json()

    if (!name || !entryFee || !maxParticipants || !startTime) {
      return NextResponse.json({ 
        error: 'Name, entry fee, max participants, and start time are required' 
      }, { status: 400 })
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description,
        entryFee,
        maxParticipants,
        startTime: new Date(startTime),
        prizes: prizes || {},
        status: 'REGISTRATION_OPEN',
        createdById: session.user.id
      }
    })

    return NextResponse.json(tournament)
  } catch (error) {
    console.error('Admin create tournament error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status') as TournamentStatus | null
    
    const skip = (page - 1) * limit

    const where: Prisma.TournamentWhereInput = {
      ...(status && { status })
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { participants: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.tournament.count({ where })
    ])

    return NextResponse.json({
      tournaments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Admin tournaments error:', error)
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

    const { tournamentId, action } = await request.json()

    if (!tournamentId || !action) {
      return NextResponse.json({ error: 'Tournament ID and action are required' }, { status: 400 })
    }

    switch (action) {
      case 'start':
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { status: 'IN_PROGRESS' }
        })
        return NextResponse.json({ message: 'Tournament started successfully' })

      case 'cancel':
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { status: 'CANCELLED' }
        })
        return NextResponse.json({ message: 'Tournament cancelled successfully' })

      case 'complete':
        await prisma.tournament.update({
          where: { id: tournamentId },
          data: { status: 'COMPLETED' }
        })
        return NextResponse.json({ message: 'Tournament completed successfully' })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Admin tournament action error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
