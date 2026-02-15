import mongoose from 'mongoose';

const summarySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    prompt: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    sourceFile: {
        type: String,
        default: null
    },
    generatedBy: {
        type: String,
        enum: ['ai-custom', 'ai-t5-small', 'ai-openai'],
        default: 'ai-openai'
    },
    instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    wordCount: {
        type: Number,
        default: 0
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Summary = mongoose.model('Summary', summarySchema);

export default Summary;
