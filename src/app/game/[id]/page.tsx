'use client'

import { GameRoom } from '@/components/GameRoom'
import { SocketProvider } from '@/contexts/SocketContext'

interface GamePageProps {
  params: {
    id: string
  }
}

export default function GamePage({ params }: GamePageProps) {
  const { id } = params
  
  return (
    <SocketProvider>
      <GameRoom matchId={id} />
    </SocketProvider>
  )
}
