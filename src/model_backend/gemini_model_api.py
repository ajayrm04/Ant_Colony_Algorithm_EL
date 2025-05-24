from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

# You can receive historical routes data from your frontend by sending it in the POST request body.
# In your frontend, include 'historicalroutes' in the JSON payload sent to /predict.
# In this backend, you can access it from the request data as shown below:

# Example:
# data = request.get_json()
# historical_routes = data.get('historicalroutes', None)
# You can then use 'historical_routes' as needed in your logic.

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

genai.configure(api_key="AIzaSyCswlWXhR_4vr6ByJKMKgfBtT2HAZfwSMc")

# system_instruction_prompt = f"""
# this is the json format of historical routes of a network 
# time stamp is the id 
# sourceId is the starting point 
# targetid is the ending point 
# path  object is the nodes involved in the  path the 2 nd elemnt in path is the router through which it travels latency is the opposostion to the flow of traffic
# hops is no of jumps between nodes
# congestion is a quantity to mesure traffic 

# {historical_data}

# ]the following is the name of the nodes either it may be type device or type router 
# to identify when user adresses it 
# {name_matrix}
# ] These all objects in json format are formed using ant colony optimisation algorithms user may asks its benifits over other algorithms and ACO,s realtedness to this network , user asks some series of questions regarding the working of router , explain him in a begineer friendly way  whata happening in the network he might ask ,he  might ask the latency change in the network ofter aco implemtation etc 
# Answer the user in 4 lines with all the information needed 
# """



# Store chat sessions for each client
chat_sessions = {}

@app.route("/predict", methods=['POST'])
def predict():
    
    data = request.get_json()
    print("Received data:", data)

    prompt = data.get('prompt', '')
    print("Prompt:", prompt)

    historical_routes = data.get('history_data', [])
    print("Historical routes:", historical_routes)

    name_matrix = data.get('name_matrix', [])
    print("Name Matrix:", name_matrix)

    system_instruction_prompt = f"""
this is the json format of historical routes of a network 
time stamp is the id 
sourceId is the starting point 
targetid is the ending point 
path  object is the nodes involved in the  path the 2 nd elemnt in path is the router through which it travels latency is the opposostion to the flow of traffic
hops is no of jumps between nodes
congestion is a quantity to mesure traffic 

{historical_routes}

]the following is the name of the nodes either it may be type device or type router 
to identify when user adresses it 
{name_matrix}
These all objects in json format are formed using ant colony optimisation algorithms user may asks its benifits over other algorithms and ACO,s realtedness to this network , user asks some series of questions regarding the working of router , explain him in a begineer friendly way  whata happening in the network he might ask ,he  might ask the latency change in the network ofter aco implemtation etc 
Answer the user in 4 lines with all the information needed 
"""
    

    
    model = genai.GenerativeModel(
    'gemini-2.5-flash-preview-04-17',
    system_instruction=system_instruction_prompt
)
    

    # Get or create chat session for this client
    client_id = request.headers.get('X-Client-ID', 'default')
    if client_id not in chat_sessions:
        chat_sessions[client_id] = model.start_chat(history=[])

    
    

    # Add context to the prompt
    context = f"""
    Here is the historical route data for context:
    {historical_routes}
    
    Here is the name matrix for reference:
    {name_matrix}
    
    User question: {prompt}
    """
    
    try:
        response = chat_sessions[client_id].send_message(context)
        return jsonify({'response': response.text})
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)










