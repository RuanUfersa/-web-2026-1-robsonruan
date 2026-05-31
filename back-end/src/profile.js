const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const s3 = new S3Client({ region: 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: 'us-east-1' }));

const BUCKET_NAME = 'sifu-robsonruan-2026';
const TABLE_NAME = 'sifu-robsonruan';

exports.profileHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'OK' }) };
  }

  if (event.requestContext?.http?.method === 'GET') {
    return handleGet(event, headers);
  }

  return handlePut(event, headers);
};

async function handleGet(event, headers) {
  try {
    const userId = event.queryStringParameters?.id || event.queryStringParameters?.userId || '';

    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Parâmetro id é obrigatório' })
      };
    }

    const result = await dynamoDb.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id: userId }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Perfil não encontrado' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}

async function handlePut(event, headers) {
  try {
    const body = JSON.parse(event.body || '{}');
    const userId = body.id || body.userId || body.email || 'usuario_sifu';
    const nome = body.nome || body.name || 'Nao informado';
    const email = body.email || 'Nao informado';
    const fotoBase64 = body.foto || body.avatar || '';

    const item = {
      id: userId,
      nome,
      email
    };

    if (fotoBase64) {
      let raw = fotoBase64;
      if (raw.includes(',')) raw = raw.split(',')[1];
      const imageBytes = Buffer.from(raw, 'base64');
      const fileName = `profile_${userId}.png`;

      await s3.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: imageBytes,
        ContentType: 'image/png'
      }));

      item.fotoUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
    } else {
      const existing = await dynamoDb.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { id: userId }
      }));
      if (existing.Item?.fotoUrl) {
        item.fotoUrl = existing.Item.fotoUrl;
      }
    }

    await dynamoDb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Perfil atualizado com sucesso!',
        fotoUrl: item.fotoUrl || ''
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
