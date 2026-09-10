# Business Launchpad

A comprehensive business planning and roadmap platform that guides entrepreneurs through launching and scaling their businesses in 90 days. Built with React, TypeScript, Vite, and Supabase.

## Features

- **🎯 Structured 90-Day Roadmap** – 8 business stages across 3 phases (Concept, Build & Comply, Commercialise)
- **🤖 AI-Powered Coaching** – Personalized guidance, document drafting, and problem validation scoring
- **📊 Lean Canvas Builder** – Interactive 9-block canvas for business model visualization
- **☁️ Cloud Sync** – Real-time progress sync across devices via Supabase
- **🔐 Secure Authentication** – Email/password auth with Supabase
- **📱 Fully Responsive** – Works seamlessly on desktop, tablet, and mobile
- **🎨 Modern UI** – TailwindCSS design with gradient accents and polished interactions

## Quick Start

### Prerequisites
- Node.js 18+ or Bun
- A Supabase project
- (Optional) OpenAI or Claude API key for AI coaching

### Installation

```bash
# Clone the repository
git clone https://github.com/baloyigranny0-hub/business-launchpad.git
cd business-launchpad

# Install dependencies
npm install
# or
bun install

# Create .env file with Supabase credentials
cp .env.example .env
# Edit .env with your Supabase project details
```

### Environment Variables

```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_URL=https://your-project.supabase.co
```

### Running Locally

```bash
# Start dev server
npm run dev

# App will be available at http://localhost:8080
```

### Building for Production

```bash
# Build the app
npm run build

# Preview the production build locally
npm run preview

# Deploy (see Deployment section)
```

## Project Structure

```
src/
├── pages/              # Page components for routing
│   ├── Auth.tsx       # Login/signup
│   ├── Intake.tsx     # 4-step onboarding
│   ├── Dashboard.tsx  # Main command center
│   ├── Canvas.tsx     # Lean Canvas editor
│   ├── Module.tsx     # Step detail view
│   ├── Validation.tsx # Problem scoring
│   ├── Roadmap.tsx    # Roadmap visualization
│   └── Settings.tsx   # User settings
├── components/        # Reusable React components
│   ├── AppShell.tsx   # Layout wrapper
│   ├── CoachDock.tsx  # AI assistant chat
│   └── ui/            # shadcn/ui components
├── lib/               # Core business logic
│   ├── store.ts       # Global state management
│   ├── roadmap.ts     # Roadmap structure & data
│   ├── coach.ts       # AI coaching API
│   ├── auth.tsx       # Authentication context
│   └── utils.ts       # Utility functions
├── hooks/             # Custom React hooks
├── integrations/      # External service integrations
│   └── supabase/      # Supabase client & types
├── App.tsx            # Main app component
└── main.tsx           # React DOM entry point
```

## Architecture

### State Management
- **Local Storage**: All state is persisted to `localStorage` for offline functionality
- **Cloud Sync**: State is debounced and synced to Supabase every 600ms
- **Custom Observer Pattern**: Lightweight pub/sub system for state updates

### Authentication Flow
1. User signs up/logs in via Supabase Auth (email/password)
2. `AuthProvider` manages session lifecycle
3. On app load, `CloudBinder` fetches user's workspace from Supabase
4. State merges cloud data with local state

### AI Coaching Pipeline
1. User completes onboarding intake
2. `analyzeIdea()` calls Supabase Edge Function with business context
3. AI scores problem statement, assigns phase, generates priorities
4. Results populate Lean Canvas and roadmap
5. User can ask follow-up questions via `CoachDock` chat
6. Can trigger document drafts for specific steps

### Database Schema

**workspaces table:**
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business JSONB NOT NULL DEFAULT '{}',
  completed JSONB NOT NULL DEFAULT '{}',
  notes JSONB NOT NULL DEFAULT '{}',
  lean_canvas JSONB NOT NULL DEFAULT '{}',
  plan JSONB NOT NULL DEFAULT '{}',
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own workspace
CREATE POLICY "users_can_access_own_workspace" ON workspaces
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Development

### Running Tests

