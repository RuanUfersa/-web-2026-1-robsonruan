/**
 * Rotas da API para Reservas e Empréstimos
 * 
 * Este arquivo define os endpoints REST para CRUD de reservas:
 * - GET /api/reservas - Lista todas as reservas
 * - GET /api/reservas/:id - Lista uma reserva específica
 * - POST /api/reservas - Cria nova reserva
 * - PUT /api/reservas/:id - Atualiza reserva
 * - DELETE /api/reservas/:id - Remove reserva
 * - PATCH /api/reservas/:id/status - Atualiza apenas status
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
 * GET /api/reservas
 * Lista todas as reservas
 * Suporta filtros via query string: ?status=ativo&cargo=Estudante
 * Retorna: Array de objetos reserva
 */
router.get('/', (req, res) => {
    let sql = `SELECT r.*, s.nome as sala_nome FROM reservas r 
              LEFT JOIN salas s ON r.sala_id = s.id 
              WHERE 1=1`;
    const params = [];
    
    if (req.query.status) {
        sql += ` AND r.status = ?`;
        params.push(req.query.status);
    }
    if (req.query.cargo) {
        sql += ` AND r.usuario_cargo = ?`;
        params.push(req.query.cargo);
    }
    if (req.query.data) {
        sql += ` AND r.data_reserva = ?`;
        params.push(req.query.data);
    }
    
    sql += ` ORDER BY r.data_reserva, r.hora_inicio`;
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ erro: err.message });
            return;
        }
        res.json(rows);
    });
});

/**
 * GET /api/reservas/:id
 * Lista uma reserva específica pelo ID
 * Retorna: Objeto reserva
 */
router.get('/:id', (req, res) => {
    const id = req.params.id;
    db.get(`SELECT r.*, s.nome as sala_nome FROM reservas r 
           LEFT JOIN salas s ON r.sala_id = s.id 
           WHERE r.id = ?`, [id], (err, row) => {
        if (err) {
            res.status(500).json({ erro: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ erro: 'Reserva não encontrada' });
            return;
        }
        res.json(row);
    });
});

/**
 * POST /api/reservas
 * Cria uma nova reserva
 * Body: { sala_id, usuario_nome, usuario_matricula, usuario_cargo, data_reserva, hora_inicio, hora_fim }
 * Retorna: ID da reserva criada
 */
router.post('/', (req, res) => {
    const { sala_id, usuario_nome, usuario_matricula, usuario_cargo, data_reserva, hora_inicio, hora_fim } = req.body;
    
    // Validação de campos obrigatórios
    if (!sala_id || !usuario_nome || !usuario_matricula || !usuario_cargo || !data_reserva || !hora_inicio || !hora_fim) {
        res.status(400).json({ erro: 'Campos obrigatórios: sala_id, usuario_nome, usuario_matricula, usuario_cargo, data_reserva, hora_inicio, hora_fim' });
        return;
    }
    
    // Verificar se sala existe
    db.get(`SELECT id FROM salas WHERE id = ?`, [sala_id], (err, sala) => {
        if (err || !sala) {
            res.status(400).json({ erro: 'Sala não encontrada' });
            return;
        }
        
        const sql = `INSERT INTO reservas (sala_id, usuario_nome, usuario_matricula, usuario_cargo, data_reserva, hora_inicio, hora_fim, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo')`;
        
        db.run(sql, [sala_id, usuario_nome, usuario_matricula, usuario_cargo, data_reserva, hora_inicio, hora_fim], function(err) {
            if (err) {
                res.status(500).json({ erro: err.message });
                return;
            }
            res.status(201).json({ id: this.lastID, mensagem: 'Reserva criada com sucesso' });
        });
    });
});

/**
 * PUT /api/reservas/:id
 * Atualiza uma reserva existente
 * Body: { sala_id, usuario_nome, usuario_matricula, usuario_cargo, data_reserva, hora_inicio, hora_fim, status }
 * Retorna: Sucesso ou erro
 */
router.put('/:id', (req, res) => {
    const id = req.params.id;
    const { sala_id, usuario_nome, usuario_matricula, usuario_cargo, data_reserva, hora_inicio, hora_fim, status } = req.body;
    
    const sql = `
        UPDATE reservas 
        SET sala_id = COALESCE(?, sala_id),
            usuario_nome = COALESCE(?, usuario_nome),
            usuario_matricula = COALESCE(?, usuario_matricula),
            usuario_cargo = COALESCE(?, usuario_cargo),
            data_reserva = COALESCE(?, data_reserva),
            hora_inicio = COALESCE(?, hora_inicio),
            hora_fim = COALESCE(?, hora_fim),
            status = COALESCE(?, status)
        WHERE id = ?`;
    
    db.run(sql, [sala_id, usuario_nome, usuario_matricula, usuario_cargo, data_reserva, hora_inicio, hora_fim, status, id], function(err) {
        if (err) {
            res.status(500).json({ erro: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ erro: 'Reserva não encontrada' });
            return;
        }
        res.json({ mensagem: 'Reserva atualizada com sucesso' });
    });
});

/**
 * PATCH /api/reservas/:id/status
 * Atualiza apenas o status de uma reserva
 * Body: { status }
 * Retorna: Sucesso ou erro
 */
router.patch('/:id/status', (req, res) => {
    const id = req.params.id;
    const { status } = req.body;
    
    if (!status) {
        res.status(400).json({ erro: 'Campo status obrigatório' });
        return;
    }
    
    const validStatuses = ['ativo', 'atencao', 'concluido', 'cancelado'];
    if (!validStatuses.includes(status)) {
        res.status(400).json({ erro: 'Status inválido. Use: ativo, atencao, concluido, cancelado' });
        return;
    }
    
    db.run(`UPDATE reservas SET status = ? WHERE id = ?`, [status, id], function(err) {
        if (err) {
            res.status(500).json({ erro: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ erro: 'Reserva não encontrada' });
            return;
        }
        res.json({ mensagem: `Status atualizado para ${status}` });
    });
});

/**
 * DELETE /api/reservas/:id
 * Remove uma reserva pelo ID
 * Retorna: Sucesso ou erro
 */
router.delete('/:id', (req, res) => {
    const id = req.params.id;
    
    db.run(`DELETE FROM reservas WHERE id = ?`, [id], function(err) {
        if (err) {
            res.status(500).json({ erro: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ erro: 'Reserva não encontrada' });
            return;
        }
        res.json({ mensagem: 'Reserva removida com sucesso' });
    });
});

module.exports = router;