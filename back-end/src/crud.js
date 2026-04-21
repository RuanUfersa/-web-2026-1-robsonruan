const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

const loadDB = () => {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    }
  } catch (e) {
    console.log('Erro ao carregar DB:', e.message);
  }
  return {
    UFERSA_Salas: [],
    UFERSA_Reservas: [],
    UFERSA_Ocorrencias: [],
    UFERSA_Inventario: []
  };
};

const saveDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('Erro ao salvar DB:', e.message);
  }
};

const getTabela = (nome) => loadDB()[nome] || [];
const setTabela = (nome, dados) => {
  const db = loadDB();
  db[nome] = dados;
  saveDB(db);
};

const tabelaSalas = 'UFERSA_Salas';
const tabelaReservas = 'UFERSA_Reservas';
const tabelaOcorrencias = 'UFERSA_Ocorrencias';
const tabelaInventario = 'UFERSA_Inventario';

exports.salasHandler = async (event) => {
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
      const salas = getTabela(tabelaSalas);
      salas.push(salle);
      setTabela(tabelaSalas, salas);
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(salle) };
    }
    
    if (method === 'GET') {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getTabela(tabelaSalas)) };
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      const salas = getTabela(tabelaSalas);
      const idx = salas.findIndex(s => s.id === id);
      if (idx === -1) return { statusCode: 404, body: JSON.stringify({ erro: 'Não encontrado' }) };
      if (body.nome) salas[idx].nome = body.nome;
      if (body.capacidade) salas[idx].capacidade = parseInt(body.capacidade);
      if (body.tipo) salas[idx].tipo = body.tipo;
      if (body.recursos) salas[idx].recursos = typeof body.recursos === 'string' ? body.recursos.split(',').map(r => r.trim()) : body.recursos;
      if (body.status) salas[idx].status = body.status;
      salas[idx].data_atualizacao = new Date().toISOString();
      setTabela(tabelaSalas, salas);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(salas[idx]) };
    }
    
    if (method === 'DELETE') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      const salas = getTabela(tabelaSalas);
      const idx = salas.findIndex(s => s.id === id);
      if (idx === -1) return { statusCode: 404, body: JSON.stringify({ erro: 'Não encontrado' }) };
      salas.splice(idx, 1);
      setTabela(tabelaSalas, salas);
      return { statusCode: 200, body: JSON.stringify({ mensagem: 'Excluído' }) };
    }
    
    return { statusCode: 405, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    console.error('Erro:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ erro: 'Erro' }) };
  }
};

exports.reservasHandler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const { id } = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    if (method === 'POST') {
      const { nome, matricula, cargo, sala_id, data, hora_inicio, hora_fim, status } = body;
      if (!nome || !matricula || !data || !hora_inicio || !hora_fim) {
        return { statusCode: 400, body: JSON.stringify({ erro: 'Campos obrigatórios' }) };
      }
      const reserva = {
        id: uuidv4(), nome, matricula, cargo: cargo || 'Estudante', sala_id: sala_id || null,
        data, hora_inicio, hora_fim, status: status || 'ativo', data_criacao: new Date().toISOString()
      };
      const reservas = getTabela(tabelaReservas);
      reservas.push(reserva);
      setTabela(tabelaReservas, reservas);
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reserva) };
    }
    
    if (method === 'GET') {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getTabela(tabelaReservas)) };
    }
    
    if (method === 'PUT' || method === 'PATCH') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      const reservas = getTabela(tabelaReservas);
      const idx = reservas.findIndex(r => r.id === id);
      if (idx === -1) return { statusCode: 404, body: JSON.stringify({ erro: 'Não encontrado' }) };
      Object.assign(reservas[idx], body, { data_atualizacao: new Date().toISOString() });
      setTabela(tabelaReservas, reservas);
      return { statusCode: 200, body: JSON.stringify(reservas[idx]) };
    }
    
    if (method === 'DELETE') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      const reservas = getTabela(tabelaReservas);
      const idx = reservas.findIndex(r => r.id === id);
      if (idx === -1) return { statusCode: 404, body: JSON.stringify({ erro: 'Não encontrado' }) };
      reservas.splice(idx, 1);
      setTabela(tabelaReservas, reservas);
      return { statusCode: 200, body: JSON.stringify({ mensagem: 'Excluído' }) };
    }
    
    return { statusCode: 405, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ erro: 'Erro' }) };
  }
};

exports.ocorrenciasHandler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const { id } = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    if (method === 'POST') {
      const { aluno_nome, aluno_matricula, descricao } = body;
      if (!aluno_nome || !aluno_matricula || !descricao) {
        return { statusCode: 400, body: JSON.stringify({ erro: 'Campos obrigatórios' }) };
      }
      const occ = { id: uuidv4(), ...body, status: 'em_analise', data_criacao: new Date().toISOString() };
      const occs = getTabela(tabelaOcorrencias);
      occs.push(occ);
      setTabela(tabelaOcorrencias, occs);
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(occ) };
    }
    
    if (method === 'GET') {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getTabela(tabelaOcorrencias)) };
    }
    
    if (method === 'DELETE') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      const occs = getTabela(tabelaOcorrencias);
      const idx = occs.findIndex(o => o.id === id);
      if (idx === -1) return { statusCode: 404, body: JSON.stringify({ erro: 'Não encontrado' }) };
      occs.splice(idx, 1);
      setTabela(tabelaOcorrencias, occs);
      return { statusCode: 200, body: JSON.stringify({ mensagem: 'Excluído' }) };
    }
    
    return { statusCode: 405, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ erro: 'Erro' }) };
  }
};

exports.inventarioHandler = async (event) => {
  const method = event.httpMethod || event.requestContext?.http?.method;
  const { id } = event.pathParameters || {};
  const body = event.body ? JSON.parse(event.body) : {};
  
  try {
    if (method === 'POST') {
      const { codigo, nome, tipo } = body;
      if (!codigo || !nome || !tipo) {
        return { statusCode: 400, body: JSON.stringify({ erro: 'Campos obrigatórios' }) };
      }
      const mat = { id: uuidv4(), ...body, status: 'disponivel', data_criacao: new Date().toISOString() };
      const mats = getTabela(tabelaInventario);
      mats.push(mat);
      setTabela(tabelaInventario, mats);
      return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(mat) };
    }
    
    if (method === 'GET') {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(getTabela(tabelaInventario)) };
    }
    
    if (method === 'DELETE') {
      if (!id) return { statusCode: 400, body: JSON.stringify({ erro: 'ID obrigatório' }) };
      const mats = getTabela(tabelaInventario);
      const idx = mats.findIndex(m => m.id === id);
      if (idx === -1) return { statusCode: 404, body: JSON.stringify({ erro: 'Não encontrado' }) };
      mats.splice(idx, 1);
      setTabela(tabelaInventario, mats);
      return { statusCode: 200, body: JSON.stringify({ mensagem: 'Excluído' }) };
    }
    
    return { statusCode: 405, body: JSON.stringify({ erro: 'Método não permitido' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ erro: 'Erro' }) };
  }
};