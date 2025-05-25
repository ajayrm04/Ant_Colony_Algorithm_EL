from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)

# Configure CORS properly
CORS(app, 
     resources={
         r"/*": {
             "origins": ["http://localhost:5173"],
             "methods": ["GET", "POST", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization", "X-Client-ID"],
             "supports_credentials": True
         }
     })

# Configure API key once
genai.configure(api_key="AIzaSyCswlWXhR_4vr6ByJKMKgfBtT2HAZfwSMc")

@app.route("/analyze_network", methods=['POST', 'OPTIONS'])
def analyze_network():
    # Handle preflight requests
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        historical_routes = data.get('history_data', [])
        name_matrix = data.get('name_matrix', [])

        # Log received data for debugging
        print("Analyzing network data:", {
            'historical_routes': historical_routes,
            'name_matrix': name_matrix
        })

        system_instruction = f"""
Analyze this network data and return ONLY these metrics in this EXACT format:
Historical Routes: {historical_routes}
Name Matrix: {name_matrix}

Return ONLY these values in this EXACT format (one value per line):
total_routers: [number]
total_devices: [number]
average_latency: [number]
network_efficiency: [number]
average_congestion: [number]
number_of_hops: [number]
topology_used: [text]
packet_drop_rate: [number]
aco_score: [number]"""

        # Initialize model and get response directly
        model = genai.GenerativeModel('gemini-2.5-flash-preview-04-17')
        response = model.generate_content(system_instruction)
        
        # Parse the response into structured data
        metrics = {}
        if response.text:
            lines = response.text.strip().split('\n')
            for line in lines:
                if ':' in line:
                    key, value = line.split(':', 1)
                    metrics[key.strip()] = value.strip()

        return jsonify({
            'metrics': metrics,
            'status': 'success'
        })

    except Exception as e:
        print(f"Error analyzing network: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

if __name__ == '__main__':
    # Enable debug mode and allow all origins in development
    app.run(debug=True, port=5000, host='0.0.0.0')









