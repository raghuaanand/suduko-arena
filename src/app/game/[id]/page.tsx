'use client'

import { GameRoom } from '@/components/GameRoom'
import { SocketProvider } from '@/contexts/SocketContext'
import { use } from 'react'

interface GamePageProps {
  params: Promise<{
    id: string
  }>
}

export default function GamePage({ params }: GamePageProps) {
  const { id } = use(params)
  
  return (
    <SocketProvider>
      <GameRoom matchId={id} />
    </SocketProvider>
  )
}
