import PreTestSession from '../models/PreTestSession.mjs';

// Save or update a draft pre-test session
export const saveDraft = async (req, res) => {
    try {
        const userId = req.user._id; // Assuming auth middleware attaches user
        const { domain, topic, currentLevel: level, age, step, aiQuestions, aiAnswers } = req.body;

        // Find existing draft for user or create new
        let session = await PreTestSession.findOne({ user: userId, status: 'draft' });

        if (!session) {
            session = new PreTestSession({ user: userId });
        }

        // Update fields
        if (domain) session.domain = domain;
        if (topic) session.topic = topic;
        if (level) session.level = level;
        if (age) session.age = age;
        if (step) session.currentStep = step;
        if (aiQuestions) session.aiQuestions = aiQuestions;
        if (aiAnswers) session.aiAnswers = aiAnswers;

        await session.save();

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        console.error('Error saving pre-test draft:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

import StudyPlan from '../models/StudyPlan.mjs';

// Finalize the pre-test session (mark as active)
export const finalizeSession = async (req, res) => {
    try {
        const userId = req.user._id;
        const { learningPathData } = req.body;

        // We might assume the most recent draft is the one to finalize
        const session = await PreTestSession.findOne({ user: userId, status: 'draft' });

        if (!session) {
            return res.status(404).json({ success: false, message: 'No draft session found' });
        }

        session.status = 'active';
        await session.save();

        let studyPlanId = null;
        if (learningPathData) {
            const studyPlan = await StudyPlan.create({
                user: userId,
                preTestSession: session._id,
                title: learningPathData.pathTitle,
                description: learningPathData.overview,
                generatedContent: learningPathData,
                startDate: new Date(),
                endDate: new Date(), // This should ideally be calculated based on duration
                status: 'active'
            });
            studyPlanId = studyPlan._id;
        }

        res.status(200).json({ success: true, data: session, studyPlanId });
    } catch (error) {
        console.error('Error finalizing pre-test:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export const getSession = async (req, res) => {
    try {
        const userId = req.user._id;
        const session = await PreTestSession.findOne({ user: userId, status: 'draft' }).sort({ updatedAt: -1 });

        if (!session) {
            return res.status(404).json({ success: false, message: 'No active draft found' });
        }

        res.status(200).json({ success: true, data: session });
    } catch (error) {
        console.error('Error fetching pre-test session:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
}
