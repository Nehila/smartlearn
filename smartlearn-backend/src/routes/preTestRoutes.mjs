import express from 'express';
import { saveDraft, finalizeSession, getSession } from '../controllers/preTestController.mjs';
import { protect } from '../middleware/auth.mjs';

const router = express.Router();

router.post('/draft', protect, saveDraft);
router.post('/finalize', protect, finalizeSession);
router.get('/session', protect, getSession);

export default router;
