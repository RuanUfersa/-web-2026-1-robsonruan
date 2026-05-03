/**
 * Rotas da API para Gestão de Salas
 * 
 * Este arquivo define os endpoints REST para CRUD de salas:
 * - GET /api/salas - Lista todas as salas
 * - GET /api/salas/:id - Lista uma sala específica
 * - POST /api/salas - Cria nova sala
 * - PUT /api/salas/:id - Atualiza sala
 * - DELETE /api/salas/:id - Remove sala
 * 
 * @author Robson Ruan
 */

const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

/**
 * Conexão com banco de dados
 */
const DB_PATH = path.join(__dirname, '..', 'database', 'bd_biblioteca.db');
const db = new sqlite3.Database(DB_PATH);

/**
 * GET /api/salas
 * Lista todas as salas cadastradas
 * Retorna: Array de objetos sala
 */
router.get('/', (req, res) => {
    db.all(`SELECT * FROM salas ORDER BY id`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ erro: err.message });
            return;
        }
        res.json(rows);
    });
});

/**
 * GET /api/salas/:id
 * Lista uma sala específica pelo ID
 * Retorna: Objeto sala ou erro 404
 */
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT * FROM salas WHERE id = ?`, [id], (err, row) => {
        if (err) {
            res.status(500).json({ erro: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ erro: 'Sala não encontrada' });
            return;
        }
        res.json(row);
    });
});

/**
 * POST /api/salas
 * Cria uma nova sala
 * Body: { nome, capacidade, tipo, recursos, status }
 * Retorna: ID da sala criada
 */
router.post('/', (req, res) => {
    const { nome, capacidade, tipo, recursos, status } = req.body;
    
    if (!nome || !capacidade || !tipo) {
        res.status(400).json({ erro: 'Campos obrigatórios: nome, capacidade, tipo' });
        return;
    }
    
    const sql = `INSERT INTO salas (nome, capacidade, tipo, recursos, status) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [nome, capacidade, tipo, recursos || '', status || 'disponivel'], function(err) {
        if (err) {
            res.status(500).json({ erro: err.message });
            return;
        }
        res.status(201).json({ id: this.lastID, mensagem: 'Sala criada com sucesso' });
    });
});

/**
 * PUT /api/salas/:id
 * Atualiza uma sala existente
 * Body: { nome, capacidade, tipo, recursos, status }
 * Retorna: Sucesso ou erro
 */
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { nome, capacidade, tipo, recursos, status } = req.body;
    
    const sql = `
        UPDATE salas 
        SET nome = COALESCE(?, nome),
            capacidade = COALESCE(?, capacidade),
            tipo = COALESCE(?, tipo),
            recursos = COALESCE(?, recursos),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;
    
    db.run(sql, [nome, capacidade, tipo, recursos, status, id], function(err) {
        if (err) {
            res.status(500).json({ erro: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ erro: 'Sala não encontrada' });
            return;
        }
        res.json({ mensagem: 'Sala atualizada com sucesso' });
    });
});

/**
 * DELETE /api/salas/:id
 * Remove uma sala pelo ID
 * Retorna: Sucesso ou erro
 */
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    
    db.run(`DELETE FROM salas WHERE id = ?`, [id], function(err) {
        if (err) {
            res.status(500).json({ erro: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ erro: 'Sala não encontrada' });
            return;
        }
        res.json({ mensagem: 'Sala removida com sucesso' });
    });
});

module.exports = router;