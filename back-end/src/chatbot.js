const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const https = require('https');

const client = new DynamoDBClient({ region: 'us-east-1' });
const doc = DynamoDBDocumentClient.from(client);

const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-1.5-pro'
];

function callGeminiWithModel(prompt, model) {
  const apiKey = process.env.GEMINI_API_KEY;
  const data = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }]
  });

  return new Promise((resolve, reject) => {
    const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          console.log(`Gemini [${model}] response:`, JSON.stringify(json));
          if (json.error) {
            const msg = json.error.message || '';
            if (res.statusCode === 429 || res.statusCode === 503 || msg.includes('high demand') || msg.includes('not found') || msg.includes('not supported') || msg.includes('RATE_LIMIT')) {
              reject(new Error(`SKIP:${msg}`));
              return;
            }
            resolve(`Desculpe, erro da IA: ${msg}`);
            return;
          }
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          resolve(text || 'Desculpe, nao consegui processar.');
        } catch {
          reject(new Error('Falha ao parsear resposta do Gemini'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function callGemini(prompt) {
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    try {
      return await callGeminiWithModel(prompt, model);
    } catch (err) {
      lastError = err.message;
      console.warn(`Model ${model} indisponivel: ${err.message}`);
    }
  }
  return `Desculpe, erro da IA: todos os modelos estao temporariamente indisponiveis (${lastError}). Tente novamente mais tarde.`;
}

exports.chatbotHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const userMessage = body.chat || '';

    if (!userMessage) {
      return { statusCode: 400, headers, body: JSON.stringify({ message: 'Mensagem vazia.' }) };
    }

    const claims = event.requestContext?.authorizer?.jwt?.claims || {};
    const userId = claims.sub || 'usuario_anonimo';

    const iaReply = await callGemini(userMessage);

    const table = process.env.CHAT_TABLE || 'sifu-robsonruan-chat';
    const timestamp = new Date().toISOString();

    await doc.send(new PutCommand({
      TableName: table,
      Item: { userId, timestamp: `${timestamp}_USER`, role: 'user', message: userMessage }
    }));

    await doc.send(new PutCommand({
      TableName: table,
      Item: { userId, timestamp: `${timestamp}_BOT`, role: 'bot', message: iaReply }
    }));

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ message: iaReply })
    };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
