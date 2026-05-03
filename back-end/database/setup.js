/**
 * Script de Configuração do Banco de Dados SQLite
 * 
 * Este arquivo cria as tabelas do banco de dados e insere dados iniciais
 * para o sistema de gestión de библиотеки UFERSA.
 * 
 * @author Robson Ruan
 * @version 1.0.0
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Caminho do arquivo de banco de dados
 * Armazena os dados em um arquivo local para persistência
 */
const DB_PATH = path.join(__dirname, 'bd_biblioteca.db');

/**
 * Abre conexão com o banco de dados
 * Cria o arquivo automaticamente se não existir
 */
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Erro ao connectar banco:', err.message);
    } else {
        console.log('✓ Conectado ao banco:', DB_PATH);
    }
});

/**
 * Criar tabela de SALAS
 * Armazena os espaços físicos da biblioteca com suas características
 */
const criarTabelaSalas = `
CREATE TABLE IF NOT EXISTS salas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    capacidade INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    recursos TEXT,
    status TEXT DEFAULT 'disponivel',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

/**
 * Criar tabela de RESERVAS
 * Armazena os agendamentos de salas por usuarios
 */
const criarTabelaReservas = `
CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sala_id INTEGER NOT NULL,
    usuario_nome TEXT NOT NULL,
    usuario_matricula TEXT NOT NULL,
    usuario_cargo TEXT NOT NULL,
    data_reserva DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    status TEXT DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sala_id) REFERENCES salas(id)
)`;

/**
 * Criar tabela de MATERIAIS
 * Armazena itens patrimoniais das salas
 */
const criarTabelaMateriais = `
CREATE TABLE IF NOT EXISTS materiais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sala_id INTEGER,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    quantidade INTEGER DEFAULT 1,
    codigo_patrimonial TEXT,
    status TEXT DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sala_id) REFERENCES salas(id)
)`;

/**
 * Criar tabela de USUARIOS
 * Armazena dados dos usuarios do sistema
 */
const criarTabelaUsuarios = `
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    matricula TEXT UNIQUE NOT NULL,
    cargo TEXT NOT NULL,
    tipo TEXT DEFAULT 'discente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

/**
 * Dados iniciais para testar o sistema (Seed Data)
 * Insere 5 salas de exemplo
 */
const seedSalas = [
    { nome: 'Laboratório de Colaboração A', capacidade: 8, tipo: 'colaborativo', recursos: 'Ar Condicionado,02 Mesas,08 Cadeiras,Quadro Branco' },
    { nome: 'Cubo de Foco 204', capacidade: 2, tipo: 'foco', recursos: 'AC Central,01 Escrivaninha,02 Cadeiras,Monitor 24"' },
    { nome: 'Salão de Seminários B', capacidade: 30, tipo: 'seminario', recursos: 'Em reparo,15 Mesas,30 Cadeiras,Projetor' },
    { nome: 'Suíte Criativa 1', capacidade: 6, tipo: 'criativo', recursos: 'Ar Condicionado,Mesa Oval,06 Cadeiras,Kit Escrita' },
    { nome: 'Sala de Reunião 101', capacidade: 12, tipo: 'reuniao', recursos: 'Ar Condicionado,02 Mesas,12 Cadeiras,TV,Quadro' }
];

/**
 * Dados iniciais de reservas
 */
const seedReservas = [
    { sala_id: 1, usuario_nome: 'Ricardo Silva', usuario_matricula: '2023004521', usuario_cargo: 'Estudante', data_reserva: '2024-10-24', hora_inicio: '09:00', hora_fim: '11:00', status: 'ativo' },
    { sala_id: 2, usuario_nome: 'Prof. Ana Martins', usuario_matricula: '10004231', usuario_cargo: 'Staff', data_reserva: '2024-10-24', hora_inicio: '10:30', hora_fim: '15:30', status: 'ativo' },
    { sala_id: 3, usuario_nome: 'João Mendes', usuario_matricula: '2021008892', usuario_cargo: 'Estudante', data_reserva: '2024-10-24', hora_inicio: '09:00', hora_fim: '11:00', status: 'atencao' }
];

/**
 * Dados iniciais de materiais
 */
const seedMateriais = [
    { sala_id: 1, nome: 'Projetor', tipo: 'eletronico', quantidade: 1, codigo_patrimonial: 'PAT-001' },
    { sala_id: 2, nome: 'Monitor 24"', tipo: 'eletronico', quantidade: 1, codigo_patrimonial: 'PAT-002' },
    { sala_id: 3, nome: 'Projetor', tipo: 'eletronico', quantidade: 1, codigo_patrimonial: 'PAT-003' }
];

/**
 * Função principal de setup
 * Executa todas as queries de criação e seed
 */
db.serialize(() => {
    console.log('\n---Criando tabelas---\n');
    
    db.run(criarTabelaSalas, (err) => {
        if (err) console.error('Erro tabela salas:', err);
        else console.log('✓ Tabela salas criada');
    });
    
    db.run(criarTabelaReservas, (err) => {
        if (err) console.error('Erro tabela reservas:', err);
        else console.log('✓ Tabela reservas criada');
    });
    
    db.run(criarTabelaMateriais, (err) => {
        if (err) console.error('Erro tabela materiais:', err);
        else console.log('✓ Tabela materiais criada');
    });
    
    db.run(criarTabelaUsuarios, (err) => {
        if (err) console.error('Erro tabela usuarios:', err);
        else console.log('✓ Tabela usuarios criada');
    });

    /**
     * após criar tabelas, inserir dados iniciais
     */
    db.run(`SELECT COUNT(*) as total FROM salas`, (err, row) => {
        if (row && row.total === 0) {
            console.log('\n---Inserindo dados iniciais---\n');
            
            const stmtSalas = db.prepare(`INSERT INTO salas (nome, capacidade, tipo, recursos, status) VALUES (?, ?, ?, ?, ?)`);
            seedSalas.forEach(sala => {
                stmtSalas.run(sala.nome, sala.capacidade, sala.tipo, sala.recursos, 'disponivel');
            });
            stmtSalas.finalize();
            console.log('✓ 5 salas inseridas');
            
            const stmtReservas = db.prepare(`INSERT INTO reservas (sala_id, usuario_nome, usuario_matricula, usuario_cargo, data_reserva, hora_inicio, hora_fim, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            seedReservas.forEach(reserva => {
                stmtReservas.run(reserva.sala_id, reserva.usuario_nome, reserva.usuario_matricula, reserva.usuario_cargo, reserva.data_reserva, reserva.hora_inicio, reserva.hora_fim, reserva.status);
            });
            stmtReservas.finalize();
            console.log('✓ 3 reservas inseridas');
            
            const stmtMateriais = db.prepare(`INSERT INTO materiais (sala_id, nome, tipo, quantidade, codigo_patrimonial, status) VALUES (?, ?, ?, ?, ?, ?)`);
            seedMateriais.forEach(material => {
                stmtMateriais.run(material.sala_id, material.nome, material.tipo, material.quantidade, material.codigo_patrimonial, 'ativo');
            });
            stmtMateriais.finalize();
            console.log('✓ 3 materiais inseridos');
            
            console.log('\n=== Banco de dados configurado! ===\n');
        } else {
            console.log('✓ Dados já existem, pulando seed');
        }
        
        db.close();
    });
});