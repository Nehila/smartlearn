import OpenAI from 'openai';
import { extractTextFromFile } from '../utils/fileParsing.mjs';
import Quiz from '../models/Quiz.mjs';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Generate a new quiz from files and topic
export const generateQuiz = async (req, res) => {
    console.log("Generating Quiz...");
    try {
        const userId = req.user._id;
        const { topic, difficulty, questionsCount, description } = req.body;
        const files = req.files || [];

        console.log(`Received: Topic=${topic}, Diff=${difficulty}, Count=${questionsCount}, Files=${files.length}`);

        // 1. Extract Text
        let extractedText = '';
        for (const file of files) {
            try {
                const text = await extractTextFromFile(file);
                extractedText += `\n--- Content from ${file.originalname} ---\n${text}\n`;
            } catch (err) {
                console.error(`Failed to parse file ${file.originalname}:`, err);
            }
        }

        // 2. Construct Prompt
        const prompt = `Create a multiple-choice quiz on the topic: "${topic}".
        Target Audience Level: ${difficulty}.
        Number of Questions: ${questionsCount || 10}.

        Instructions / Context:
        ${description || "No specific instructions."}

        Source Material:
        ${extractedText.substring(0, 50000)}

        Requirements:
        - Generate exactly ${questionsCount || 10} questions.
        - Each question must have 4 options.
        - Indicate the correct answer explicitly.
        - Provide a brief explanation for the correct answer.
        - Return ONLY valid JSON matching the schema.
        `;

        // 3. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are an expert examiner. Output strict JSON." },
                { role: "user", content: prompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "quiz_structure",
                    strict: true,
                    schema: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            questions: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        question: { type: "string" },
                                        options: { type: "array", items: { type: "string" } },
                                        correctAnswer: { type: "string" },
                                        explanation: { type: "string" }
                                    },
                                    required: ["question", "options", "correctAnswer", "explanation"],
                                    additionalProperties: false
                                }
                            }
                        },
                        required: ["title", "description", "questions"],
                        additionalProperties: false
                    }
                }
            }
        });

        const result = JSON.parse(completion.choices[0].message.content);

        // 4. Create Quiz in DB
        const newQuiz = await Quiz.create({
            title: result.title || topic,
            description: result.description || description,
            instructor: userId,
            generatedBy: 'ai-custom',
            sourceFile: files.length > 0 ? files.map(f => f.originalname).join(', ') : null,
            questions: result.questions,
            isPublic: false
        });

        res.status(201).json({ success: true, data: newQuiz });

    } catch (error) {
        console.error('Error generating quiz:', error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
};

// Get all quizzes for the user
export const getAllQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find({ instructor: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: quizzes });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get single quiz by ID
export const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }
        res.json({ success: true, data: quiz });
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Update quiz progress (save answers)
export const updateProgress = async (req, res) => {
    try {
        const { answers } = req.body; // { questionId: option }
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        // Verify ownership (or enrollment if we had it)
        if (quiz.instructor.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        // Merge new answers into the Map
        for (const [questionId, answer] of Object.entries(answers)) {
            quiz.userAnswers.set(questionId, answer);
        }
        quiz.status = 'in-progress';
        await quiz.save();

        res.json({ success: true, data: quiz });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Submit quiz and calculate score
export const submitQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        if (quiz.instructor.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        let score = 0;
        const total = quiz.questions.length;

        // Calculate score
        quiz.questions.forEach(q => {
            const userAnswer = quiz.userAnswers.get(q._id.toString());
            // This logic assumes exact string match. 
            // Better to match by option index or normalize strings if needed.
            if (userAnswer === q.correctAnswer) {
                score++;
            }
        });

        quiz.score = Math.round((score / total) * 100);
        quiz.status = 'completed';
        await quiz.save();

        res.json({ success: true, data: quiz });

    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
