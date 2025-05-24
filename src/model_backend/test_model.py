import google.generativeai as genai
import os

genai.configure(api_key=("AIzaSyBxdL-55wm6b_lWZyTJZhavAm1eg67VQmc"))

system_instruction_prompt = """
this is the json format of historical routes of a network 
time stamp is the id 
sourceId is the starting point 
targetid is the ending point 
path  object is the nodes involved in the  path the 2 nd elemnt in path is the router through which it travels latency is the opposostion to the flow of traffic
hops is no of jumps between nodes
congestion is a quantity to mesure traffic 

HISTROICAL ROUTES 

]the following is the name of the nodes either it may be type device or type router 
to identify when user adresses it 
NAME MATRIX
] These all objects in json format are formed using ant colony optimisation algorithms user may asks its benifits over other algorithms and ACO,s realtedness to this network , user asks some series of questions regarding the working of router , explain him in a begineer friendly way  whata happening in the network he might ask ,he  might ask the latency change in the network ofter aco implemtation etc 
Answer the user in 4 lines with all the information needed 
"""

model = genai.GenerativeModel(
    'gemini-2.5-flash-preview-04-17', 
    system_instruction=system_instruction_prompt
)


chat = model.start_chat(history=[])

print("Chat with Gemini (fine-tuned output)! Type 'quit' to end the conversation.")
print("I am designed to be concise and factual.")

while True:
    user_input = input("You: ")
    if user_input.lower() == 'quit':
        break

    try:
        response = chat.send_message(user_input)
        print("Gemini:", response.text)

    except Exception as e:
        print(f"An error occurred: {e}")
        

print("\nConversation ended.")
print("\nFull chat history (note how system instruction is not part of history):")
for message in chat.history:
    print(f"{message.role}: {message.parts[0].text}")