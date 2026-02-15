import Summary from '../models/Summary.mjs';
import { extractTextFromFile } from '../utils/fileParsing.mjs';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Generate summary from file and/or prompt
export const generateSummary = async (req, res) => {
    try {
        const { prompt, title, model = 'openai' } = req.body;
        const file = req.file;

        if (!prompt && !file) {
            return res.status(400).json({ success: false, message: 'Please provide a prompt or upload a file' });
        }

        let fileText = '';
        let sourceFileName = null;

        // Extract text from uploaded file if present
        if (file) {
            try {
                fileText = await extractTextFromFile(file);
                sourceFileName = file.originalname;
            } catch (error) {
                console.error('File parsing error:', error);
                return res.status(400).json({ success: false, message: 'Failed to parse file. Please ensure it\'s a valid PDF, DOCX, or TXT file.' });
            }
        }

        let summaryContent;
        let wordCount;

        // Generate summary based on selected model
        if (model === 't5') {
            // Use T5 model
            const { generateT5Summary } = await import('../ai/t5-service.mjs');

            // Prepare text for T5
            const textToSummarize = `${fileText}${fileText && prompt ? '\n\n' : ''}${prompt || ''}`;

            try {
                summaryContent = await generateT5Summary(textToSummarize);
                wordCount = summaryContent.split(/\s+/).length;
            } catch (error) {
                console.error('T5 service error:', error);
                return res.status(503).json({
                    success: false,
                    message: 'T5 model service is unavailable. Please try OpenAI or check if the T5 service is running.'
                });
            }
        } else {
            // Use OpenAI (default)
            const aiPrompt = `You are an expert summarizer. Generate a comprehensive, well-structured summary in markdown format.

${fileText ? `**Source Document:**\n${fileText}\n\n` : ''}
${prompt ? `**User Instructions:**\n${prompt}\n\n` : ''}

Create a detailed summary that:
1. Captures all key points and main ideas
2. Uses proper markdown formatting (headings, lists, bold, italic)
3. Is well-organized and easy to read
4. Includes relevant details while being concise

Generate the summary now:`;

            // Call OpenAI API
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert at creating comprehensive, well-structured summaries in markdown format.'
                    },
                    {
                        role: 'user',
                        content: aiPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            });

            summaryContent = completion.choices[0].message.content;
            wordCount = summaryContent.split(/\s+/).length;
        }

        // Create summary in database
        const summary = await Summary.create({
            title: title || `Summary - ${new Date().toLocaleDateString()}`,
            prompt: prompt || 'File-based summary',
            content: summaryContent,
            sourceFile: sourceFileName,
            wordCount,
            instructor: req.user._id,
            generatedBy: model === 't5' ? 'ai-t5-small' : 'ai-openai'
        });

        res.status(201).json({ success: true, data: summary });
    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get all summaries for the logged-in user
export const getAllSummaries = async (req, res) => {
    try {
        const summaries = await Summary.find({ instructor: req.user._id })
            .sort({ createdAt: -1 })
            .select('-content'); // Exclude content for list view

        res.json({ success: true, data: summaries });
    } catch (error) {
        console.error('Error fetching summaries:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get a single summary by ID
export const getSummaryById = async (req, res) => {
    try {
        const summary = await Summary.findById(req.params.id);

        if (!summary) {
            return res.status(404).json({ success: false, message: 'Summary not found' });
        }

        // Verify ownership
        if (summary.instructor.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
