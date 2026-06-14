const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3 = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = 'sifu-robsonruan-2026';

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

const minDesdeMeiaNoite = (h) => {
  if (!h || !h.includes(':')) return 0;
  const p = h.split(':');
  return parseInt(p[0]) * 60 + parseInt(p[1]);
};

const validarHorarioReserva = (data, hora_inicio, hora_fim, editando = false) => {
  if (!hora_inicio || !hora_fim) return 'Defina o horário de início e término';
  if (hora_inicio >= hora_fim) return 'Horário de início deve ser anterior ao horário de término';
  const duracao = minDesdeMeiaNoite(hora_fim) - minDesdeMeiaNoite(hora_inicio);
  if (duracao < 30) return 'Reserva deve ter no mínimo 30 minutos';
  if (duracao > 240) return 'Reserva deve ter no máximo 4 horas';
  if (!editando) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataReserva = new Date(data + 'T00:00:00');
    if (dataReserva < hoje) return 'Data da reserva não pode ser no passado';
  }
  return null;
};

const verificarConflitoReserva = async (sala_id, data, hora_inicio, hora_fim, excluirId = null) => {
  if (!sala_id) return false;
  const existentes = await scanTable('UFERSA_Reservas');
  return existentes.some(r =>
    r.id !== excluirId &&
    r.sala_id === sala_id &&
    r.data === data &&
    r.status !== 'cancelado' &&
    r.hora_inicio < hora_fim &&
    hora_inicio < r.hora_fim
  );
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

      const erroHorario = validarHorarioReserva(body.data, body.hora_inicio, body.hora_fim);
      if (erroHorario) return err(erroHorario);

      if (body.sala_id) {
        const conflito = await verificarConflitoReserva(body.sala_id, body.data, body.hora_inicio, body.hora_fim);
        if (conflito) return err('Já existe uma reserva para esta sala neste horário');
      }

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

      if (body.hora_inicio || body.hora_fim || body.data) {
        const hInicio = body.hora_inicio || data.Item.hora_inicio;
        const hFim = body.hora_fim || data.Item.hora_fim;
        const dataReserva = body.data || data.Item.data;
        const erroHorario = validarHorarioReserva(dataReserva, hInicio, hFim, true);
        if (erroHorario) return err(erroHorario);
      }

      const salaId = body.sala_id || data.Item.sala_id;
      const dataReserva = body.data || data.Item.data;
      const hInicio = body.hora_inicio || data.Item.hora_inicio;
      const hFim = body.hora_fim || data.Item.hora_fim;
      if (salaId) {
        const conflito = await verificarConflitoReserva(salaId, dataReserva, hInicio, hFim, id);
        if (conflito) return err('Já existe uma reserva para esta sala neste horário');
      }

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

async function uploadFoto(base64) {
  let raw = base64;
  if (raw.includes(',')) raw = raw.split(',')[1];
  const imageBytes = Buffer.from(raw, 'base64');
  const fileName = `ocorrencia_${uuid()}.png`;
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET_NAME, Key: fileName, Body: imageBytes, ContentType: 'image/png'
  }));
  return `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
}

exports.ocorrenciasHandler = async (event) => {
  const method = getMethod(event);
  const body = getBody(event);
  const id = getId(event);
  const table = 'UFERSA_Ocorrencias';

  try {
    if (method === 'OPTIONS') return ok({});

    if (method === 'POST') {
      if (!body.aluno_nome || !body.aluno_matricula || !body.descricao) return err('Campos obrigatorios: aluno_nome, aluno_matricula, descricao');
      if (body.foto_base64) {
        body.foto_url = await uploadFoto(body.foto_base64);
        delete body.foto_base64;
      }
      const item = { id: uuid(), ...body, status: 'em_analise', data_criacao: new Date().toISOString() };
      await doc.send(new PutCommand({ TableName: table, Item: item }));
      return ok(item, 201);
    }

    if (method === 'GET') {
      return ok(await scanTable(table));
    }

    if (method === 'PUT') {
      if (!id) return err('ID obrigatorio');
      const data = await doc.send(new GetCommand({ TableName: table, Key: { id } }));
      if (!data.Item) return err('Nao encontrado', 404);
      if (body.foto_base64) {
        body.foto_url = await uploadFoto(body.foto_base64);
        delete body.foto_base64;
      }
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
      if (id) {
        const data = await doc.send(new GetCommand({ TableName: table, Key: { id } }));
        if (!data.Item) return err('Nao encontrado', 404);
        return ok(data.Item);
      }
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
    return err('Erro interno', 500);
  }
};

exports.indexHandler = async () => ok({ message: 'API SIFU UFERSA - OK', versao: '1.0', endpoints: ['/api/salas', '/api/reservas', '/api/ocorrencias', '/api/materiais', '/chatbot', '/profile'] });

exports.staticHandler = async (event) => {
  const path = event.requestContext?.http?.path || event.path || '/';
  return ok({ message: 'Servico nao disponivel para: ' + path, sugestao: 'O front-end esta hospedado no Amplify' });
};
