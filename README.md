# 🎉 CelebrateAI — GenAI Event Planning Assistant

> **PromptWars Virtual Hackathon | Challenge 5: Celebration & Event Planner**
> Built with Google Gemini AI × Next.js

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-blue?logo=google)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🌟 Overview

**CelebrateAI** is an intelligent, GenAI-powered event planning assistant that transforms abstract event ideas into concrete, actionable plans. Whether you're planning a **wedding**, **birthday celebration**, or **community gathering**, CelebrateAI leverages Google's Gemini AI to provide personalized budget breakdowns, dynamic timelines, vendor checklists, and creative theme suggestions.

## 🎯 Chosen Vertical & Problem Statement

**Vertical:** Celebrations & Event Management  
**Hackathon:** PromptWars Virtual Hackathon (Challenge 5: Celebration & Event Planner) by Hack2skill × Google for Developers.

### The Problem
Event planning is overwhelming. Organizing weddings, milestone birthdays, and community festivals forces organizers to juggle spreadsheets, budget calculators, vendor contacts, and fragmented to-do lists across multiple disconnected platforms. This disjointed workflow leads to budget overruns, missed deadlines, high stress, and generic, uninspired celebrations.

---

## 🧠 Approach, Logic & How It Works

### Core Logic & User Workflow
1. **Intelligent Capture (Wizard):** The user specifies event type (Wedding, Birthday, Community), dates, attendee scale, overall budget, and qualitative preferences (aesthetic styles, cultural nuances, catering requirements).
2. **Context-Aware GenAI Generation:** Next.js server-side API routes sanitize and structure the user request, prompt **Google Gemini (gemini-2.5-flash)** with detailed persona constraints, and receive strictly typed JSON payloads.
3. **Structured Plan Synthesis:** Gemini formulates:
   - Dynamic Milestone Timelines with priority tiers (Critical, High, Medium, Low) and relative date offsets.
   - Comprehensive Budget Breakdown allocating percentage weights and estimated costs across industry-standard vendor categories.
   - Tailored Vendor Checklist with role descriptions, hiring lead times, and negotiation tips.
   - Curated Theme & Aesthetic Concepts complete with coordinated color hex palettes.
4. **Interactive Dashboard & Modification:** Everything is stored locally via client-side state (`localStorage` + React Context) enabling instant updates, zero database cold-starts, and client-side data ownership.
5. **On-Demand AI Advisory:** Users can converse with the AI Copilot to request real-time budget reallocations, personalized entertainment suggestions, decor alternatives, or schedule adjustments.

---

## 📌 Key Assumptions Made

1. **Client-Side Data Ownership:** Users retain their event data locally in their browser (`localStorage`), eliminating the requirement for complex account setup while ensuring fast, serverless performance on Vercel.
2. **Deterministic Fallbacks:** In cases where external API rate limits are hit or offline operation is required, predefined structural schemas and fallback models preserve user interaction and UI stability.
3. **Currency Agnostic:** Budget figures are formatted flexibly (defaulting to standard monetary notation) adaptable across regional currencies.
4. **AI Generation Temperature:** Gemini 2.0 Flash is prompted with controlled temperature and JSON constraints to ensure structured, reproducible, and hallucination-free event plans.

---

---

## ✨ Key Features

### 🤖 AI Event Wizard
An intelligent, multi-step conversational flow that captures your event vision and generates a complete plan using Gemini AI. Simply describe your event type, budget, preferences, and let AI create your perfect plan.

### 💰 Intelligent Budget Manager
- AI-driven budget allocation based on event type, scale, and priorities
- Visual pie/bar charts for spending breakdown
- Real-time tracking of estimated vs. actual costs
- Smart reallocation suggestions when you're over or under budget

### 📅 Dynamic Timeline & Milestones
- Auto-generated countdown checklists tailored to your event date
- Milestone tracking with priority levels (Critical → Low)
- Status management (Pending → In Progress → Completed)
- Overdue detection and alerts

### 📋 Vendor & Task Checklists
- AI-recommended vendor categories with booking timelines
- Vendor contact management and status tracking
- Progress visualization
- Smart tips for vendor negotiation and selection

