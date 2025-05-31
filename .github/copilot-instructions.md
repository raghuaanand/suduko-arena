<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Sudoku Arena - Copilot Instructions

This is a multiplayer Sudoku platform built with Next.js 15, TypeScript, and Supabase.

## Project Overview
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Styling**: Tailwind CSS (responsive design for all screen sizes)
- **Authentication**: NextAuth.js
- **Real-time**: Socket.IO
- **Payments**: Razorpay
- **State Management**: React Context + React Query
- **Forms**: React Hook Form + Zod

## Key Features
1. Single player vs AI
2. Multiplayer free mode (1v1)
3. Paid competitions with entry fees
4. Real-time gameplay
5. Wallet management
6. Admin panel

## Development Guidelines
- Use TypeScript for all components and utilities
- Implement responsive design for mobile, tablet, and desktop
- Follow Next.js 15 App Router conventions
- Use Prisma for database operations
- Implement proper error handling and validation
- Use React Hook Form with Zod for form validation
- Maintain clean component architecture with proper separation of concerns

## Database Schema
The project uses the schema defined in the project documentation with User, Match, and Transaction models supporting various match types and transaction types.

## UI/UX Requirements
- Mobile-first responsive design
- Modern and clean interface
- Real-time updates for multiplayer games
- Intuitive Sudoku grid interface
- Clear game status indicators
- Wallet and transaction management UI
