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
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] relative overflow-hidden">
      {/* Cosmic Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-80 h-80 bg-gradient-to-r from-[#e94560]/20 to-[#f9ed69]/15 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-l from-[#0f3460]/40 to-[#e94560]/25 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-t from-[#f9ed69]/20 to-[#16213e]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{animationDelay: '4s'}}></div>
        
        {/* Floating star particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#f9ed69] rounded-full animate-ping opacity-70"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-[#e94560] rounded-full animate-ping opacity-80" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-[#0f3460] rounded-full animate-ping opacity-60" style={{animationDelay: '3s'}}></div>
      </div>

      <div className="relative z-10">
        <SocketProvider>
          <GameRoom matchId={id} />
        </SocketProvider>
      </div>
    </div>
  )
}
