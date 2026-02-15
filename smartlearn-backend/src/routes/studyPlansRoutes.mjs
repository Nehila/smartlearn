import express from 'express';
import { getStudyPlans, getStudyPlan } from '../controllers/studyPlansController.mjs';
import { protect } from '../middleware/auth.mjs';

const router = express.Router();

router.get('/', protect, getStudyPlans);
router.get('/:id', protect, getStudyPlan);

export default router;
