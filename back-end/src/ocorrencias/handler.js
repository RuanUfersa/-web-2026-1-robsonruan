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

const tabela = process.env.OCORRENCIAS_TABLE;

exports.handler = async (event) => {
  const config = getConfig();
  const docClient = DynamoDBDocumentClient.from(new DynamoDBClient(config), { marshallOptions: { removeUndefinedValues: true } });
  
  const method = event.httpMethod || event.requestContext?.http?.method;
  const { id } = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    if (method === 'POST') {
      const { aluno_nome, aluno_matricula, sala_id, descricao, foto_url } = body;
      if (!aluno_nome || !aluno_matricula || !descricao) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Campos obrigatórios' }) };
      }
      const occ = {
        id: uuidv4(), aluno_nome, aluno_matricula, sala_id: sala_id || null, descricao,
        foto_url: foto_url || null, status: 'em_analise', data_criacao: new Date().toISOString()
      };
      await docClient.send(new PutCommand({ TableName: tabela, Item: occ }));
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(occ) };
    }
    
    if (method === 'GET') {
      const result = await docClient.send(new ScanCommand({ TableName: tabela }));
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result.Items || []) };
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      const updates = [], expressionValues = {};
      if (body.aluno_nome) { updates.push('#aluno_nome = :aluno_nome'); expressionValues[':aluno_nome'] = body.aluno_nome; }
      if (body.aluno_matricula) { updates.push('#aluno_matricula = :aluno_matricula'); expressionValues[':aluno_matricula'] = body.aluno_matricula; }
      if (body.descricao) { updates.push('#descricao = :descricao'); expressionValues[':descricao'] = body.descricao; }
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