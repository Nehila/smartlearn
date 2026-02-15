import { createCourse, getCourse, updateTopicContent, toggleTopicCompletion, getAllCourses, createCustomCourse } from '../controllers/coursesController.mjs';
import { protect } from '../middleware/auth.mjs';
import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', protect, getAllCourses);
router.post('/generate-custom', protect, upload.array('files'), createCustomCourse);
router.post('/generate', protect, createCourse);
router.put('/update-topic', protect, updateTopicContent);
router.put('/toggle-completion', protect, toggleTopicCompletion);
router.get('/:id', protect, getCourse);

export default router;
