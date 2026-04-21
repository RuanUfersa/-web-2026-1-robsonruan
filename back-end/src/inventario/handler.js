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

const tabela = process.env.INVENTARIO_TABLE;

exports.handler = async (event) => {
  const config = getConfig();
  const docClient = DynamoDBDocumentClient.from(new DynamoDBClient(config), { marshallOptions: { removeUndefinedValues: true } });
  
  const method = event.httpMethod || event.requestContext?.http?.method;
  const { id } = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    if (method === 'POST') {
      const { codigo, nome, tipo, sala_id, descricao, status } = body;
      if (!codigo || !nome || !tipo) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Campos obrigatórios' }) };
      }
      const material = {
        id: uuidv4(), codigo, nome, tipo, sala_id: sala_id || null,
        descricao: descricao || null, status: status || 'disponivel', data_criacao: new Date().toISOString()
      };
      await docClient.send(new PutCommand({ TableName: tabela, Item: material }));
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(material) };
    }
    
    if (method === 'GET') {
      const result = await docClient.send(new ScanCommand({ TableName: tabela }));
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.Items || []) };
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      const updates = [], expressionValues = {};
      if (body.codigo) { updates.push('#codigo = :codigo'); expressionValues[':codigo'] = body.codigo; }
      if (body.nome) { updates.push('#nome = :nome'); expressionValues[':nome'] = body.nome; }
      if (body.tipo) { updates.push('#tipo = :tipo'); expressionValues[':tipo'] = body.tipo; }
      if (body.sala_id) { updates.push('#sala_id = :sala_id'); expressionValues[':sala_id'] = body.sala_id; }
      if (body.status) { updates.push('#status = :status'); expressionValues[':status'] = body.status; }
      if (updates.length === 0) return { statusCode: 400, body: JSON.stringify({ erro: 'Nada para atualizar' }) };
      const result = await docClient.send(new UpdateCommand({ TableName: tabela, Key: { id }, UpdateExpression: `SET ${updates.join(', ')}`, ExpressionAttributeValues: expressionValues, ReturnValues: 'ALL_NEW' }));
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.Attributes) };
    }
    
    if (method === 'DELETE') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      await docClient.send(new DeleteCommand({ TableName: tabela, Key: { id } }));
      return { statusCode: 200, body: JSON.stringify({ mensagem: 'Excluído' }) };
    }
    
    return { statusCode: 405, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    console.error('Erro:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Erro' }) };
  }
};