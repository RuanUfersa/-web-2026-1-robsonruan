const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const https = require('https');

const client = new DynamoDBClient({ region: 'us-east-1' });
const doc = DynamoDBDocumentClient.from(client);

const GEMINI_MODELS = [
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
  'gemini-2.0-flash',
  'gemini-1.5-pro'
];

const SYSTEM_PROMPT = `Você é o assistente virtual do SIFU da UFERSA. Criador: Robson Ruan. Fonte de conhecimento: dados do banco abaixo.
Regras da biblioteca (informe só se perguntado): devolução 7 dias, multa R$ 2,00/dia.
IMPORTANTE: responda APENAS a última pergunta. NÃO misture assuntos. NÃO liste regras a menos que seja solicitado.`;

const TABLE_KEYWORDS = {
  'UFERSA_Salas': ['sala', 'salas', 'laborat\u00f3rio', 'laboratorio', 'ambiente', 'sala de estudo'],
  'UFERSA_Inventario': ['material', 'materiais', 'invent\u00e1rio', 'inventario', 'item', 'itens', 'equipamento'],
  'UFERSA_Reservas': ['reserva', 'reservas', 'agendamento', 'emprestimo', 'empr\u00e9stimo'],
  'UFERSA_Ocorrencias': ['ocorr\u00eancia', 'ocorrencia', 'ocorr\u00eancias', 'ocorrencias', 'problema', 'report']
};

async function detectTable(message) {
  const lower = message.toLowerCase();
  for (const [table, keywords] of Object.entries(TABLE_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return table;
    }
  }
  return null;
}

async function getTableData(tableName) {
  const data = await doc.send(new ScanCommand({ TableName: tableName }));
  return data.Items || [];
}

async function queryHistory(userId, limit = 10) {
  const params = {
    TableName: process.env.CHAT_TABLE || 'sifu-robsonruan-chat',
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false,
    Limit: limit
  };
  const result = await doc.send(new QueryCommand(params));
  return result.Items || [];
}

function buildConversationContext(history, userMessage) {
  const sorted = history.reverse();
  const contents = [];
  for (const item of sorted) {
    contents.push({
      role: item.role === 'bot' ? 'model' : 'user',
      parts: [{ text: item.message }]
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });
  return contents;
}

function callGeminiWithModel(contents, systemInstruction, model) {
  const apiKey = process.env.GEMINI_API_KEY;
  const data = JSON.stringify({
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents
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

async function callGemini(contents, systemInstruction) {
  let lastError = '';
  for (const model of GEMINI_MODELS) {
    try {
      return await callGeminiWithModel(contents, systemInstruction, model);
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

    const tableName = await detectTable(userMessage);
    let dataContext = '';
    if (tableName) {
      const items = await getTableData(tableName);
      dataContext = `\n\nDados atuais da tabela ${tableName} (responda com base nesses dados):\n${JSON.stringify(items, null, 2)}`;
    }

    const history = await queryHistory(userId);
    const contents = buildConversationContext(history, userMessage);
    const iaReply = await callGemini(contents, SYSTEM_PROMPT + dataContext);

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
