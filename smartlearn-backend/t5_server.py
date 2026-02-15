from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import os

app = Flask(__name__)

# Use a pre-trained T5 model from HuggingFace
MODEL_NAME = "t5-small"  # Will download from HuggingFace
print(f"Loading T5 model '{MODEL_NAME}' from HuggingFace...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
print("Model loaded successfully!")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "model": MODEL_NAME}), 200

@app.route('/summarize', methods=['POST'])
def summarize():
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Prepare input for T5
        input_text = f"summarize: {text}"
        
        # Tokenize
        inputs = tokenizer(
            input_text,
            max_length=512,
            truncation=True,
            return_tensors="pt"
        )
        
        # Generate summary
        summary_ids = model.generate(
            inputs.input_ids,
            max_length=150,
            min_length=40,
            length_penalty=2.0,
            num_beams=4,
            early_stopping=True
        )
        
        # Decode summary
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        
        return jsonify({
            "success": True,
            "summary": summary
        }), 200
        
    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
