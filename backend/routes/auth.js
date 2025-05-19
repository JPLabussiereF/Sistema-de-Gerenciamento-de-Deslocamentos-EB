// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Login: recebe CPF ou email + senha
router.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({ mensagem: 'Preencha todos os campos.' });
    }

    const sql = `
        SELECT * FROM usuario
        WHERE (cpf = ? OR email = ?) AND senha = ?
    `;

    db.query(sql, [usuario, usuario, senha], (err, results) => {
        if (err) {
            console.error('Erro na consulta:', err);
            return res.status(500).json({ mensagem: 'Erro interno no servidor.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ mensagem: 'Usuário ou senha inválidos.' });
        }

        // Retorna os dados básicos do usuário autenticado
        const user = results[0];
        res.json({
            id_usuario: user.id_usuario,
            nome: user.nome,
            funcao: user.funcao
        });
    });
});

module.exports = router;
