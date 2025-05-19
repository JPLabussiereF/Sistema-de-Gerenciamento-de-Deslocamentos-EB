// routes/deslocamentos.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware para verificar autenticação
const verificarAutenticacao = (req, res, next) => {
    // Verificar se existe um usuário na sessão
    if (!req.headers.authorization && !req.body.usuario_id) {
        return res.status(401).json({ 
            sucesso: false,
            mensagem: 'Usuário não autenticado' 
        });
    }
    
    // Para fins de desenvolvimento/teste, permitimos passar o ID do usuário no corpo da requisição
    // Em produção, você deve usar um token JWT ou sessão
    const userId = req.body.usuario_id || req.headers.authorization;
    req.userId = userId;
    next();
};

// Rota para registrar um novo deslocamento
router.post('/', verificarAutenticacao, (req, res) => {
    const {
        origem_nome,
        destino_nome,
        cliente_nome,
        cliente_id,
        dataHora,
        kmInicio,
        kmFinal,
        acao,
        usuario_id
    } = req.body;

    // Converter ação para o formato esperado pelo banco de dados
    let acaoTrajeto;
    switch (acao) {
        case 'Visita':
            acaoTrajeto = 'visita';
            break;
        case 'Casa':
            acaoTrajeto = 'casa';
            break;
        case 'EB':
            acaoTrajeto = 'eb';
            break;
        case 'Almoço':
            acaoTrajeto = 'almoco';
            break;
        default:
            acaoTrajeto = 'visita';
    }

    // Verificar se o cliente_id é válido
    let finalClienteId = null;
    if (cliente_nome !== 'Sem cliente') {
        finalClienteId = cliente_id;
    }

    // SQL para inserir os dados
    const query = `
        INSERT INTO formulario_deslocamento 
        (id_usuario, id_cliente, origem, destino, km_inicio, km_final, acao_trajeto, data_hora_registrado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        usuario_id,
        finalClienteId,
        origem_nome,
        destino_nome,
        kmInicio,
        kmFinal,
        acaoTrajeto,
        dataHora
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Erro ao inserir deslocamento:', err);
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao registrar deslocamento',
                erro: err.message
            });
        }

        res.status(201).json({
            sucesso: true,
            mensagem: 'Deslocamento registrado com sucesso',
            id: result.insertId
        });
    });
});

// Rota para listar deslocamentos do usuário
router.get('/', verificarAutenticacao, (req, res) => {
    const userId = req.userId;
    
    const query = `
        SELECT 
            fd.id_formulario,
            fd.origem,
            fd.destino,
            fd.km_inicio,
            fd.km_final,
            fd.distancia,
            fd.acao_trajeto,
            fd.data_hora_registrado,
            c.nome_cliente
        FROM 
            formulario_deslocamento fd
        LEFT JOIN
            cliente c ON fd.id_cliente = c.id_cliente
        WHERE 
            fd.id_usuario = ?
        ORDER BY 
            fd.data_hora_registrado DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar deslocamentos:', err);
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao buscar deslocamentos',
                erro: err.message
            });
        }
        
        res.json({
            sucesso: true,
            deslocamentos: results
        });
    });
});

module.exports = router;