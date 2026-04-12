import os
import json
import urllib.request
def load_env():
    with open('.env.local') as f:
        for line in f:
            if line.startswith('GEMINI_API_KEY='):
                return line.strip().split('=', 1)[1].strip('"').strip("'")
key = load_env()
req = urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models?key={key}')
with urllib.request.urlopen(req) as response:
    data = json.load(response)
    for model in data['models']:
        if 'embedContent' in model.get('supportedGenerationMethods', []):
            print(model['name'], model.get('supportedGenerationMethods'))
