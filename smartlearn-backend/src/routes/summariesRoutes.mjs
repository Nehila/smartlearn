import express from 'express';
import multer from 'multer';
import { generateSummary, getAllSummaries, getSummaryById } from '../controllers/summariesController.mjs';
import { protect } from '../middleware/auth.mjs';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Routes
router.post('/generate', protect, upload.single('file'), generateSummary);
router.get('/', protect, getAllSummaries);
router.get('/:id', protect, getSummaryById);

export default router;
