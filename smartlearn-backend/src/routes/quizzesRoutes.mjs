import express from 'express';
import multer from 'multer';
import { generateQuiz, getAllQuizzes, getQuizById, updateProgress, submitQuiz } from '../controllers/quizzesController.mjs';
import { protect } from '../middleware/auth.mjs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/generate', protect, upload.array('files'), generateQuiz);
router.get('/', protect, getAllQuizzes);
router.get('/:id', protect, getQuizById);
router.put('/:id/progress', protect, updateProgress);
router.post('/:id/submit', protect, submitQuiz);

export default router;
