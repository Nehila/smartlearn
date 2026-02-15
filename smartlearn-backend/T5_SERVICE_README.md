# T5 Summary Service Setup

This Python Flask service provides inference for the local T5-small model for generating summaries.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

## Installation

1. **Install Python dependencies:**
   ```bash
   cd smartlearn-backend
   pip install -r requirements.txt
   ```

   Or if you prefer using a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

## Running the Service

Start the T5 service on port 5001:

```bash
python t5_server.py
```

The service will:
- Load the T5 model from `./src/ai/t5-small`
- Listen on `http://localhost:5001`
- Provide health check at `GET /health`
- Provide summarization at `POST /summarize`

## Environment Variables

- `PORT`: Port to run the service on (default: 5001)
- `T5_SERVICE_URL`: URL where the T5 service is running (default: http://localhost:5001) - set this in your Node.js `.env` file

## Testing

You can test the service with curl:

```bash
# Health check
curl http://localhost:5001/health

# Generate summary
curl -X POST http://localhost:5001/summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text to summarize here..."}'
```

## Integration

The Node.js backend automatically connects to this service when users select the "T5 Small (Local)" model option.

## Troubleshooting

**Service not starting:**
- Ensure all Python dependencies are installed
- Check that port 5001 is not already in use
- Verify the model files exist in `./src/ai/t5-small`

**Out of memory:**
- The T5-small model requires ~250MB of RAM
- Close other applications if needed
