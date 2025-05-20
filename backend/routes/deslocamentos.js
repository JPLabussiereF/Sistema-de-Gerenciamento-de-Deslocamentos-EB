// routes/deslocamentos.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware para verificar autenticação (sem alterações)
const verificarAutenticacao = (req, res, next) => {
    const hasAuthHeader = req.headers.authorization;
    const hasUserId = req.body && req.body.usuario_id;
    const hasQueryUserId = req.query && req.query.userId;
    
    if (!hasAuthHeader && !hasUserId && !hasQueryUserId) {
        return res.status(401).json({ 
            sucesso: false,
            mensagem: 'Usuário não autenticado' 
        });
    }
    
    const userId = hasUserId ? req.body.usuario_id : 
                  hasQueryUserId ? req.query.userId : 
                  req.headers.authorization;
    
    req.userId = userId;
    next();
};

// Rota para registrar um novo deslocamento - com cod_cliente
router.post('/', verificarAutenticacao, verificarLimiteEnvios, (req, res) => {
    const {
        origem_nome,
        destino_nome,
        cliente_nome,
        cliente_id,
        cod_cliente, // Adicionando o novo campo
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
    let finalCodCliente = null;
    
    if (cliente_nome !== 'Sem cliente') {
        finalClienteId = cliente_id;
        finalCodCliente = cod_cliente;
    }

    // SQL para inserir os dados - incluindo cod_cliente
    const query = `
        INSERT INTO formulario_deslocamento 
        (id_usuario, id_cliente, cod_cliente, origem, destino, km_inicio, km_final, acao_trajeto, data_hora_registrado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        usuario_id,
        finalClienteId,
        finalCodCliente, // Adicionando o cod_cliente
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
            id: result.insertId,
            totalEnvios: req.totalEnviosDiarios + 1,
            limite: req.limiteDiario
        });
    });
    
});

// Rota para listar deslocamentos do usuário - incluindo cod_cliente
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
            c.nome_cliente,
            fd.cod_cliente
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
function verificarLimiteEnvios(req, res, next) {
    const userId = req.userId;
    const dataAtual = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    
    // Definir o limite máximo de formulários por dia
    const LIMITE_DIARIO = 50;
    
    const query = `
        SELECT COUNT(*) as total 
        FROM formulario_deslocamento 
        WHERE id_usuario = ? 
        AND DATE(data_hora_registrado) = ?
    `;
    
    db.query(query, [userId, dataAtual], (err, results) => {
        if (err) {
            console.error('Erro ao verificar limite de envios:', err);
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao verificar limite de envios'
            });
        }
        
        const totalEnvios = results[0].total;
        
        // Adicionar contagem à requisição para uso posterior
        req.totalEnviosDiarios = totalEnvios;
        req.limiteDiario = LIMITE_DIARIO;
        
        // Verificar se o limite foi atingido
        if (totalEnvios >= LIMITE_DIARIO) {
            return res.status(429).json({
                sucesso: false,
                mensagem: 'Limite diário de envios atingido',
                totalEnvios: totalEnvios,
                limite: LIMITE_DIARIO
            });
        }
        
        next();
    });
}
router.get('/status-envios', verificarAutenticacao, (req, res) => {
    const userId = req.userId;
    const dataAtual = new Date().toISOString().split('T')[0]; // formato YYYY-MM-DD
    
    // Definir o limite máximo de formulários por dia (mesmo valor usado no middleware)
    const LIMITE_DIARIO = 50;
    
    const query = `
        SELECT COUNT(*) as total 
        FROM formulario_deslocamento 
        WHERE id_usuario = ? 
        AND DATE(data_hora_registrado) = ?
    `;
    
    db.query(query, [userId, dataAtual], (err, results) => {
        if (err) {
            console.error('Erro ao verificar limite de envios:', err);
            return res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao verificar limite de envios'
            });
        }
        
        const totalEnvios = results[0].total;
        
        res.json({
            sucesso: true,
            totalEnvios: totalEnvios,
            limite: LIMITE_DIARIO,
            disponivel: totalEnvios < LIMITE_DIARIO
        });
    });
});

module.exports = router;