import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { MatchmakingService } from '@/lib/matchmaking'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const queueStatus = MatchmakingService.getQueueStatus(session.user.id)
    
    if (!queueStatus) {
      return NextResponse.json(
        { message: 'Queue status not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      position: queueStatus.position,
      waitTime: queueStatus.waitTime,
      skillRating: queueStatus.skillRating,
      currentSkillRange: queueStatus.currentSkillRange,
      potentialOpponents: queueStatus.potentialOpponents,
      estimatedTime: queueStatus.estimatedTime
    })
  } catch (error) {
    console.error('Queue status error:', error)
    return NextResponse.json(
      { message: 'Failed to get queue status' },
      { status: 500 }
    )
  }
}
