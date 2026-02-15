import OpenAI from 'openai';
import { extractTextFromFile } from '../utils/fileParsing.mjs';
import Course from '../models/Course.mjs';
import StudyPlan from '../models/StudyPlan.mjs';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Create a new course and link it to the Study Plan
export const createCourse = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            title,
            description,
            modules,
            difficulty,
            duration,
            studyPlanId,
            originalCourseTitle
        } = req.body;

        // 1. Create the Course
        const newCourse = await Course.create({
            title,
            description,
            instructor: userId, // Set user as instructor for their own AI course
            category: 'other', // Default to 'other' as 'ai-generated' is not a valid enum value
            difficulty: difficulty || 'beginner',
            modules: (modules || []).map(m => ({
                ...m,
                topics: (m.topics || []).map(t => ({ title: t, content: '' }))
            })),
            duration: duration,
            generatedBy: 'ai',
            isPublished: false
        });

        // 2. Link to StudyPlan if ID provided
        if (studyPlanId && originalCourseTitle) {
            const studyPlan = await StudyPlan.findOne({ _id: studyPlanId, user: userId });

            if (studyPlan && studyPlan.generatedContent && studyPlan.generatedContent.courses) {
                // Find the course in the array and update it
                // Since mixed type doesn't track deep changes well, we iterate, modify, and mark modified
                let updated = false;
                const courses = studyPlan.generatedContent.courses;

                for (let i = 0; i < courses.length; i++) {
                    if (courses[i].title === originalCourseTitle) {
                        courses[i].courseId = newCourse._id;
                        updated = true;
                        break;
                    }
                }

                if (updated) {
                    studyPlan.markModified('generatedContent');
                    await studyPlan.save();
                }
            }
        }

        res.status(201).json({ success: true, data: newCourse });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get a single course
export const getCourse = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update topic content (saved after generation)
export const updateTopicContent = async (req, res) => {
    try {
        const { courseId, moduleId, topicId, content } = req.body;
        const userId = req.user._id;

        const course = await Course.findOne({ _id: courseId, instructor: userId });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found or unauthorized' });
        }

        // Find module
        const module = course.modules.id(moduleId);
        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        const topic = module.topics.id(topicId);
        if (!topic) {
            return res.status(404).json({ success: false, message: 'Topic not found' });
        }

        topic.content = content;

        await course.save();

        res.status(200).json({ success: true, data: topic });

    } catch (error) {
        console.error('Error updating topic:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Toggle topic completion status
export const toggleTopicCompletion = async (req, res) => {
    try {
        const { courseId, moduleId, topicId } = req.body;
        const userId = req.user._id;

        const course = await Course.findOne({ _id: courseId, instructor: userId });

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        const module = course.modules.id(moduleId);
        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        const topic = module.topics.id(topicId);
        if (!topic) {
            return res.status(404).json({ success: false, message: 'Topic not found' });
        }

        // Toggle status
        topic.isCompleted = !topic.isCompleted;

        // Recalculate Progress
        let totalTopics = 0;
        let completedTopics = 0;

        course.modules.forEach(mod => {
            mod.topics.forEach(top => {
                totalTopics++;
                if (top.isCompleted) completedTopics++;
            });
        });

        course.progress = totalTopics === 0 ? 0 : Math.round((completedTopics / totalTopics) * 100);

        // Ensure progress is updated in StudyPlan as well (if needed, but frontend can refetch)
        // Ideally we should sync this back to the StudyPlan if we want accurate "My Courses" page stats immediately
        // But for now, let's keep it simple. The "My Courses" page fetches from StudyPlan, which has the *embedded* course progress?
        // Wait, the "My Courses" page fetches StudyPlan, but we modified the structure.
        // Actually, creating a Course makes it independent. 
        // The /courses page should probably fetch Courses directly now that we have real courses.
        // But the user's initial request was to "fetch from study plans".
        // If we created a Course, we should be using that.
        // I'll update the logic later to prioritize real courses.

        await course.save();

        res.status(200).json({ success: true, data: { topicId, isCompleted: topic.isCompleted, progress: course.progress } });

    } catch (error) {
        console.error('Error toggling topic completion:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get all courses for the current user
export const getAllCourses = async (req, res) => {
    try {
        const userId = req.user._id;
        const courses = await Course.find({ instructor: userId }).sort({ updatedAt: -1 });

        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Create a custom course from files and prompts
export const createCustomCourse = async (req, res) => {
    console.log("Creating Custom Course...");
    try {
        const userId = req.user._id;
        const { topic, _description, difficulty, depth } = req.body;
        const files = req.files || [];

        console.log(`Received: Topic=${topic}, Digg=${difficulty}, Depth=${depth}, Files=${files.length}`);

        // 1. Extract Text from Files
        let extractedText = '';
        for (const file of files) {
            try {
                const text = await extractTextFromFile(file);
                extractedText += `\n--- Content from ${file.originalname} ---\n${text}\n`;
            } catch (err) {
                console.error(`Failed to parse file ${file.originalname}:`, err);
                // Continue with other files/text? Or fail? Let's continue.
            }
        }

        // 2. Construct Prompt
        const prompt = `Create a comprehensive, structured course syllabus for the topic: "${topic}".
        Target Audience Level: ${difficulty}.
        
        System Context / User Instructions:
        ${_description || "No specific instructions provided."}

        Source Material (Use this content as the primary knowledge base):
        ${extractedText.substring(0, 50000)} // Truncate to avoid context limit overflow if massive

        Requirements:
        - Generate exactly ${depth || 5} modules.
        - For each module, provide 3-5 specific topics.
        - Ensure logical progression.
        - Return ONLY valid JSON matching the schema.
        `;

        // 3. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Or gpt-4o if available/affordable
            messages: [
                { role: "system", content: "You are an expert curriculum designer. Output strict JSON." },
                { role: "user", content: prompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "course_syllabus",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            modules: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        name: { type: "string" },
                                        description: { type: "string" },
                                        topics: { type: "array", items: { type: "string" } },
                                        duration: { type: "string" }
                                    },
                                    required: ["name", "description", "topics", "duration"],
                                    additionalProperties: false
                                }
                            }
                        },
                        required: ["title", "description", "modules"],
                        additionalProperties: false
                    }
                }
            }
        });

        const result = JSON.parse(completion.choices[0].message.content);

        // 4. Create Course in DB
        const newCourse = await Course.create({
            title: result.title || topic,
            description: result.description || _description,
            instructor: userId,
            category: 'other',
            difficulty: difficulty,
            modules: result.modules.map(m => ({
                ...m,
                topics: m.topics.map(t => ({ title: t, content: '' }))
            })),
            duration: result.modules.reduce((acc, m) => acc + (parseInt(m.duration) || 0), 0) + ' hours',
            generatedBy: 'ai-custom',
            // sourceDocsCount: files.length // Add this to schema if we want to track stats?
            // For now let's just save basic course.
            isPublished: false
        });

        res.status(201).json({ success: true, data: newCourse });

    } catch (error) {
        console.error('Error creating custom course:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
};
