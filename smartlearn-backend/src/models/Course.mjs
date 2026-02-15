import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Module name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  topics: [
    {
      title: { type: String, required: true },
      content: { type: String, default: '' }, // Markdown content
      isCompleted: { type: Boolean, default: false },
    },
  ],
  duration: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  resources: [
    {
      title: String,
      type: {
        type: String,
        enum: ['video', 'article', 'pdf', 'link', 'quiz'],
      },
      url: String,
    },
  ],
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor is required'],
    },
    thumbnail: {
      type: String,
      default: '/images/course-default.jpg',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'programming',
        'design',
        'business',
        'marketing',
        'data-science',
        'ai-ml',
        'web-development',
        'mobile-development',
        'other',
      ],
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    modules: [moduleSchema],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    duration: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    generatedBy: {
      type: String,
      enum: ['ai', 'manual', 'ai-custom'],
      default: 'manual',
    },
    aiPrompt: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1, difficulty: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ isPublished: 1 });

// Virtual for formatted rating
courseSchema.virtual('formattedRating').get(function () {
  return this.rating.average.toFixed(1);
});

const Course = mongoose.model('Course', courseSchema);

export default Course;
