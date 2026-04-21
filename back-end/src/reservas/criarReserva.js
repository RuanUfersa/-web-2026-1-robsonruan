const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tabela = process.env.RESERVAS_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    
    const { nome, matricula, cargo, sala_id, data, hora_inicio, hora_fim, status } = body;
    
    if (!nome || !matricula || !data || !hora_inicio || !hora_fim) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Campos obrigatórios: nome, matricula, data, hora_inicio, hora_fim' })
      };
    }
    
    const id = uuidv4();
    
    const reserva = {
      id,
      nome,
      matricula,
      cargo: cargo || 'Estudante',
      sala_id: sala_id || null,
      data,
      hora_inicio,
      hora_fim,
      status: status || 'ativo',
      data_criacao: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: tabela,
      Item: reserva
    }));
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reserva)
    };
    
  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Erro ao criar reserva' })
    };
  }
};