import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check
    const timestamp = new Date().toISOString()
    const uptime = process.uptime()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp,
      uptime: Math.floor(uptime),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    })
  } catch {
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed'
      },
      { status: 500 }
    )
  }
}
