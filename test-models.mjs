import fs from 'fs';
import https from 'https';

const env = fs.readFileSync('.env.local', 'utf8');
const key = env.split('\n').find(line => line.startsWith('GEMINI_API_KEY=')).split('=')[1].trim();

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const json = JSON.parse(data);
    if (!json.models) {
        console.log(json);
        return;
    }
    json.models.forEach((model) => {
      if (model.supportedGenerationMethods && model.supportedGenerationMethods.includes('embedContent')) {
        console.log(model.name, model.supportedGenerationMethods);
      }
    });
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
