import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { MatchmakingService } from '@/lib/matchmaking'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const queueStatus = MatchmakingService.getQueueStatus(session.user.id)
    
    return NextResponse.json({
      inQueue: queueStatus.inQueue,
      position: queueStatus.position,
      estimatedWaitTime: queueStatus.estimatedWaitTime,
      matchFound: queueStatus.matchId ? true : false,
      matchId: queueStatus.matchId
    })
  } catch (error) {
    console.error('Queue status error:', error)
    return NextResponse.json(
      { message: 'Failed to get queue status' },
      { status: 500 }
    )
  }
}
