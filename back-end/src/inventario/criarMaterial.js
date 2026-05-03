const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tabela = process.env.INVENTARIO_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    
    const { codigo, nome, tipo, sala_id, descricao, status } = body;
    
    if (!codigo || !nome || !tipo) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ erro: 'Campos obrigatórios: codigo, nome, tipo' })
      };
    }
    
    const id = uuidv4();
    
    const material = {
      id,
      codigo,
      nome,
      tipo,
      sala_id: sala_id || null,
      descricao: descricao || null,
      status: status || 'disponivel',
      data_criacao: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({
      TableName: tabela,
      Item: material
    }));
    
    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material)
    };
    
  } catch (error) {
    console.error('Erro ao criar material:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ erro: 'Erro ao criar material' })
    };
  }
};