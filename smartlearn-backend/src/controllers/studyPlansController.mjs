import StudyPlan from '../models/StudyPlan.mjs';

// Get all study plans for the logged-in user
export const getStudyPlans = async (req, res) => {
    try {
        const userId = req.user._id;
        const plans = await StudyPlan.find({ user: userId }).sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: plans });
    } catch (error) {
        console.error('Error fetching study plans:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get a single study plan by ID
export const getStudyPlan = async (req, res) => {
    try {
        const userId = req.user._id;
        const plan = await StudyPlan.findOne({ _id: req.params.id, user: userId });

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Study plan not found' });
        }

        res.status(200).json({ success: true, data: plan });
    } catch (error) {
        console.error('Error fetching study plan:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
