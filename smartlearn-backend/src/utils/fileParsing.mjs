import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Import CommonJS modules
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

export const extractTextFromFile = async (file) => {
    try {
        const filePath = file.path;
        const mimeType = file.mimetype;

        let text = '';

        if (mimeType === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            text = data.text;
        } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
            text = fs.readFileSync(filePath, 'utf8');
        } else {
            throw new Error('Unsupported file type');
        }

        // Clean up: Delete temp file
        fs.unlinkSync(filePath);

        return text;
    } catch (error) {
        console.error('Error extracting text:', error);
        throw error;
    }
};
