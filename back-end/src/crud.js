const { v4: uuidv4 } = require('uuid');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const isLocal = process.env.IS_LOCAL || process.env.STAGE === 'dev';
const dynamoClient = new DynamoDBClient({
  region: 'us-east-1',
  endpoint: isLocal ? 'http://localhost:8000' : undefined,
  tls: isLocal ? false : true
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const tabelaSalas = process.env.SALAS_TABLE || 'UFERSA_Salas';
const tabelaReservas = process.env.RESERVAS_TABLE || 'UFERSA_Reservas';
const tabelaOcorrencias = process.env.OCORRENCIAS_TABLE || 'UFERSA_Ocorrencias';
const tabelaInventario = process.env.INVENTARIO_TABLE || 'UFERSA_Inventario';

const tabelaSalas2 = 'UFERSA_Salas';
const tabelaReservas2 = 'UFERSA_Reservas';
const tabelaOcorrencias2 = 'UFERSA_Ocorrencias';
const tabelaInventario2 = 'UFERSA_Inventario';

async function getAll(table) {
  const result = await docClient.send(new ScanCommand({ TableName: table }));
  return result.Items || [];
}

async function getById(table, id) {
  const result = await docClient.send(new GetCommand({
    TableName: table,
    Key: { id }
  }));
  return result.Item;
}

async function create(table, item) {
  await docClient.send(new PutCommand({
    TableName: table,
    Item: item
  }));
  return item;
}

async function update(table, id, data) {
  const item = await getById(table, id);
  if (!item) return null;
  
  const updated = { ...item, ...data, data_atualizacao: new Date().toISOString() };
  await docClient.send(new PutCommand({
    TableName: table,
    Item: updated
  }));
  return updated;
}

async function remove(table, id) {
  await docClient.send(new DeleteCommand({
    TableName: table,
    Key: { id }
  }));
  return { mensagem: 'Excluído' };
}

exports.salasHandler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const pathParts = (event.path || '').split('/').filter(Boolean);
  const id = pathParts[pathParts.length - 1] || (event.pathParameters ? event.pathParameters.id : null);
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    if (method === 'GET' && !id) {
      const salas = await getAll(tabelaSalas2);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(salas) };
    }
    if (method === 'GET' && id) {
      const sala = await getById(tabelaSalas2, id);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sala || {}) };
    }
    if (method === 'POST') {
      const { nome, capacidade, tipo, recursos, status } = body;
      if (!nome || !capacidade || !tipo) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Campos obrigatórios' }) };
      }
      const salle = {
        id: uuidv4(), 
        nome, 
        capacidade: parseInt(capacidade), 
        tipo,
        recursos: typeof recursos === 'string' ? recursos : (recursos || []),
        status: status || 'disponivel', 
        data_criacao: new Date().toISOString()
      };
      await create(tabelaSalas2, salle);
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(salle) };
    }
    if (method === 'PUT' && id) {
      const updated = await update(tabelaSalas2, id, body);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated || { erro: 'Não encontrado' }) };
    }
    if (method === 'DELETE' && id) {
      await remove(tabelaSalas2, id);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensagem: 'Excluído' }) };
    }
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: error.message }) };
  }
};

exports.reservasHandler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const pathParts = (event.path || '').split('/').filter(Boolean);
  const id = pathParts[pathParts.length - 1] || (event.pathParameters ? event.pathParameters.id : null);
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    if (method === 'GET' && !id) {
      const reservas = await getAll(tabelaReservas2);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reservas) };
    }
    if (method === 'GET' && id) {
      const reserva = await getById(tabelaReservas2, id);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reserva || {}) };
    }
    if (method === 'POST') {
      const { nome, capacidade, tipo, recursos, status } = body;
      const reserva = {
        id: uuidv4(), 
        ...body,
        status: status || 'ativo', 
        data_criacao: new Date().toISOString()
      };
      await create(tabelaReservas2, reserva);
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reserva) };
    }
    if (method === 'PUT' && id) {
      const updated = await update(tabelaReservas2, id, body);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updated || { erro: 'Não encontrado' }) };
    }
    if (method === 'DELETE' && id) {
      await remove(tabelaReservas2, id);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensagem: 'Excluído' }) };
    }
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: error.message }) };
  }
};

exports.ocorrenciasHandler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const pathParts = (event.path || '').split('/').filter(Boolean);
  const id = pathParts[pathParts.length - 1] || (event.pathParameters ? event.pathParameters.id : null);
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    if (method === 'GET' && !id) {
      const ocorrencias = await getAll(tabelaOcorrencias2);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ocorrencias) };
    }
    if (method === 'POST') {
      const occ = {
        id: uuidv4(), 
        ...body,
        status: body.status || 'em_analise', 
        data_criacao: new Date().toISOString()
      };
      await create(tabelaOcorrencias2, occ);
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(occ) };
    }
    if (method === 'DELETE' && id) {
      await remove(tabelaOcorrencias2, id);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensagem: 'Excluído' }) };
    }
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: error.message }) };
  }
};

exports.inventarioHandler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const pathParts = (event.path || '').split('/').filter(Boolean);
  const id = pathParts[pathParts.length - 1] || (event.pathParameters ? event.pathParameters.id : null);
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    if (method === 'GET' && !id) {
      const materiais = await getAll(tabelaInventario2);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(materiais) };
    }
    if (method === 'POST') {
      const mat = {
        id: uuidv4(), 
        ...body,
        status: body.status || 'disponivel', 
        data_criacao: new Date().toISOString()
      };
      await create(tabelaInventario2, mat);
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mat) };
    }
    if (method === 'DELETE' && id) {
      await remove(tabelaInventario2, id);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mensagem: 'Excluído' }) };
    }
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: error.message }) };
  }
};

exports.staticHandler = async (event) => {
  return { statusCode: 200, headers: { 'Content-Type': 'text/html' }, body: '<h1>Site Estático</h1><p>Configure o S3 para hospedar o front-end</p>' };
};

exports.indexHandler = async (event) => {
  return { statusCode: 200, headers: { 'Content-Type': 'text/html' }, body: '<h1>SIFU Biblioteca UFERSA</h1><p>API funcionando com Serverless</p>' };
};