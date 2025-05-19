// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Login: recebe CPF ou email + senha
router.post('/login', (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({ 
            sucesso: false,
            mensagem: 'Preencha todos os campos.' 
        });
    }

    const sql = `
        SELECT * FROM usuario
        WHERE (cpf = ? OR email = ?) AND senha = ?
    `;

    db.query(sql, [usuario, usuario, senha], (err, results) => {
        if (err) {
            console.error('Erro na consulta:', err);
            return res.status(500).json({ 
                sucesso: false,
                mensagem: 'Erro interno no servidor.' 
            });
        }

        if (results.length === 0) {
            return res.status(401).json({ 
                sucesso: false,
                mensagem: 'Usuário ou senha inválidos.' 
            });
        }

        // Retorna os dados do usuário autenticado
        const user = results[0];
        res.json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso',
            id_usuario: user.id_usuario,
            nome: user.nome,
            funcao: user.funcao,
            email: user.email
        });
    });
});

// Rota para verificar se o usuário está autenticado
router.get('/verificar', (req, res) => {
    // Verificar o token ou ID do usuário recebido no cabeçalho
    const userId = req.headers.authorization;
    
    if (!userId) {
        return res.status(401).json({ 
            sucesso: false,
            mensagem: 'Usuário não autenticado' 
        });
    }
    
    // Verificar se o ID existe no banco de dados
    const sql = `SELECT id_usuario, nome, funcao FROM usuario WHERE id_usuario = ?`;
    
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Erro na consulta:', err);
            return res.status(500).json({ 
                sucesso: false,
                mensagem: 'Erro interno no servidor.' 
            });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ 
                sucesso: false,
                mensagem: 'Sessão inválida. Faça login novamente.' 
            });
        }
        
        const user = results[0];
        res.json({
            sucesso: true,
            mensagem: 'Usuário autenticado',
            usuario: {
                id: user.id_usuario,
                nome: user.nome,
                funcao: user.funcao
            }
        });
    });
});

// Logout (para limpar a sessão do lado do servidor, se necessário)
router.post('/logout', (req, res) => {
    // No caso de um sistema baseado em localStorage, o logout geralmente
    // é feito apenas no cliente, mas podemos adicionar lógica adicional aqui
    // como invalidar tokens, se implementarmos autenticação baseada em tokens
    
    res.json({
        sucesso: true,
        mensagem: 'Logout realizado com sucesso'
    });
});

module.exports = router;