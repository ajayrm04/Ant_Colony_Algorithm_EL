from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

genai.configure(api_key="AIzaSyBxdL-55wm6b_lWZyTJZhavAm1eg67VQmc")
model = genai.GenerativeModel('gemini-2.0-flash')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    prompt = data.get('prompt', '')
    try:
        response = model.generate_content(prompt)
        return jsonify({'response': response.text})  # or update depending on actual structure
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
