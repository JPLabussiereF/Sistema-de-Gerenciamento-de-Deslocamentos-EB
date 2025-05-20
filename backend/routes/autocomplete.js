// routes/autocomplete.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware para verificar se o usuário está autenticado
const verificarAutenticacao = (req, res, next) => {
    // Verificar se existe um usuário na sessão
    if (!req.headers.authorization && !req.query.userId) {
        return res.status(401).json({ 
            mensagem: 'Usuário não autenticado' 
        });
    }
    
    // Para fins de desenvolvimento/teste, permitimos passar o ID do usuário na query
    // Em produção, você deve usar um token JWT ou sessão
    const userId = req.query.userId || req.headers.authorization;
    req.userId = userId;
    next();
};

// Rota para obter clientes do usuário logado
router.get('/clientes', verificarAutenticacao, (req, res) => {
    const userId = req.userId;
    
    const query = `
        SELECT 
            id_cliente, 
            nome_cliente AS nome, 
            CONCAT_WS(', ', logradouro, CONCAT('Nº ', numero), complemento, bairro, cep, cidade, estado) AS endereco_completo 
        FROM 
            cliente 
        WHERE 
            id_usuario = ?
        ORDER BY
            nome_cliente ASC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar clientes:', err);
            return res.status(500).json({ 
                mensagem: 'Erro ao buscar dados de clientes' 
            });
        }
        
        res.json({ clientes: results });
    });
});

// Rota para obter locais frequentes (combinando dados fixos com dados do banco)
router.get('/locais', verificarAutenticacao, (req, res) => {
    const userId = req.userId;
    
    // Locais fixos que sempre estarão disponíveis
    const locaisFixos = [
        { id: 'casa', nome: 'Casa', endereco_completo: 'Endereço residencial' },
        { id: 'almoco', nome: 'Almoço', endereco_completo: 'Local para refeição' },
        { id: 'ebssa', nome: 'Elétrica Bahiana - Salvador', endereco_completo: 'Rua Barão de Cotegipe, 269A - Mares, Salvador - BA, 40411-002' },
        { id: 'eblauro', nome: 'Elétrica Bahiana - Lauro de Freitas', endereco_completo: 'R. Dr. Barreto, 688 - Pitangueiras, Lauro de Freitas - BA, 42701-310' },
        { id: 'ebaju', nome: 'Elétrica Bahiana - Aracaju', endereco_completo: 'Condomínio Cidade Comercial, n° 1294 - Av. Etelvino Alves de Lima, Loja 07 - Inácio Barbosa, Aracaju - SE, 49040-690' }
    ];
    
    // Buscar endereços dos clientes para complementar as opções
    const query = `
        SELECT 
            id_cliente, 
            nome_cliente AS nome, 
            CONCAT_WS(', ', logradouro, CONCAT('Nº ', numero), complemento, bairro, cep, cidade, estado) AS endereco_completo 
        FROM 
            cliente 
        WHERE 
            id_usuario = ?
        ORDER BY
            nome_cliente ASC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar locais:', err);
            return res.status(500).json({ 
                mensagem: 'Erro ao buscar dados de locais' 
            });
        }
        
        // Combinar locais fixos com endereços dos clientes
        const locaisCombinados = [...locaisFixos, ...results];
        
        res.json({ locais: locaisCombinados });
    });
});

module.exports = router;