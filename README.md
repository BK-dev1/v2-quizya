# Quizya - Comprehensive Project Architecture & Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Database Architecture](#database-architecture)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Routes](#api-routes)
7. [Core Services](#core-services)
8. [Components & UI](#components--ui)
9. [Data Flow & Interactions](#data-flow--interactions)
10. [Key Features](#key-features)
11. [Development Setup](#development-setup)

---

## 🎯 Project Overview

**Quizya** is a modern, full-stack online examination platform built with Next.js 16 and React 19. It enables teachers to create, manage, and administer exams with advanced features like proctoring, guest access, real-time analytics, and question banking.

### Core Purpose
- **For Teachers**: Create exams, manage questions, monitor student performance, view analytics
- **For Students**: Take exams in real-time, receive immediate feedback, access results
- **For Guests**: Join exams using room codes without authentication
- **For Admins**: Manage users, view system-wide analytics, manage settings

### Key Highlights
- Real-time exam administration with guest access support
- Advanced proctoring capabilities (tab switching detection, fullscreen exit detection)
- Comprehensive question banking system
- Multi-role support (teacher, student)
- Responsive dark/light theme
- Server-side rendering with Next.js App Router

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 16.0.10 (React 19.2.0)
- **Styling**: 
  - Tailwind CSS 4.1.9 with PostCSS 8.5
  - Custom Neumorphism (Neu) design system
  - Shadcn/ui components with Radix UI primitives
- **UI Libraries**:
  - Radix UI (30+ component primitives)
  - Lucide React (icons)
  - Sonner (toast notifications)
  - React Hook Form (form validation)
  - Recharts (data visualization)
  - Embla Carousel (carousel)
- **State Management**:
  - React Context API (AuthProvider)
  - Custom hooks (useAuth, useExams, useGuestExamAccess)
- **Themes**: next-themes (light/dark/system)

### Backend & Database
- **Runtime**: Node.js (Next.js Server Components & API Routes)
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Authentication (Email/Password + Google OAuth)
- **ORM**: Supabase JS Client (direct SQL queries)
- **Security**: Row Level Security (RLS) policies

### Development Tools
- **TypeScript**: 5.x (strict mode enabled)
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Form Validation**: Zod + React Hook Form
- **Icons**: Lucide React (454 icons)

### Deployment
- **Hosting**: Vercel
- **Analytics**: Vercel Analytics
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network

---

## 📁 Project Structure

```
v2-quizya/
├── app/                              # Next.js App Router directory
│   ├── api/                          # API Routes (Backend endpoints)
│   │   ├── auth/                     # Authentication endpoints
│   │   │   ├── login/                # POST: User login
│   │   │   ├── signup/               # POST: User registration
│   │   │   ├── logout/               # POST: User logout
│   │   │   ├── google/               # GET: Google OAuth
│   │   │   ├── callback/             # GET: OAuth callback
│   │   │   ├── me/                   # GET: Current user info
│   │   │   └── verify-email/         # POST: Email verification
│   │   ├── exams/                    # Exam management endpoints
│   │   │   ├── route.ts              # GET: List exams | POST: Create exam
│   │   │   └── [id]/                 # Dynamic exam routes
│   │   │       ├── route.ts          # GET/PUT/DELETE: Exam CRUD
│   │   │       └── ...               # Nested exam operations
│   │   ├── exam/                     # Exam taking/session endpoints
│   │   │   └── guest-join/           # POST: Guest joins exam
│   │   ├── public-exams/             # Public exam discovery
│   │   ├── analytics/                # Analytics endpoints
│   │   │   ├── dashboard/            # Overall dashboard stats
│   │   │   └── teacher/              # Teacher-specific analytics
│   │   └── sessions/                 # Exam session management
│   │
│   ├── auth/                         # Authentication pages
│   │   ├── login/                    # Login page
│   │   ├── signup/                   # Registration page
│   │   └── setup/                    # Initial setup/onboarding
│   │
│   ├── dashboard/                    # Main dashboard
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── exams/                    # Exam management
│   │   │   ├── page.tsx              # Exams list
│   │   │   ├── [id]/                 # Exam detail & edit
│   │   │   └── new/                  # Create new exam
│   │   ├── question-bank/            # Question bank management
│   │   ├── analytics/                # Analytics views
│   │   └── settings/                 # User settings
│   │
│   ├── exam/                         # Exam taking interface
│   │   └── take/                     # Exam taking page
│   │
│   ├── join/                         # Guest join exam
│   ├── public-exams/                 # Browse public exams
│   ├── results/                      # View exam results
│   │
│   ├── layout.tsx                    # Root layout (Auth + Theme providers)
│   ├── page.tsx                      # Landing page
│   └── globals.css                   # Global styles
│
├── components/                       # Reusable React components
│   ├── ui/                           # Shadcn/Neumorphism UI components
│   │   ├── neu-button.tsx            # Custom Neu button
│   │   ├── neu-card.tsx              # Custom Neu card
│   │   ├── neu-input.tsx             # Custom Neu input
│   │   ├── neu-modal.tsx             # Custom Neu modal
│   │   ├── neu-timer.tsx             # Exam timer component
│   │   ├── neu-progress.tsx          # Progress bar
│   │   ├── neu-toast.tsx             # Toast notifications
│   │   ├── proctoring-badge.tsx      # Proctoring status indicator
│   │   ├── room-code-widget.tsx      # Room code display
│   │   ├── sortable-question.tsx     # Draggable question component
│   │   ├── theme-toggle.tsx          # Dark/light mode toggle
│   │   ├── credential-input.tsx      # Masked credential input
│   │   ├── password-strength.tsx     # Password strength meter
│   │   └── ...                       # Other Radix-based components
│   │
│   ├── auth/                         # Authentication components
│   │   ├── auth-login.tsx            # Login form component
│   │   ├── auth-signup.tsx           # Signup form component
│   │   └── protected-route.tsx       # Route protection wrapper
│   │
│   ├── dashboard/                    # Dashboard components
│   │   ├── dashboard.tsx             # Main dashboard container
│   │   ├── exams-list.tsx            # Exams list view
│   │   ├── exam-results.tsx          # Exam results display
│   │   ├── exam-taking.tsx           # Active exam interface
│   │   ├── question-bank-list.tsx    # Question bank list
│   │   ├── analytics-dashboard.tsx   # Analytics visualization
│   │   ├── settings-dashboard.tsx    # Settings UI
│   │   └── student-performance.tsx   # Performance charts
│   │
│   ├── exam-students/                # Exam-related student components
│   │   ├── exam-results.tsx          # Student exam results
│   │   └── guest-join-form.tsx       # Guest join form
│   │
│   ├── landing/                      # Landing page components
│   │   ├── hero-section.tsx          # Hero banner
│   │   ├── features-section.tsx      # Features showcase
│   │   ├── header.tsx                # Navigation header
│   │   └── footer.tsx                # Page footer
│   │
│   ├── debug/                        # Debug/testing components
│   │   └── supabase-test.tsx         # Supabase connectivity test
│   │
│   ├── theme-provider.tsx            # Next-themes provider wrapper
│   └── toast-container.tsx           # Toast notifications container
│
├── lib/                              # Core logic & utilities
│   ├── supabase/                     # Supabase configuration
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server Supabase client (SSR)
│   │   └── middleware.ts             # Auth middleware
│   │
│   ├── services/                     # Business logic services
│   │   ├── exams.ts                  # Exam CRUD operations
│   │   ├── exam-sessions.ts          # Exam session management
│   │   ├── questions.ts              # Question CRUD
│   │   ├── question-bank.ts          # Question bank operations
│   │   └── profiles.ts               # User profile operations
│   │
│   ├── hooks/                        # Custom React hooks
│   │   ├── use-auth.tsx              # Auth context & hook
│   │   ├── use-exams.ts              # Exam data hook
│   │   └── use-guest-exam-access.ts  # Guest access hook
│   │
│   ├── types/                        # TypeScript type definitions
│   │   ├── index.ts                  # Exported types
│   │   └── database.ts               # Supabase database types (auto-generated)
│   │
│   ├── utils/                        # Utility functions
│   │   └── guest-session.ts          # Guest session utilities
│   │
│   └── utils.ts                      # General utility functions
│
├── public/                           # Static assets
│   ├── icon-light-32x32.png
│   ├── icon-dark-32x32.png
│   ├── icon.svg
│   └── apple-icon.png
│
├── supabase/                         # Database migrations & config
│   ├── schema.sql                    # Main database schema
│   ├── config.toml                   # Supabase config
│   ├── migration-guest-access.sql    # Guest access migration
│   ├── verify-guest-setup.sql        # Guest setup verification
│   └── migrations/
│       └── 20241213000001_create_user_settings.sql
│
├── styles/                           # Global styles
│   └── globals.css                   # Tailwind + custom styles
│
├── postcss.config.mjs                # PostCSS configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── next.config.mjs                   # Next.js configuration
├── components.json                   # Shadcn/ui configuration
├── package.json                      # Dependencies & scripts
├── pnpm-lock.yaml                    # Dependency lock file
└── README.md                         # Project documentation
```

---

## 🗄️ Database Architecture

### Database Schema

#### 1. **User Roles Enum**
```sql
CREATE TYPE user_role AS ENUM ('teacher', 'student');
```

#### 2. **Profiles Table**
Stores user profile information.
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY (references auth.users),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'student',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```
**Purpose**: User identity and role management

#### 3. **Exams Table**
Main exam container.
```sql
CREATE TABLE exams (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    passing_score INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    room_code TEXT UNIQUE,
    proctoring_enabled BOOLEAN DEFAULT false,
    shuffle_questions BOOLEAN DEFAULT false,
    show_results_immediately BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```
**Purpose**: Exam metadata and configuration

#### 4. **Questions Table**
Individual exam questions.
```sql
CREATE TABLE questions (
    id UUID PRIMARY KEY,
    exam_id UUID REFERENCES exams(id),
    question_text TEXT NOT NULL,
    question_type question_type,  -- 'multiple_choice', 'true_false', 'short_answer', 'essay'
    options JSONB,                  -- Array of options (for multiple choice)
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    order_index INTEGER NOT NULL,   -- Question ordering
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```
**Purpose**: Exam questions and answers

#### 5. **Exam Sessions Table**
Student exam attempt records.
```sql
CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY,
    exam_id UUID REFERENCES exams(id),
    student_id UUID REFERENCES profiles(id),
    guest_name TEXT,               -- For guest students
    guest_email TEXT,              -- For guest students
    is_guest BOOLEAN DEFAULT false,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    score DECIMAL(5,2),
    total_points INTEGER,
    status session_status,         -- 'not_started', 'in_progress', 'completed', 'abandoned'
    answers JSONB,                 -- Student answers { question_id: answer }
    proctoring_data JSONB,         -- Suspicious activity logs
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT unique_exam_participant UNIQUE(exam_id, student_id, guest_email)
);
```
**Purpose**: Track exam attempts, scores, and student answers

#### 6. **Question Bank Table**
Reusable question library.
```sql
CREATE TABLE question_bank (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    difficulty_level difficulty_level,  -- 'easy', 'medium', 'hard'
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,               -- Answer explanation
    tags TEXT[],                    -- For categorization
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```
**Purpose**: Reusable question library for creating exams

### Database Indexes
```sql
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exams_room_code ON exams(room_code);
CREATE INDEX idx_questions_exam_id ON questions(exam_id);
CREATE INDEX idx_questions_order ON questions(exam_id, order_index);
CREATE INDEX idx_exam_sessions_exam_id ON exam_sessions(exam_id);
CREATE INDEX idx_exam_sessions_student_id ON exam_sessions(student_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_question_bank_created_by ON question_bank(created_by);
CREATE INDEX idx_question_bank_subject ON question_bank(subject);
CREATE INDEX idx_question_bank_difficulty ON question_bank(difficulty_level);
CREATE INDEX idx_question_bank_tags ON question_bank USING GIN(tags);
```

### Row Level Security (RLS) Policies

All tables have RLS enabled with role-based access control:

**Profiles**:
- Public profiles viewable by everyone
- Users can only insert/update their own profile

**Exams**:
- Public exams viewable by everyone
- Only teachers can create exams
- Teachers can only update/delete their own exams

**Questions**:
- Viewable by exam creators or students taking the exam
- Teachers manage questions for their exams

**Exam Sessions**:
- Students can only view their own sessions
- Teachers can view sessions for their exams

**Question Bank**:
- Users can only view/manage their own questions
- Support for sharing questions (future enhancement)

---

## 🔐 Authentication & Authorization

### Authentication Flow

#### 1. **Email/Password Authentication**
```
User Input (Email + Password)
    ↓
POST /api/auth/signup or /api/auth/login
    ↓
Supabase Auth API
    ↓
JWT Token + Refresh Token (stored in httpOnly cookies)
    ↓
Create/Update profiles table entry
    ↓
Redirect to dashboard
```

#### 2. **Google OAuth**
```
User clicks "Sign in with Google"
    ↓
GET /api/auth/google (redirect to Google)
    ↓
Google OAuth flow
    ↓
GET /api/auth/callback (handle callback)
    ↓
Create Supabase user + profile
    ↓
Redirect to dashboard
```

#### 3. **Guest Access** (No Authentication)
```
Guest provides email/name
    ↓
POST /api/exam/guest-join with room code
    ↓
Create temporary exam_sessions entry (is_guest=true)
    ↓
No authentication required
    ↓
Access exam temporarily
```

### Authorization Levels

| Role | Permissions |
|------|-------------|
| **Teacher** | Create exams, create questions, manage question bank, view own analytics, delete exams |
| **Student** | Take exams, view own results, browse public exams, access question bank (read-only) |
| **Guest** | Take public exams with room code (no authentication needed) |
| **Admin** | (Future) Manage users, view system analytics, manage platform settings |

### Auth Context (`useAuth` Hook)

```typescript
interface AuthContextType {
  user: User | null;                    // Current user
  profile: Profile | null;              // User's profile data
  loading: boolean;
  signIn(email, password): Promise;     // Login
  signUp(email, password, name, role): Promise;  // Register
  signOut(): Promise;                   // Logout
  refreshProfile(): Promise;            // Reload profile
}
```

### Token Management
- JWT tokens stored in **httpOnly cookies** (secure, XSS-protected)
- Refresh tokens handled automatically by Supabase
- Session persistence across browser reloads
- Automatic logout on token expiration

---

## 🔌 API Routes

### Authentication Routes

#### `POST /api/auth/signup`
**Purpose**: User registration
**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "role": "teacher" // 'teacher' or 'student'
}
```
**Response**: `{ user, session }` or error
**Auth**: Public

#### `POST /api/auth/login`
**Purpose**: User login
**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```
**Response**: `{ user, session }` or error
**Auth**: Public

#### `POST /api/auth/logout`
**Purpose**: User logout
**Auth**: Protected (requires authentication)

#### `GET /api/auth/me`
**Purpose**: Get current authenticated user
**Response**: `{ user, profile }`
**Auth**: Protected

#### `GET /api/auth/google`
**Purpose**: Google OAuth initiation
**Auth**: Public

#### `GET /api/auth/callback`
**Purpose**: Handle Google OAuth callback
**Auth**: Public

#### `POST /api/auth/verify-email`
**Purpose**: Verify email address
**Auth**: Public

### Exam Management Routes

#### `GET /api/exams`
**Purpose**: List user's exams with pagination
**Query Params**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
**Response**:
```json
{
  "data": [{ id, title, duration_minutes, ... }],
  "pagination": { page, limit, total, pages }
}
```
**Auth**: Protected

#### `POST /api/exams`
**Purpose**: Create new exam
**Request**:
```json
{
  "title": "Math Final Exam",
  "description": "...",
  "duration_minutes": 120,
  "total_questions": 50,
  "passing_score": 70,
  "is_public": false,
  "proctoring_enabled": true,
  "shuffle_questions": true
}
```
**Response**: Created exam object
**Auth**: Protected (teacher only)

#### `GET /api/exams/[id]`
**Purpose**: Get single exam with questions
**Response**:
```json
{
  "id": "...",
  "title": "...",
  "questions": [{ id, question_text, options, ... }]
}
```
**Auth**: Protected

#### `PUT /api/exams/[id]`
**Purpose**: Update exam
**Request**: Partial exam object
**Response**: Updated exam
**Auth**: Protected (exam creator only)

#### `DELETE /api/exams/[id]`
**Purpose**: Delete exam
**Auth**: Protected (exam creator only)

### Question Management Routes

#### `POST /api/exams/[id]/questions`
**Purpose**: Add question to exam
**Request**:
```json
{
  "question_text": "...",
  "question_type": "multiple_choice",
  "options": ["A", "B", "C", "D"],
  "correct_answer": "A",
  "points": 2,
  "order_index": 1
}
```
**Auth**: Protected (exam creator only)

#### `PUT /api/exams/[id]/questions/[qid]`
**Purpose**: Update question
**Auth**: Protected (exam creator only)

#### `DELETE /api/exams/[id]/questions/[qid]`
**Purpose**: Delete question
**Auth**: Protected (exam creator only)

### Exam Session Routes

#### `POST /api/exam/guest-join`
**Purpose**: Guest joins exam with room code
**Request**:
```json
{
  "roomCode": "EXAM123",
  "guestName": "John",
  "guestEmail": "john@example.com"
}
```
**Response**: Exam session object
**Auth**: Public

#### `GET /api/sessions/[id]`
**Purpose**: Get exam session details
**Response**: Session with answers and score
**Auth**: Protected

#### `PUT /api/sessions/[id]`
**Purpose**: Update exam session (submit answers)
**Request**:
```json
{
  "answers": { "question_id": "answer_text" },
  "status": "completed",
  "submitted_at": "2024-12-14T..."
}
```
**Auth**: Protected/Guest

### Analytics Routes

#### `GET /api/analytics/dashboard`
**Purpose**: Get teacher's dashboard analytics
**Response**:
```json
{
  "totalExams": 15,
  "activeExams": 3,
  "totalSessions": 250,
  "avgScore": 78.5,
  "completionRate": 92,
  "recentExams": [...]
}
```
**Auth**: Protected (teacher only)

#### `GET /api/analytics/teacher`
**Purpose**: Detailed teacher analytics
**Response**: Graphs data, performance metrics
**Auth**: Protected (teacher only)

### Public Exams Routes

#### `GET /api/public-exams`
**Purpose**: Browse public exams
**Query Params**:
- `page`: Pagination
- `search`: Search by title
**Response**: List of public exams
**Auth**: Public

### Settings Routes

#### `GET /api/settings/profile?userId=[id]`
**Purpose**: Get user profile
**Auth**: Public (profile is public)

#### `PUT /api/settings/profile`
**Purpose**: Update user profile
**Request**:
```json
{
  "full_name": "...",
  "avatar_url": "...",
  "role": "..."
}
```
**Auth**: Protected (own profile only)

#### `GET /api/settings/preferences`
**Purpose**: Get user preferences
**Auth**: Protected

#### `PUT /api/settings/preferences`
**Purpose**: Update user preferences
**Auth**: Protected

---

## 🔧 Core Services

### Exam Service (`lib/services/exams.ts`)

```typescript
createExam(exam: ExamInsert): Promise<Exam>
  → Insert new exam into database
  → Called from: Dashboard "Create Exam" button

getExam(examId: string): Promise<Exam>
  → Fetch single exam metadata
  → Called from: Exam detail page

getExamWithQuestions(examId: string): Promise<ExamWithQuestions>
  → Fetch exam + all questions (with ordering)
  → Called from: Exam editing, exam taking

getUserExams(userId: string): Promise<Exam[]>
  → Fetch all exams created by user
  → Called from: Dashboard exams list

getPublicExams(): Promise<Exam[]>
  → Fetch all public exams
  → Called from: Public exams browse page

updateExam(examId: string, updates: ExamUpdate): Promise<Exam>
  → Update exam metadata
  → Called from: Exam edit form

deleteExam(examId: string): Promise<boolean>
  → Soft/hard delete exam
  → Called from: Dashboard delete action
```

### Exam Session Service (`lib/services/exam-sessions.ts`)

```typescript
createExamSession(session: ExamSessionInsert): Promise<ExamSession>
  → Create new exam attempt record
  → Called from: Exam start (student or guest)

getExamSession(examId, studentId?, guestEmail?): Promise<ExamSession>
  → Fetch existing session
  → Supports both authenticated and guest lookups

updateExamSession(sessionId, updates): Promise<ExamSession>
  → Update session (add answers, change status)
  → Called from: Question submission, exam completion

startExamSession(...): Promise<ExamSession>
  → Initialize session with started_at timestamp
  → Marks status as 'in_progress'

submitExamSession(sessionId, answers): Promise<ExamSession>
  → Submit final answers
  → Calculate score
  → Mark status as 'completed'
  → Called from: "Submit Exam" button

getExamSessions(examId): Promise<ExamSession[]>
  → Get all sessions for exam (teacher view)
  → Called from: Analytics dashboard

calculateSessionScore(session, questions): number
  → Compare student answers to correct answers
  → Sum points from correct answers
```

### Question Service (`lib/services/questions.ts`)

```typescript
createQuestion(question: QuestionInsert): Promise<Question>
  → Add question to exam
  → Auto-increment order_index

updateQuestion(questionId, updates): Promise<Question>
  → Edit question details

deleteQuestion(questionId): Promise<boolean>
  → Remove question from exam

getExamQuestions(examId): Promise<Question[]>
  → Fetch all questions in order
  → Called from: Exam display, analytics

reorderQuestions(examId, questionIds[]): Promise<boolean>
  → Reorder questions via drag-drop
  → Called from: Question editor
```

### Question Bank Service (`lib/services/question-bank.ts`)

```typescript
createBankQuestion(question: QuestionBankInsert): Promise<QuestionBank>
  → Create reusable question in bank

getUserBankQuestions(userId): Promise<QuestionBank[]>
  → Fetch user's question bank

searchBankQuestions(userId, filters): Promise<QuestionBank[]>
  → Filter by subject, difficulty, tags
  → Called from: Question bank browser

addBankQuestionToExam(bankQuestionId, examId): Promise<Question>
  → Copy question from bank to exam
  → Called from: Exam editor "Add from bank" button
```

### Profile Service (`lib/services/profiles.ts`)

```typescript
createProfile(profile: ProfileInsert): Promise<Profile>
  → Create profile on signup

getProfile(userId): Promise<Profile>
  → Fetch user profile

updateProfile(userId, updates): Promise<Profile>
  → Update user profile info

getUserByEmail(email): Promise<Profile | null>
  → Find user by email (for sharing, etc.)
```

### Supabase Client Setup

#### Browser Client (`lib/supabase/client.ts`)
```typescript
createBrowserClient(url, anonKey)
  → Used in client components
  → Has limited access (public/personal data only)
  → Handles RLS policies
```

#### Server Client (`lib/supabase/server.ts`)
```typescript
createServerClient(url, anonKey, { cookies })
  → Used in server components & API routes
  → Can access more data (with proper RLS)
  → Manages session cookies
```

---

## 🎨 Components & UI

### Component Architecture

#### **Neumorphism Design System**
All custom Neu components follow a soft, 3D aesthetic:
- Soft shadows and highlights
- Rounded corners
- Neutral color palette
- Touch-friendly sizing

#### **UI Component Hierarchy**

```
ui/
├── neu-card.tsx           (Card container with header/content)
│   ├── NeuCard
│   ├── NeuCardHeader
│   ├── NeuCardTitle
│   └── NeuCardContent
├── neu-button.tsx         (Button with multiple variants)
├── neu-input.tsx          (Text input field)
├── neu-modal.tsx          (Dialog/modal overlay)
├── neu-progress.tsx       (Progress bar)
├── neu-timer.tsx          (Countdown timer for exams)
├── neu-toast.tsx          (Toast notifications)
├── proctoring-badge.tsx   (Proctoring status indicator)
├── room-code-widget.tsx   (Room code display/copy)
├── sortable-question.tsx  (Draggable question component)
├── theme-toggle.tsx       (Dark/light mode switcher)
├── credential-input.tsx   (Password/secret input field)
├── password-strength.tsx  (Password strength meter)
└── [radix-ui components]  (Dialog, Select, Tabs, etc.)
```

### Dashboard Components

#### **Dashboard.tsx** (Main Container)
```typescript
- Fetches user exams via useExams hook
- Displays exam statistics (total, active, sessions, avg score)
- Shows exams list with pagination
- Actions: Create, Edit, Delete, View, Copy link
- Navigation: To new exam, question bank, analytics, settings
```

#### **ExamsList.tsx**
```typescript
- Lists user's exams in grid/list view
- Shows:
  - Exam title & duration
  - Question count
  - Public/Private status
  - Room code (if applicable)
  - Last updated date
- Actions per exam: View, Edit, Share, Delete
```

#### **ExamResults.tsx**
```typescript
- Displays exam attempt details
- Shows:
  - Student name
  - Score & percentage
  - Time taken
  - Pass/Fail status
  - Question-by-question review
  - Answer comparison
- Export/Print options
```

#### **ExamTaking.tsx**
```typescript
- Main exam interface for taking exams
- Features:
  - Timer countdown
  - Question navigator/switcher
  - Answer tracking
  - Progress indicator
  - Proctoring status badge
  - Submit button with warning
- Proctoring events logged:
  - Tab switches
  - Window blur
  - Fullscreen exit
  - Copy/paste attempts
```

#### **AnalyticsDashboard.tsx**
```typescript
- Displays charts using Recharts:
  - Student performance distribution
  - Score trends over time
  - Question difficulty analysis
  - Class average vs individual
  - Completion rate
  - Most difficult questions
```

#### **StudentPerformance.tsx**
```typescript
- Shows performance metrics:
  - Total exams attempted
  - Average score
  - Completion rate
  - Performance trends
```

### Authentication Components

#### **AuthLogin.tsx**
```typescript
- Email/Password form
- "Sign in with Google" button
- Form validation with Zod
- Error handling & display
- "Forgot password?" link
- "Don't have account?" → signup link
```

#### **AuthSignup.tsx**
```typescript
- Email, Password, Full Name, Role (Teacher/Student) fields
- Password strength indicator
- Terms & conditions checkbox
- Email verification (optional)
- "Already have account?" → login link
```

#### **ProtectedRoute.tsx**
```typescript
- Wrapper component for protected pages
- Checks if user is authenticated
- Redirects to login if not
- Handles loading states
```

### Landing Page Components

#### **HeroSection.tsx**
```typescript
- Hero banner with CTA buttons
- "Get Started" → Signup
- "Learn More" → Features
- Key benefits/highlights
```

#### **FeaturesSection.tsx**
```typescript
- Feature cards:
  - Exam creation
  - Student management
  - Analytics
  - Proctoring
  - Question banking
  - Guest access
```

#### **Header.tsx** (Navigation)
```typescript
- Logo & branding
- Navigation links (Home, Features, Pricing, etc.)
- Auth buttons (Login/Signup or Dashboard link)
- Dark/Light theme toggle
- Mobile menu (hamburger)
```

#### **Footer.tsx**
```typescript
- Links sections (Product, Company, Legal)
- Social media links
- Copyright notice
```

---

## 🔄 Data Flow & Interactions

### High-Level Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        LANDING PAGE                         │
│  (Hero, Features, CTA buttons → Login/Signup)              │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
              ┌────────────────────────────┐
              │   AUTHENTICATION CHOICE    │
              │ ┌──────────┐  ┌──────────┐│
              │ │ Email/Pw │  │ Google   ││
              │ └────┬─────┘  └────┬─────┘│
              └──────┼─────────────┼──────┘
                     ↓             ↓
           ┌─────────────────────────────┐
           │  Create/Validate User       │
           │  (Supabase Auth API)        │
           └──────────────┬──────────────┘
                          ↓
           ┌─────────────────────────────┐
           │  Create Profile Entry       │
           │  (profiles table)           │
           └──────────────┬──────────────┘
                          ↓
           ┌─────────────────────────────┐
           │    DASHBOARD (Teacher)      │
           │  ┌──────────────────────────┤
           │  │ - View own exams         │
           │  │ - View analytics         │
           │  │ - Create new exam        │
           │  │ - Manage question bank   │
           │  └──────────────────────────┤
           └──────┬──────────────────────┘
                  │
        ┌─────────┼─────────┬──────────┬─────────────┐
        ↓         ↓         ↓          ↓             ↓
    ┌────────┐ ┌─────┐ ┌────────┐ ┌─────────┐ ┌─────────┐
    │ Create │ │Edit │ │Delete  │ │ Publish │ │Analytics│
    │ Exam   │ │Exam │ │Exam    │ │ Exam    │ │         │
    └────┬───┘ └──┬──┘ └───┬────┘ └────┬────┘ └──┬──────┘
         │        │        │           │         │
         └────────┼────────┼───────────┼─────────┘
                  │        │           │
        ┌─────────┴────────┴───────────┴────────┐
        │      exams TABLE (INSERT/UPDATE/DELETE)│
        └─────────────────────────────────────────┘
        
┌─────────────────────────────────────────────────────────────┐
│          STUDENT/GUEST TAKES EXAM                           │
│                                                             │
│  Student View:                                             │
│  1. Dashboard → Public Exams                              │
│  2. Select exam → Start exam                              │
│  3. Fetch exam_sessions (or create new)                   │
│  4. Display questions from exam_sessions.answers          │
│  5. Track proctoring events                               │
│  6. Submit answers → Update exam_sessions.answers         │
│  7. Calculate score → Update exam_sessions.score          │
│  8. View results                                          │
│                                                             │
│  Guest View:                                              │
│  1. /join page with room code input                       │
│  2. POST /api/exam/guest-join                             │
│  3. Same flow as student (no authentication)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Exam Creation Flow

```
Teacher clicks "Create Exam"
    ↓
/dashboard/exams/new page loads
    ↓
Form: Title, Duration, PassingScore, etc.
    ↓
POST /api/exams
    ↓
INSERT into exams table
    ↓
Get exam ID back
    ↓
Redirect to /dashboard/exams/[id]
    ↓
Teacher can add questions
    ↓
For each question:
  - POST /api/exams/[id]/questions
  - INSERT into questions table
  - Assign order_index
    ↓
Teacher clicks "Publish"
    ↓
UPDATE exams SET is_public = true, is_active = true
    ↓
Generate room_code (unique)
    ↓
Exam ready for students/guests
```

### Exam Taking Flow (Student)

```
Student in dashboard
    ↓
Clicks "Take Exam"
    ↓
Navigates to /exam/take/[examId]
    ↓
ExamTaking component loads
    ↓
GET /api/exams/[id]/questions
    ↓
Fetch all questions from database
    ↓
Display first question
    ↓
Student answers question
    ↓
Answer stored in component state (not yet saved)
    ↓
Student clicks "Next" or "Submit"
    ↓
On Submit:
  - POST /api/sessions
  - CREATE exam_sessions record
  - UPDATE with answers JSONB
  - UPDATE with submitted_at timestamp
    ↓
Server calculates score:
  - Compare each answer to correct_answer
  - Sum points for correct answers
    ↓
UPDATE exam_sessions.score
UPDATE exam_sessions.status = 'completed'
    ↓
Redirect to /results/[sessionId]
    ↓
Display results page with score & review
```

### Data Access Patterns

#### **Read Exam (Teacher)**
```typescript
useAuth() → user.id
  ↓
useExams() → fetchExams()
  ↓
GET /api/exams?page=1
  ↓
SELECT * FROM exams WHERE created_by = user.id
  ↓
RLS: created_by = auth.uid() ✓
  ↓
Return list of exams
```

#### **Read Questions (Student)**
```typescript
ExamTaking component loads
  ↓
GET /api/exams/[id]/questions
  ↓
SELECT * FROM questions WHERE exam_id = [id]
  ↓
RLS: Check if exam is public OR created_by = auth.uid()
  ↓
Return questions array (ordered by order_index)
```

#### **Submit Exam (Guest)**
```typescript
Guest joins with room code
  ↓
POST /api/exam/guest-join
  {roomCode, guestName, guestEmail}
  ↓
CREATE exam_sessions
  is_guest = true
  guest_email = provided email
  student_id = NULL
  ↓
Guest takes exam (no auth check)
  ↓
PUT /api/sessions/[id]
  {answers, status: 'completed'}
  ↓
RLS: Allow if session.is_guest = true OR session.guest_email = provided
  ↓
Calculate & save score
```

### Real-time Features

#### **Timer (Exam Duration)**
```typescript
ExamTaking component:
  - useEffect: setInterval every 1000ms
  - Decrement timeRemaining
  - Warning at 5 minutes
  - Auto-submit at 0 seconds
```

#### **Proctoring Events**
```typescript
ExamTaking component:
  - onBlur: Detect window blur (tab switch)
  - onfullscreenchange: Detect fullscreen exit
  - oncontextmenu: Prevent right-click
  - Events stored in proctoring_data JSONB
  - Badge shows warning to student
  - Teacher can review events in results
```

#### **Auto-save (Optional)**
```typescript
ExamTaking component:
  - onChange on answer field
  - Debounced PUT /api/sessions/[id]/answers
  - Updates exam_sessions.answers JSONB
  - User can see "Saved" indicator
```

---

## ✨ Key Features

### 1. **Exam Management**
- ✅ Create exams with custom duration, passing score
- ✅ Add multiple question types (MC, T/F, Short Answer, Essay)
- ✅ Reorder questions via drag-drop
- ✅ Publish/Unpublish exams
- ✅ Generate unique room codes for guest access
- ✅ Bulk import questions from question bank
- ✅ Clone exams
- ✅ Schedule exams (future feature)

### 2. **Question Types**
- ✅ **Multiple Choice**: 4-5 options, single correct
- ✅ **True/False**: Binary choice
- ✅ **Short Answer**: Keyword matching or manual grading
- ✅ **Essay**: Manual grading by teacher
- ⏳ **Matching**: Match columns (future)
- ⏳ **Fill in Blank**: Fill blanks in text (future)

### 3. **Question Bank**
- ✅ Organize questions by subject & difficulty
- ✅ Tag questions for easy filtering
- ✅ Search & filter
- ✅ Reuse questions across exams
- ✅ Share questions with colleagues (future)
- ✅ Include answer explanations

### 4. **Exam Taking**
- ✅ Timer with countdown
- ✅ Question navigator (jump to question)
- ✅ Progress indicator
- ✅ Flag for review
- ✅ Question review before submit
- ✅ Auto-save answers
- ✅ Guest access with room code
- ⏳ Section-based exams (future)

### 5. **Proctoring**
- ✅ Tab switching detection
- ✅ Window blur detection (focus loss)
- ✅ Fullscreen exit detection
- ✅ Prevent right-click/inspect element
- ✅ Suspicious activity log
- ✅ Teacher can review violations
- ⏳ Webcam monitoring (future)
- ⏳ Screen recording (future)
- ⏳ AI-based cheating detection (future)

### 6. **Analytics & Reporting**
- ✅ Dashboard with key metrics (total exams, active exams, avg score)
- ✅ Exam-specific analytics (attempt count, score distribution)
- ✅ Question analytics (difficulty analysis, discrimination index)
- ✅ Student performance trends
- ✅ Performance by question
- ✅ Export results to CSV
- ⏳ Custom reports (future)
- ⏳ Predictive analytics (future)

### 7. **Student Features**
- ✅ Take exams in real-time
- ✅ Immediate feedback (optional)
- ✅ View results & score
- ✅ Review answered questions
- ✅ View answer explanations
- ✅ Attempt history
- ⏳ Practice mode (future)

### 8. **User Management**
- ✅ Role-based access (Teacher/Student)
- ✅ User profiles with avatar
- ✅ Email verification
- ✅ Password reset
- ✅ Google OAuth login
- ⏳ LDAP/SSO integration (future)
- ⏳ Bulk user import (future)

### 9. **UI/UX**
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark/Light theme
- ✅ Neumorphism design system
- ✅ Accessibility features (ARIA labels, keyboard nav)
- ✅ Toast notifications
- ✅ Loading skeletons
- ✅ Smooth animations & transitions

### 10. **Security**
- ✅ Row-level security (RLS) on all tables
- ✅ JWT authentication with httpOnly cookies
- ✅ HTTPS enforced (Vercel)
- ✅ SQL injection prevention (Supabase)
- ✅ CSRF protection
- ✅ Rate limiting (future)
- ✅ 2FA authentication (future)

---

## 🚀 Development Setup

### Prerequisites
- Node.js 18+ / pnpm
- Supabase account (database + auth)
- Google OAuth credentials (optional)
- Vercel account (for deployment, optional)

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Installation
```bash
cd v2-quizya
pnpm install
```

### Database Setup
```bash
# Create Supabase project
# Run schema migrations
pnpm supabase db push

# OR run SQL manually in Supabase SQL editor
# supabase/schema.sql
```

### Running Locally
```bash
# Development server
pnpm dev

# Open http://localhost:3000
```

### Building
```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

### Linting
```bash
# Check for linting errors
pnpm lint
```

### Deployment
```bash
# Deploy to Vercel (connected to GitHub)
# Every push to main branch auto-deploys

# OR manual deployment
vercel --prod
```

---

## 📊 Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        app/layout.tsx                              │
│  (RootLayout - Global Providers)                                   │
│  ├─ ThemeProvider (next-themes)                                    │
│  ├─ AuthProvider (use-auth context)                                │
│  └─ Toaster (sonner notifications)                                 │
└───────────────┬─────────────────────────────────────────────────────┘
                │
   ┌────────────┼────────────┬───────────────┬──────────────────┐
   ↓            ↓            ↓               ↓                  ↓
Landing      Auth Pages   Dashboard      Exam Pages         Results
(/)          (/auth/*)   (/dashboard)    (/exam/*)          (/results)
│            │            │               │                  │
├─Header     ├─AuthLogin  ├─Dashboard    ├─ExamTaking      ├─ExamResults
├─Hero       ├─AuthSigup  ├─ExamsList    ├─QuestionNav     ├─ScoreDisplay
├─Features   └─Protected  ├─Analytics    ├─Timer            └─ReviewAnswers
├─Footer        Route     ├─Settings     └─ProctorBadge
└─ -          │           └─QuestBank
              │
         useAuth hook ────┐
                          │
                    Supabase Auth API
                    (/api/auth/*)
                          │
                    Supabase Client
                          │
                    ┌─────┴─────┐
                    ↓           ↓
              Profiles       Auth.users
              (RLS)          (Supabase)
              

Dashboard Flow:
┌────────────┐       ┌──────────────┐       ┌─────────────┐
│ useExams() │──────▶│ /api/exams   │──────▶│ exams table │
│ (hook)     │       │ (GET/POST)   │       │ (RLS)       │
└────────────┘       └──────────────┘       └─────────────┘
    │
    ├─▶ ExamsList ──▶ [Edit/Delete exams]
    ├─▶ Analytics ──▶ /api/analytics/dashboard
    └─▶ Settings ──▶ /api/settings/profile


Exam Taking Flow:
┌──────────────────┐
│ ExamTaking.tsx   │
├──────────────────┤
│ - useEffect:     │  GET /api/exams/[id]  ┌─────────────┐
│   fetchExam()    │────────────────────────▶│ questions   │
│ - Questions loop │                        │ table (RLS) │
│ - Timer          │                        └─────────────┘
│ - ProctorBadge   │
│ - onBlur/Focus   │
│ - onContextMenu  │
│ - setInterval    │
│ - onChange→      │  PUT /api/sessions    ┌───────────────┐
│   saveAnswers()  │────────────────────────▶│ exam_sessions │
└──────────────────┘                        │ table (RLS)   │
    │                                        └───────────────┘
    ├─ proctoring_data logged
    └─ On submit: Calculate score
```

---

## 🔗 Key Dependencies & Their Roles

| Package | Version | Purpose |
|---------|---------|---------|
| **next** | 16.0.10 | Full-stack React framework |
| **react** | 19.2.0 | UI library |
| **@supabase/supabase-js** | 2.87.1 | Database & Auth client |
| **@supabase/ssr** | 0.8.0 | Server-side Supabase |
| **tailwindcss** | 4.1.9 | CSS utility framework |
| **@radix-ui/** | Various | Accessible UI primitives |
| **react-hook-form** | 7.60.0 | Form state management |
| **zod** | 3.25.76 | TypeScript-first validation |
| **recharts** | 2.15.4 | React charting library |
| **sonner** | 1.7.4 | Toast notifications |
| **next-themes** | 0.4.6 | Theme management |
| **lucide-react** | 0.454.0 | Icon library |
| **date-fns** | 4.1.0 | Date utilities |

---

## 📝 Summary

**Quizya** is a comprehensive, modern exam platform with:
- **Frontend**: Next.js 16, React 19, Tailwind CSS with custom Neumorphism design
- **Backend**: Supabase (PostgreSQL + Auth)
- **Architecture**: Server-side rendering with client components, API routes, custom hooks
- **Security**: Row-level security, JWT auth, httpOnly cookies
- **Features**: Exam management, question banking, real-time taking, proctoring, analytics
- **Scalability**: Indexed database queries, pagination, caching strategies
- **Developer Experience**: TypeScript, ESLint, component-based architecture

The system is designed for teachers to create and manage exams, for students to take exams in real-time, and for guests to participate with minimal friction. All interactions flow through Supabase with enforced security policies at the database level.

