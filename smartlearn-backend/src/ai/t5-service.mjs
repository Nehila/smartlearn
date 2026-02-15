import axios from 'axios';

const T5_SERVICE_URL = process.env.T5_SERVICE_URL || 'http://localhost:5001';

/**
 * Generate summary using T5 model
 * @param {string} text - Text to summarize
 * @returns {Promise<string>} - Generated summary
 */
export const generateT5Summary = async (text) => {
    try {
        const response = await axios.post(`${T5_SERVICE_URL}/summarize`, {
            text: text
        }, {
            timeout: 30000 // 30 second timeout
        });

        if (response.data.success) {
            return response.data.summary;
        } else {
            throw new Error(response.data.error || 'T5 service returned unsuccessful response');
        }
    } catch (error) {
        console.error('Error calling T5 service:', error.message);
        throw new Error(`T5 service error: ${error.message}`);
    }
};

/**
 * Check if T5 service is available
 * @returns {Promise<boolean>}
 */
export const checkT5ServiceHealth = async () => {
    try {
        const response = await axios.get(`${T5_SERVICE_URL}/health`, {
            timeout: 5000
        });
        return response.data.status === 'healthy';
    } catch (error) {
        console.error('T5 service health check failed:', error.message);
        return false;
    }
};
