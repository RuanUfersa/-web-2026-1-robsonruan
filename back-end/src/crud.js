const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({ region: 'us-east-1' });
const doc = DynamoDBDocumentClient.from(client);

const uuid = () => crypto.randomUUID();
const ok = (data, status = 200) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS' },
  body: JSON.stringify(data)
});
const err = (msg, status = 400) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify({ erro: msg })
});

const getMethod = (event) => event.httpMethod || event.requestContext?.http?.method || 'GET';
const getBody = (event) => { try { return JSON.parse(event.body || '{}'); } catch { return {}; } };
const getId = (event) => event.pathParameters?.id || '';

const scanTable = async (table) => {
  const data = await doc.send(new ScanCommand({ TableName: table }));
  return data.Items || [];
};

exports.salasHandler = async (event) => {
  const method = getMethod(event);
  const body = getBody(event);
  const id = getId(event);
  const table = 'UFERSA_Salas';

  try {
    if (method === 'OPTIONS') return ok({});

    if (method === 'POST') {
      if (!body.nome || !body.capacidade || !body.tipo) return err('Campos obrigatorios: nome, capacidade, tipo');
      const item = {
        id: uuid(), nome: body.nome, capacidade: parseInt(body.capacidade), tipo: body.tipo,
        recursos: Array.isArray(body.recursos) ? body.recursos : (body.recursos ? body.recursos.split(',').map(r => r.trim()) : []),
        status: body.status || 'disponivel', data_criacao: new Date().toISOString()
      };
      await doc.send(new PutCommand({ TableName: table, Item: item }));
      return ok(item, 201);
    }

    if (method === 'GET' && id) {
      const data = await doc.send(new GetCommand({ TableName: table, Key: { id } }));
      if (!data.Item) return err('Nao encontrado', 404);
      return ok(data.Item);
    }

    if (method === 'GET') {
      return ok(await scanTable(table));
    }

    if (method === 'PUT') {
      if (!id) return err('ID obrigatorio');
      const data = await doc.send(new GetCommand({ TableName: table, Key: { id } }));
      if (!data.Item) return err('Nao encontrado', 404);
      const update = { ...data.Item, ...body, id, data_atualizacao: new Date().toISOString() };
      if (body.capacidade) update.capacidade = parseInt(body.capacidade);
      if (body.recursos) update.recursos = Array.isArray(body.recursos) ? body.recursos : body.recursos.split(',').map(r => r.trim());
      await doc.send(new PutCommand({ TableName: table, Item: update }));
      return ok(update);
    }

    if (method === 'DELETE') {
      if (!id) return err('ID obrigatorio');
      await doc.send(new DeleteCommand({ TableName: table, Key: { id } }));
      return ok({ mensagem: 'Excluido' });
    }

    return err('Metodo nao permitido', 405);
  } catch (error) {
    console.error(error);
    return err('Erro interno: ' + error.message, 500);
  }
};

exports.reservasHandler = async (event) => {
  const method = getMethod(event);
  const body = getBody(event);
  const id = getId(event);
  const table = 'UFERSA_Reservas';

  try {
    if (method === 'OPTIONS') return ok({});

    if (method === 'POST') {
      if (!body.nome || !body.matricula || !body.data || !body.hora_inicio || !body.hora_fim) return err('Campos obrigatorios: nome, matricula, data, hora_inicio, hora_fim');
      const item = {
        id: uuid(), nome: body.nome, matricula: body.matricula, cargo: body.cargo || 'Estudante',
        sala_id: body.sala_id || null, data: body.data, hora_inicio: body.hora_inicio,
        hora_fim: body.hora_fim, status: body.status || 'ativo', data_criacao: new Date().toISOString()
      };
      await doc.send(new PutCommand({ TableName: table, Item: item }));
      return ok(item, 201);
    }

    if (method === 'GET' && id) {
      const data = await doc.send(new GetCommand({ TableName: table, Key: { id } }));
      if (!data.Item) return err('Nao encontrado', 404);
      return ok(data.Item);
    }

    if (method === 'GET') {
      return ok(await scanTable(table));
    }

    if (method === 'PUT') {
      if (!id) return err('ID obrigatorio');
      const data = await doc.send(new GetCommand({ TableName: table, Key: { id } }));
      if (!data.Item) return err('Nao encontrado', 404);
      const update = { ...data.Item, ...body, id, data_atualizacao: new Date().toISOString() };
      await doc.send(new PutCommand({ TableName: table, Item: update }));
      return ok(update);
    }

    if (method === 'DELETE') {
      if (!id) return err('ID obrigatorio');
      await doc.send(new DeleteCommand({ TableName: table, Key: { id } }));
      return ok({ mensagem: 'Excluido' });
    }

    return err('Metodo nao permitido', 405);
  } catch (error) {
    console.error(error);
    return err('Erro interno', 500);
  }
};

exports.ocorrenciasHandler = async (event) => {
  const method = getMethod(event);
  const body = getBody(event);
  const id = getId(event);
  const table = 'UFERSA_Ocorrencias';

  try {
    if (method === 'OPTIONS') return ok({});

    if (method === 'POST') {
      if (!body.aluno_nome || !body.aluno_matricula || !body.descricao) return err('Campos obrigatorios: aluno_nome, aluno_matricula, descricao');
      const item = { id: uuid(), ...body, status: 'em_analise', data_criacao: new Date().toISOString() };
      await doc.send(new PutCommand({ TableName: table, Item: item }));
      return ok(item, 201);
    }

    if (method === 'GET') {
      return ok(await scanTable(table));
    }

    if (method === 'DELETE') {
      if (!id) return err('ID obrigatorio');
      await doc.send(new DeleteCommand({ TableName: table, Key: { id } }));
      return ok({ mensagem: 'Excluido' });
    }

    return err('Metodo nao permitido', 405);
  } catch (error) {
    return err('Erro interno', 500);
  }
};

exports.inventarioHandler = async (event) => {
  const method = getMethod(event);
  const body = getBody(event);
  const id = getId(event);
  const table = 'UFERSA_Inventario';

  try {
    if (method === 'OPTIONS') return ok({});

    if (method === 'POST') {
      if (!body.codigo || !body.nome || !body.tipo) return err('Campos obrigatorios: codigo, nome, tipo');
      const item = { id: uuid(), ...body, status: 'disponivel', data_criacao: new Date().toISOString() };
      await doc.send(new PutCommand({ TableName: table, Item: item }));
      return ok(item, 201);
    }

    if (method === 'GET') {
      return ok(await scanTable(table));
    }

    if (method === 'DELETE') {
      if (!id) return err('ID obrigatorio');
      await doc.send(new DeleteCommand({ TableName: table, Key: { id } }));
      return ok({ mensagem: 'Excluido' });
    }

    return err('Metodo nao permitido', 405);
  } catch (error) {
    return err('Erro interno', 500);
  }
};

exports.indexHandler = async () => ok({ message: 'API SIFU UFERSA - OK', versao: '1.0', endpoints: ['/api/salas', '/api/reservas', '/api/ocorrencias', '/api/materiais', '/chatbot', '/profile'] });

exports.staticHandler = async (event) => {
  const path = event.requestContext?.http?.path || event.path || '/';
  return ok({ message: 'Servico nao disponivel para: ' + path, sugestao: 'O front-end esta hospedado no Amplify' });
};
