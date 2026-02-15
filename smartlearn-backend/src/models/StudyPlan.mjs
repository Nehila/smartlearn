import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  dueDate: {
    type: Date,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
});

const studyPlanSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Study plan title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    preTestSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PreTestSession',
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    tasks: [taskSchema],
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived', 'paused'],
      default: 'active',
    },
    goals: [
      {
        type: String,
        trim: true,
      },
    ],
    generatedBy: {
      type: String,
      enum: ['ai', 'manual'],
      default: 'manual',
    },
    aiPrompt: {
      type: String,
      trim: true,
    },
    generatedContent: {
      type: mongoose.Schema.Types.Mixed,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Index for querying user's study plans
studyPlanSchema.index({ user: 1, status: 1 });

// Method to calculate completion percentage
studyPlanSchema.methods.updateCompletionPercentage = function () {
  if (this.tasks.length === 0) {
    this.completionPercentage = 0;
    return 0;
  }

  const completedTasks = this.tasks.filter((task) => task.isCompleted).length;
  this.completionPercentage = Math.round(
    (completedTasks / this.tasks.length) * 100
  );
  return this.completionPercentage;
};

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);

export default StudyPlan;
