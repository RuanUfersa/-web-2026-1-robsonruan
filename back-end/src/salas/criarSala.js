const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const config = { region: 'localhost' };
if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  config.credentials = { accessKeyId: 'local', secretAccessKey: 'local' };
}

const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } });

const tabela = process.env.SALAS_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { nome, capacidade, tipo, recursos, status } = body;
    
    if (!nome || !capacidade || !tipo) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Campos obrigatórios' }) };
    }
    
    const id = uuidv4();
    let recursosArray = [];
    if (recursos) {
      recursosArray = typeof recursos === 'string' ? recursos.split(',').map(r => r.trim()) : recursos;
    }
    
    const sala = {
      id, nome, capacidade: parseInt(capacidade), tipo, recursos: recursosArray,
      status: status || 'disponivel', data_criacao: new Date().toISOString()
    };
    
    await docClient.send(new PutCommand({ TableName: tabela, Item: sala }));
    
    return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sala) };
  } catch (error) {
    console.error('Erro:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Erro' }) };
  }
};