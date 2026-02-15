import mongoose from 'mongoose';

const preTestSessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        domain: { type: String },
        topic: { type: String },
        level: { type: String },
        age: { type: Number },
        currentStep: { type: Number, default: 1 },
        aiQuestions: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
        aiAnswers: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: ['draft', 'active'], // User requested 'active' for finalized
            default: 'draft',
        },
    },
    {
        timestamps: true,
    }
);

const PreTestSession = mongoose.model('PreTestSession', preTestSessionSchema);

export default PreTestSession;
