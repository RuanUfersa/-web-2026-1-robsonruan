const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, GetCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const getConfig = () => {
  const config = { region: 'localhost' };
  if (process.env.DYNAMODB_ENDPOINT) {
    config.endpoint = process.env.DYNAMODB_ENDPOINT;
    config.credentials = { accessKeyId: 'local', secretAccessKey: 'local' };
  }
  return config;
};

const tabela = process.env.SALAS_TABLE;

exports.handler = async (event) => {
  const config = getConfig();
  const docClient = DynamoDBDocumentClient.from(new DynamoDBClient(config), { marshallOptions: { removeUndefinedValues: true } });
  
  const method = event.httpMethod || event.requestContext?.http?.method;
  const { id } = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    if (method === 'POST') {
      const { nome, capacidade, tipo, recursos, status } = body;
      if (!nome || !capacidade || !tipo) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Campos obrigatórios' }) };
      }
      const salle = {
        id: uuidv4(), nome, capacidade: parseInt(capacidade), tipo,
        recursos: typeof recursos === 'string' ? recursos.split(',').map(r => r.trim()) : (recursos || []),
        status: status || 'disponivel', data_criacao: new Date().toISOString()
      };
      await docClient.send(new PutCommand({ TableName: tabela, Item: salle }));
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(salle) };
    }
    
    if (method === 'GET') {
      const result = await docClient.send(new ScanCommand({ TableName: tabela }));
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.Items || []) };
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      const existente = await docClient.send(new GetCommand({ TableName: tabela, Key: { id } }));
      if (!existente.Item) return { statusCode: 404, body: JSON.stringify({ erro: 'Não encontrado' }) };
      
      const updates = [], expressionValues = {};
      if (body.nome) { updates.push('#nome = :nome'); expressionValues[':nome'] = body.nome; }
      if (body.capacidade) { updates.push('#capacidade = :capacidade'); expressionValues[':capacidade'] = parseInt(body.capacidade); }
      if (body.tipo) { updates.push('#tipo = :tipo'); expressionValues[':tipo'] = body.tipo; }
      if (body.recursos) { updates.push('#recursos = :recursos'); expressionValues[':recursos'] = typeof body.recursos === 'string' ? body.recursos.split(',').map(r => r.trim()) : body.recursos; }
      if (body.status) { updates.push('#status = :status'); expressionValues[':status'] = body.status; }
      
      if (updates.length === 0) return { statusCode: 400, body: JSON.stringify({ erro: 'Nada para atualizar' }) };
      updates.push('#data_atualizacao = :data_atualizacao');
      expressionValues[':data_atualizacao'] = new Date().toISOString();
      
      const result = await docClient.send(new UpdateCommand({ TableName: tabela, Key: { id }, UpdateExpression: `SET ${updates.join(', ')}`, ExpressionAttributeValues: expressionValues, ReturnValues: 'ALL_NEW' }));
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.Attributes) };
    }
    
    if (method === 'DELETE') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      const existente = await docClient.send(new GetCommand({ TableName: tabela, Key: { id } }));
      if (!existente.Item) return { statusCode: 404, body: JSON.stringify({ erro: 'Não encontrado' }) };
      await docClient.send(new DeleteCommand({ TableName: tabela, Key: { id } }));
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensagem: 'Excluído' }) };
    }
    
    return { statusCode: 405, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    console.error('Erro:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Erro' }) };
  }
};