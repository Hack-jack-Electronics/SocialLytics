from langflow.load import run_flow_from_json
TWEAKS = {
  "Google Generative AI Embeddings-8OUsF": {},
  "AstraDB-uzyaj": {},
  "ChatInput-5Jlkw": {},
  "ChatOutput-lMVlG": {},
  "GoogleGenerativeAIModel-VIX5X": {},
  "Prompt-bbTEe": {},
  "ParseData-b3W7n": {},
  "Memory-I6yT5": {}
}

result = run_flow_from_json(flow="langflow.json",
                            input_value="message",
                            session_id="", # provide a session id if you want to use session state
                            fallback_to_env_vars=True, # False by default
                            tweaks=TWEAKS)