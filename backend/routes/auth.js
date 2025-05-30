// routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const passwordUtils = require("../utils/passwordUtils");
const bcrypt = require("bcrypt");

// Login: recebe CPF ou email + senha
router.post("/login", (req, res) => {
    const { usuario, senha } = req.body;

    if (!usuario || !senha) {
        return res.status(400).json({
            sucesso: false,
            mensagem: "Preencha todos os campos.",
        });
    }

    // Consulta modificada - não verificamos a senha no SQL
    const sql = `
        SELECT * FROM usuario
        WHERE (cpf = ? OR email = ?)
    `;

    db.query(sql, [usuario, usuario], (err, results) => {
        if (err) {
            console.error("Erro na consulta:", err);
            return res.status(500).json({
                sucesso: false,
                mensagem: "Erro interno no servidor.",
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                sucesso: false,
                mensagem: "Usuário ou senha inválidos.",
            });
        }

        const user = results[0]; // Armazenar o usuário em uma variável

        // Verifica a senha com bcrypt
        passwordUtils
            .verifyPassword(senha, user.senha)
            .then((match) => {
                if (!match) {
                    return res.status(401).json({
                        sucesso: false,
                        mensagem: "Usuário ou senha inválidos.",
                    });
                }

                // Autenticação bem-sucedida
                res.json({
                    sucesso: true,
                    mensagem: "Login realizado com sucesso",
                    id_usuario: user.id_usuario,
                    nome: user.nome,
                    funcao: user.funcao,
                    email: user.email,
                });
            })
            .catch((err) => {
                console.error("Erro ao verificar senha:", err);
                return res.status(500).json({
                    sucesso: false,
                    mensagem: "Erro interno no servidor.",
                });
            });
    });
});

// Logout (para limpar a sessão do lado do servidor, se necessário)
router.post("/logout", (req, res) => {
    // No caso de um sistema baseado em localStorage, o logout geralmente
    // é feito apenas no cliente, mas podemos adicionar lógica adicional aqui
    // como invalidar tokens, se implementarmos autenticação baseada em tokens

    res.json({
        sucesso: true,
        mensagem: "Logout realizado com sucesso",
    });
});

module.exports = router;