```bash
npm run test        # Run all tests once
npm run test:watch  # Run tests in watch mode
```

### Linting

```bash
npm run lint  # Check code quality
```

### Building Components

This project uses shadcn/ui. To add new UI components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 8080
CMD ["npm", "run", "preview"]
```

## Supabase Setup

### 1. Create Workspace Table

Run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business JSONB NOT NULL DEFAULT '{}',
  completed JSONB NOT NULL DEFAULT '{}',
  notes JSONB NOT NULL DEFAULT '{}',
  lean_canvas JSONB NOT NULL DEFAULT '{}',
  plan JSONB NOT NULL DEFAULT '{}',
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_access_own_workspace" ON workspaces
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 2. Deploy AI Coach Edge Function

Create `supabase/functions/ai-coach/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

serve(async (req) => {
  const { action, context, question, history, target } = await req.json();

  if (action === "analyze") {
    return await analyzeIdea(context);
  } else if (action === "ask") {
    return await askCoach(question, history, context);
  } else if (action === "draft") {
    return await draftDocument(target, context);
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
});

async function analyzeIdea(context: any) {
  // Score business idea against PWS criteria
  // Generate phase assignment
  // Return priorities and canvas suggestions
  // See documentation for full implementation
}

async function askCoach(question: string, history: any[], context: any) {
  // Chat-based coaching with conversation history
  // See documentation for full implementation
}

async function draftDocument(target: string, context: any) {
  // Generate specific business documents
  // See documentation for full implementation
}
```

Deploy with:
```bash
supabase functions deploy ai-coach --project-id your-project-id
supabase secrets set OPENAI_API_KEY=your-api-key --project-id your-project-id
```

## API Reference

### Store API

```typescript
const { state, setBusiness, completeOnboarding, toggleStep, setNote, setCanvas, setAnalysis, reset } = useStore();

// state: Current app state
state.business        // Business profile
state.onboarded       // Onboarding completion status
state.completed       // Step completion flags
state.notes           // User notes per step
state.canvas          // Lean Canvas blocks
state.analysis        // AI analysis results

// Methods
setBusiness(partial)           // Update business profile
completeOnboarding()           // Mark onboarding as done
toggleStep(stageId, stepId)    // Toggle step completion
setNote(stageId, stepId, text) // Save step note
setCanvas(key, value)          // Update canvas block
setAnalysis(analysis)          // Save AI analysis
reset()                        // Reset to empty state
```

### Coach API

```typescript
import { analyzeIdea, askCoach, draftDocument } from "@/lib/coach";

// Analyze business idea (called after intake)
const analysis = await analyzeIdea();

// Ask the coach a question
const response = await askCoach(
  "How do I find my first customers?",
  conversationHistory
);

// Draft a document for a specific step
const draft = await draftDocument("executive-summary");
```

## Troubleshooting

### App won't compile
- **Check for syntax errors** in `src/App.tsx` (fixed in v1.0.1)
- Run `npm run lint` to catch TypeScript issues

### Coach not responding
- Verify Supabase Edge Function is deployed: `supabase functions list`
- Check function logs: `supabase functions download ai-coach --project-id your-project-id`
- Ensure `OPENAI_API_KEY` secret is set

### State not syncing to cloud
- Check browser console for Supabase errors
- Verify `workspaces` table exists and RLS policies are correct
- Ensure user is authenticated before sync attempts

### Environment variables not loading
- Restart dev server after updating `.env`
- Variables must be prefixed with `VITE_` to be available in browser

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] Multi-language support
- [ ] Team collaboration & shared workspaces
- [ ] Progress analytics & reporting
- [ ] Integration with payment processors
- [ ] Mobile app (React Native)
- [ ] Investor pitch deck generator
- [ ] Funding tracker

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, feature requests, or questions:
- Open an issue on GitHub
- Check existing issues first
- Provide clear reproduction steps

## Acknowledgments

- Built with [React](https://react.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Database & auth by [Supabase](https://supabase.com)
- Styling with [TailwindCSS](https://tailwindcss.com)
- Icons from [Lucide React](https://lucide.dev)
