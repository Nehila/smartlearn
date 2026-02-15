# SmartLearn

SmartLearn is an AI-powered e-learning platform that generates structured educational content and personalized learning paths using generative artificial intelligence.

# Project Overview

## SmartLearn allows users to:
	•	Generate structured courses
	•	Create quizzes with explanations
	•	Generate document summaries
	•	Build personalized learning paths
	•	Track learning progress through analytics

The system is built using a hybrid AI strategy and a modern full-stack architecture.

# Technical Architecture

## Frontend
	•	Next.js 16 (App Router)
	•	React 19
	•	TypeScript
	•	Tailwind CSS
	•	Recharts
	•	React Markdown

## Backend
	•	Node.js
	•	Express
	•	MongoDB (Mongoose)
	•	JWT Authentication
	•	OpenAI API
	•	Local T5 summarization service

# AI Strategy

SmartLearn uses two AI models:

## Local Model – T5 (Fine-Tuned)
	•	Used for ultra-short summaries
	•	Fine-tuned on a subset of CNN/DailyMail dataset (~4,900 articles)
	•	Encoder–Decoder Transformer architecture
	•	~60M parameters

## OpenAI GPT-4o-mini

Used for:
	•	Course generation
	•	Quiz creation with explanations
	•	Dynamic pre-test question generation
	•	Personalized learning path generation

The backend:
	•	Constructs structured prompts
	•	Enforces strict JSON outputs
	•	Validates responses
	•	Stores data in MongoDB


# Core Features

## 1. Authentication
	•	User registration
	•	Login with JWT
	•	Protected routes

## 2. Dashboard
	•	Course statistics
	•	Quiz scores
	•	Weekly activity tracking
	•	Progress visualization

## 3. Course Management
	•	Course generation
	•	Module and topic structure
	•	Markdown-rendered content
	•	Progress tracking

## 4. Quiz System
	•	Multiple-choice questions
	•	Score calculation
	•	Explanations per question
	•	Progress saving

## 5. Summary Generation
	•	File upload support (PDF, DOCX, TXT)
	•	Choice between T5 and GPT-4o-mini
	•	Markdown formatted output

## 6. Adaptive Learning Path
	•	AI-generated pre-test
	•	Personalized roadmap
	•	Milestones and recommendation



# License
This project is for academic and research purposes.
