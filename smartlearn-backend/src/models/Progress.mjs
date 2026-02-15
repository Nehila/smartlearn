import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    completedModules: [
      {
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    currentModule: {
      type: mongoose.Schema.Types.ObjectId,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    timeSpent: {
      type: Number, // in minutes
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['not-started', 'in-progress', 'completed', 'paused'],
      default: 'not-started',
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    notes: [
      {
        content: {
          type: String,
          trim: true,
        },
        moduleId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    quizScores: [
      {
        quizId: {
          type: mongoose.Schema.Types.ObjectId,
        },
        score: {
          type: Number,
          min: 0,
          max: 100,
        },
        attempts: {
          type: Number,
          default: 1,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one progress record per user per course
progressSchema.index({ user: 1, course: 1 }, { unique: true });

// Index for querying user's progress
progressSchema.index({ user: 1, status: 1 });

// Method to update progress percentage
progressSchema.methods.updateProgressPercentage = function (totalModules) {
  if (totalModules > 0) {
    this.progressPercentage = Math.round(
      (this.completedModules.length / totalModules) * 100
    );
  }
  return this.progressPercentage;
};

// Method to mark module as completed
progressSchema.methods.completeModule = function (moduleId) {
  const alreadyCompleted = this.completedModules.some(
    (m) => m.moduleId.toString() === moduleId.toString()
  );

  if (!alreadyCompleted) {
    this.completedModules.push({
      moduleId,
      completedAt: new Date(),
    });
  }

  if (this.status === 'not-started') {
    this.status = 'in-progress';
    this.startedAt = new Date();
  }

  this.lastAccessedAt = new Date();
};

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;
