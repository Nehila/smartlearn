import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: [{
    type: String,
    required: true,
    trim: true,
  }],
  correctAnswer: {
    type: String, // Or index number? String allows "Option A" or raw text match.
    required: true,
    trim: true,
  },
  explanation: {
    type: String,
    trim: true,
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  generatedBy: {
    type: String,
    enum: ['ai', 'manual', 'ai-custom'],
    default: 'manual',
  },
  sourceFile: {
    type: String, // Filename or path if applicable
    default: null
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questions: [questionSchema],
  userAnswers: {
    type: Map,
    of: String, // questionId -> selectedOption
    default: {}
  },
  score: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
