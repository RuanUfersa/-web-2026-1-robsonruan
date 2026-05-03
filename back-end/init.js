/**
 * Script de Inicialização do Banco de Dados
 * 
 * Este arquivo verifica e cria o banco de dados automaticamente
 * ao iniciar o servidor, se ainda não existir.
 * 
 * @author Robson Ruan
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'database', 'bd_biblioteca.db');

/**
 * Verifica se o banco já existe
 */
function bancoExiste() {
    try {
        fs.accessSync(DB_PATH, fs.constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Cria o banco e insere dados iniciais
 */
function criarBanco() {
    console.log('🔧 Criando banco de dados...');
    
    const db = new sqlite3.Database(DB_PATH);
    
    db.serialize(() => {
        // Criar tabelas
        db.run(`CREATE TABLE IF NOT EXISTS salas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            capacidade INTEGER NOT NULL,
            tipo TEXT NOT NULL,
            recursos TEXT,
            status TEXT DEFAULT 'disponivel',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS reservas (
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
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS materiais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sala_id INTEGER,
            nome TEXT NOT NULL,
            tipo TEXT NOT NULL,
            quantidade INTEGER DEFAULT 1,
            codigo_patrimonial TEXT,
            status TEXT DEFAULT 'ativo',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sala_id) REFERENCES salas(id)
        )`);
        
        db.run(`CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            matricula TEXT UNIQUE NOT NULL,
            cargo TEXT NOT NULL,
            tipo TEXT DEFAULT 'discente',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        console.log('✓ Tabelas criadas');
        
        // Seed de dados iniciais
        const salas = [
            { nome: 'Laboratório de Colaboração A', capacidade: 8, tipo: 'colaborativo', recursos: 'Ar Condicionado, 02 Mesas, 08 Cadeiras, Quadro Branco' },
            { nome: 'Cubo de Foco 204', capacidade: 2, tipo: 'foco', recursos: 'AC Central, 01 Escrivaninha, 02 Cadeiras, Monitor 24"' },
            { nome: 'Salão de Seminários B', capacidade: 30, tipo: 'seminario', recursos: 'Em reparo, 15 Mesas, 30 Cadeiras, Projetor' },
            { nome: 'Suíte Criativa 1', capacidade: 6, tipo: 'criativo', recursos: 'Ar Condicionado, Mesa Oval, 06 Cadeiras, Kit Escrita' },
            { nome: 'Sala de Reunião 101', capacidade: 12, tipo: 'reuniao', recursos: 'Ar Condicionado, 02 Mesas, 12 Cadeiras, TV, Quadro' }
        ];
        
        const stmtSala = db.prepare(`INSERT INTO salas (nome, capacidade, tipo, recursos, status) VALUES (?, ?, ?, ?, 'disponivel')`);
        salas.forEach(s => stmtSala.run(s.nome, s.capacidade, s.tipo, s.recursos));
        stmtSala.finalize();
        console.log('✓ 5 salas inseridas');
        
        const reservas = [
            { sala_id: 1, nome: 'Ricardo Silva', mat: '2023004521', cargo: 'Estudante', data: '2024-10-24', ini: '09:00', fim: '11:00', status: 'ativo' },
            { sala_id: 2, nome: 'Prof. Ana Martins', mat: '10004231', cargo: 'Staff', data: '2024-10-24', ini: '10:30', fim: '15:30', status: 'ativo' },
            { sala_id: 3, nome: 'João Mendes', mat: '2021008892', cargo: 'Estudante', data: '2024-10-24', ini: '09:00', fim: '11:00', status: 'atencao' }
        ];
        
        const stmtReserva = db.prepare(`INSERT INTO reservas (sala_id, usuario_nome, usuario_matricula, usuario_cargo, data_reserva, hora_inicio, hora_fim, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        reservas.forEach(r => stmtReserva.run(r.sala_id, r.nome, r.mat, r.cargo, r.data, r.ini, r.fim, r.status));
        stmtReserva.finalize();
        console.log('✓ 3 reservas inseridas');
        
        const materiais = [
            { sala_id: 1, nome: 'Projetor', tipo: 'eletronico', qtd: 1, cod: 'PAT-001' },
            { sala_id: 2, nome: 'Monitor 24"', tipo: 'eletronico', qtd: 1, cod: 'PAT-002' },
            { sala_id: 3, nome: 'Projetor', tipo: 'eletronico', qtd: 1, cod: 'PAT-003' }
        ];
        
        const stmtMaterial = db.prepare(`INSERT INTO materiais (sala_id, nome, tipo, quantidade, codigo_patrimonial, status) VALUES (?, ?, ?, ?, ?, 'ativo')`);
        materiais.forEach(m => stmtMaterial.run(m.sala_id, m.nome, m.tipo, m.qtd, m.cod));
        stmtMaterial.finalize();
        console.log('✓ 3 materiais inseridos');
        
        db.close(() => {
            console.log('✓ Banco de dados configurado!\n');
        });
    });
}

/**
 * Função de inicialização
 */
function init() {
    if (!bancoExiste()) {
        criarBanco();
    } else {
        console.log('✓ Banco de dados já existe\n');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    init();
}

module.exports = { init, bancoExiste };