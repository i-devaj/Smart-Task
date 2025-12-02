# Smart Task Evaluator

Smart Task Evaluator is an AI-powered web application that helps users refine and improve their task descriptions and code snippets. By leveraging Google's Gemini AI, it provides instant scores, summaries, and actionable recommendations to make tasks clearer and more executable. It also features a credit-based unlocking system for detailed reports.

## 🚀 Features

* **AI Evaluation:** Automatically analyzes tasks for clarity, feasibility, and completeness using Google Gemini AI.
* **Scoring System:** Assigns a 0-100 score to each task to gauge its quality instantly.
* **Actionable Feedback:** Provides specific strengths and concrete recommendations for improvement.
* **Authentication:** Secure user sign-up and login powered by Supabase Auth.
* **Dashboard:** A centralized hub to view active tasks, recent reports, and performance metrics.
* **Task Management:** Create, track, and manage recurring or one-off tasks.
* **Payment Integration:** A built-in flow (using dummy/Razorpay logic) to "unlock" premium, detailed reports.
* **Responsive Design:** Fully responsive UI built with Tailwind CSS and Shadcn/UI components.

## 🛠️ Tech Stack

* **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Components:** [Shadcn/UI](https://ui.shadcn.com/)
* **Backend & Auth:** [Supabase](https://supabase.com/)
* **AI Model:** [Google Gemini API](https://ai.google.dev/) (`gemini-1.5-flash`)
* **Icons:** [Lucide React](https://lucide.dev/)

## ⚙️ Prerequisites

Before running the project, ensure you have the following:

1.  **Node.js** (v18 or higher)
2.  A **Supabase** account (for database & auth)
3.  A **Google AI Studio** API Key (for Gemini)

## 📦 Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/smart-task-evaluator.git](https://github.com/your-username/smart-task-evaluator.git)
    cd smart-task-evaluator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add the following keys:

    ```env
    NEXT_PUBLIC_APP_URL=http://localhost:3000
    
    # Supabase Keys
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    
    # Google Gemini AI Key
    GEMINI_API_KEY=your_gemini_api_key
    GEMINI_MODEL=gemini-1.5-flash
    ```

## 🗄️ Database Setup (Supabase)

Run the following SQL in your Supabase **SQL Editor** to set up the required tables and security policies.

```sql
-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  code text NOT NULL,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  score integer,
  strengths jsonb,
  improvements jsonb,
  full_reports text,
  is_paid boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT evaluations_pkey PRIMARY KEY (id),
  CONSTRAINT evaluations_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  evaluation_id uuid NOT NULL,
  amount numeric,
  status text DEFAULT 'pending'::text,
  currency text DEFAULT 'INR',
  provider_session_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT payments_evaluation_id_fkey FOREIGN KEY (evaluation_id) REFERENCES public.evaluations(id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 3. Add RLS Policies
-- Tasks: Users manage their own tasks
CREATE POLICY "Users can manage their own tasks" ON public.tasks
USING (auth.uid() = user_id);

-- Evaluations: Link to tasks owned by the user
CREATE POLICY "Allow insert for task owners" ON public.evaluations FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = evaluations.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Allow read for task owners" ON public.evaluations FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = evaluations.task_id AND tasks.user_id = auth.uid()));

CREATE POLICY "Allow update for task owners" ON public.evaluations FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = evaluations.task_id AND tasks.user_id = auth.uid()));

-- Payments: Users manage their own payments
CREATE POLICY "Users can manage their own payments" ON public.payments
USING (auth.uid() = user_id);


##🚀 Usage
Run the development server:

Bash

npm run dev
Open http://localhost:3000 in your browser.

Sign Up for a new account.

Navigate to New Task to submit a task for evaluation.

View the AI-generated results instantly.

Click Unlock Full Report to simulate the payment flow and view detailed insights.

📂 Project Structure
src/
├── app/                 # Next.js App Router pages & API routes
│   ├── api/             # Backend API endpoints (evaluate, payment, etc.)
│   ├── dashboard/       # Protected dashboard pages
│   ├── login/           # Authentication pages
│   └── page.tsx         # Landing page
├── components/          # Reusable UI components
│   ├── auth/            # Auth forms and buttons
│   ├── dashboard/       # Dashboard specific components
│   └── ui/              # Shadcn/UI primitives (buttons, cards, inputs)
├── lib/                 # Utilities and configurations
│   ├── supabase/        # Supabase client & server config
│   └── prompts.ts       # AI Prompt engineering
└── hooks/               # Custom React hooks

##🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.