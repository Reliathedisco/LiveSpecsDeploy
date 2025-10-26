# LiveSpecs

A real-time collaborative API design platform built with Next.js 16, Prisma, Clerk, and Liveblocks.

## Features

- **Real-time Collaboration**: Work together with your team using Liveblocks
- **Monaco Editor**: Professional code editing experience for OpenAPI/Swagger specs
- **AI Assistant**: Get help with API design using GPT-4o-mini
- **Version Control**: Track changes and manage spec versions
- **Mock Servers**: Generate mock endpoints from your API specs
- **Authentication**: Secure user management with Clerk
- **Database**: PostgreSQL with Prisma ORM

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account (for authentication)
- OpenAI API key (optional, for AI assistant)
- Liveblocks account (optional, for real-time collaboration)

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/Reliathedisco/LiveSpecs.git
cd LiveSpecs
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` and add your credentials:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`: From Clerk dashboard
- `OPENAI_API_KEY`: From OpenAI (optional)
- `LIVEBLOCKS_SECRET_KEY`: From Liveblocks (optional)

4. Set up the database:
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3001](http://localhost:3001) in your browser

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma
- **Authentication**: Clerk
- **Real-time**: Liveblocks
- **Editor**: Monaco Editor
- **AI**: Vercel AI SDK with OpenAI
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui

## Project Structure

\`\`\`
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard and editor pages
│   ├── sign-in/          # Authentication pages
│   ├── sign-up/
│   └── page.tsx          # Landing page
├── components/
│   ├── editor/           # Editor components
│   ├── ui/               # UI components (shadcn)
│   └── SimpleAIChat.tsx  # AI assistant
├── lib/
│   ├── db.ts             # Prisma client
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
└── middleware.ts         # Auth middleware
\`\`\`

## Environment Variables

See `.env.example` for all required environment variables.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Database Setup

For production, use a managed PostgreSQL service like:
- Vercel Postgres
- Neon
- Supabase
- Railway

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
