import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './config/database.mjs';

// Connect to database

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']).map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
import authRoutes from './routes/authRoutes.mjs';
app.use('/api/auth', authRoutes);
import coursesRoutes from './routes/coursesRoutes.mjs';
app.use('/api/courses', coursesRoutes);
// app.use('/api/progress', progressRoutes);
// app.use('/api/quizzes', quizzesRoutes);
// app.use('/api/notes', notesRoutes);
import studyPlansRoutes from './routes/studyPlansRoutes.mjs';
app.use('/api/study-plans', studyPlansRoutes);

import preTestRoutes from './routes/preTestRoutes.mjs';
app.use('/api/pre-test', preTestRoutes);

import quizzesRoutes from './routes/quizzesRoutes.mjs';
app.use('/api/quizzes', quizzesRoutes);

import summariesRoutes from './routes/summariesRoutes.mjs';
app.use('/api/summaries', summariesRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SmartLearn API is running',
    timestamp: new Date().toISOString(),
    database: 'connected',
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to SmartLearn API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      courses: '/api/courses',
      progress: '/api/progress',
      quizzes: '/api/quizzes',
      notes: '/api/notes',
      studyPlans: '/api/study-plans',
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Start server
const PORT = process.env.PORT || 8008;
app.listen(PORT, () => {
  console.log(`🚀 SmartLearn API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 CORS enabled for: ${allowedOrigins.join(', ')}`);
});

export default app;