### 💡 Personalized AI Recommendations
- Creative theme suggestions with color palettes
- Custom décor, menu, and entertainment ideas
- Interactive AI chat for follow-up questions
- Context-aware suggestions based on your event details

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Landing  │ │Dashboard │ │ Wizard   │ │  Event   │    │
│  │  Page    │ │  Page    │ │  Page    │ │ Detail   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                       │                                 │
│              ┌────────▼────────┐                        │
│              │  React Context  │                        │
│              │  + localStorage │                        │
│              └────────┬────────┘                        │
├───────────────────────┼─────────────────────────────────┤
│                Next.js API Routes                       │
│  ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Generate │  │ Budget   │ │  Reco-   │ │  AI      │   │
│  │  Plan    │  │ Advice   │ │ mmend    │ │  Chat    │   │
│  └─────┬────┘  └─────┬────┘ └─────┬────┘ └─────┬────┘   │
│        └────────┬────┴────────┬───┴────────┬───┘        │
├─────────────────┼─────────────┼────────────┼────────────┤
│          ┌──────▼─────────────▼────────────▼──────┐     │
│          │          Google Gemini AI API          │     │
│          │        (gemini-2.5-flash model)        │     │
│          └────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | Full-stack React framework |
| **Language** | TypeScript 5.5 | Type-safe development |
| **AI Engine** | Google Gemini API | Intelligent plan generation |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **Charts** | Recharts | Budget visualizations |
| **Animations** | Framer Motion | Smooth UI transitions |
| **Icons** | Lucide React | Consistent iconography |
| **Validation** | Zod | Runtime type validation |
| **State** | React Context + localStorage | Client-side persistence |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Google Gemini API Key** — [Get one free](https://aistudio.google.com/app/apikey)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/Event-Planner.git
cd Event-Planner

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment (Vercel)

```bash
# Deploy to Vercel
npx vercel

# Set environment variable in Vercel dashboard:
# GEMINI_API_KEY=your_key_here
```

---

## 🧠 AI & Prompt Engineering

CelebrateAI uses carefully crafted prompt templates to ensure high-quality, structured AI responses:

1. **System Prompts**: Define CelebrateAI's persona as an expert event planner with decades of experience
2. **Structured Output**: All AI responses return JSON for reliable parsing and display
3. **Context Injection**: Event details, preferences, and constraints are injected into prompts for personalized responses
4. **Safety**: Input sanitization prevents prompt injection; API keys are server-side only

### Prompt Design Principles
- **Role-based**: AI assumes the role of a professional event planner
- **Constraint-aware**: Budget limits, guest counts, and dates inform all suggestions
- **Culturally sensitive**: Prompts account for cultural and dietary preferences
- **Actionable output**: Every suggestion includes specific, implementable details

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Landing page
│   ├── dashboard/page.tsx        # Events dashboard
│   ├── events/
│   │   ├── new/page.tsx          # AI Event Wizard
│   │   └── [id]/page.tsx         # Event detail (tabbed)
│   └── api/ai/                   # API routes for Gemini
│       ├── generate-plan/        # Full plan generation
│       ├── budget-advice/        # Budget optimization
│       ├── recommendations/      # Creative suggestions
│       └── chat/                 # Conversational AI
├── components/
│   ├── ui/                       # Reusable UI primitives
│   ├── layout/                   # Header, Footer
│   └── event-detail/             # Tab components
├── context/                      # React Context providers
├── lib/                          # Utilities & AI client
└── types/                        # TypeScript definitions
```

---

## 📊 Evaluation Criteria Mapping

| Criteria | Impact | Implementation |
|----------|--------|---------------|
| **Code Quality** | High | Strict TypeScript, ESLint, clean architecture, comprehensive JSDoc comments, separation of concerns |
| **Problem Alignment** | High | All 4 core features (Budget, Timeline, Vendors, Ideas) with deep AI integration |
| **Security** | Medium | Server-side API keys, Zod input validation, sanitized prompts, no client-side secrets |
| **Efficiency** | Medium | React Server Components, code splitting, optimistic UI updates, localStorage caching |
| **Testing** | Low | Zod runtime validation, TypeScript compile-time checks, error boundaries |
| **Accessibility** | Low | Semantic HTML, ARIA labels, keyboard navigation, responsive design, color contrast |

---

## 📝 License

This project was built by **Divyanshu Prajapat** for the **PromptWars Virtual Hackathon** by Hack2skill × Google for Developers.

---

<p align="center">
  Built with 💜 using Google Gemini AI
</p>
