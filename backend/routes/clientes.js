// routes/clientes.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware para verificar autenticação
const verificarAutenticacao = (req, res, next) => {
    if (!req.headers.authorization && !req.query.userId) {
        return res.status(401).json({ 
            sucesso: false,
            mensagem: 'Usuário não autenticado' 
        });
    }
    
    const userId = req.query.userId || req.headers.authorization;
    req.userId = userId;
    
    // Verificar se o usuário existe e tem permissão adequada
    const query = `SELECT funcao FROM usuario WHERE id_usuario = ?`;
    
    db.query(query, [userId], (err, results) => {
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
                mensagem: 'Usuário não encontrado' 
            });
        }
        
        // Para operações que exigem permissão de admin, verificar a função
        req.funcaoUsuario = results[0].funcao;
        next();
    });
};

// Middleware para verificar se o usuário é administrador
const verificarAdmin = (req, res, next) => {
    if (req.funcaoUsuario !== 'adm') {
        return res.status(403).json({ 
            sucesso: false,
            mensagem: 'Permissão negada. Acesso restrito a administradores.' 
        });
    }
    next();
};

// Rota para listar todos os clientes (apenas para administradores)
router.get('/', verificarAutenticacao, verificarAdmin, (req, res) => {
    const query = `
        SELECT 
            c.id_cliente, 
            c.cod_cliente, 
            c.nome_cliente, 
            c.id_usuario,
            u.nome as vendedor_nome
        FROM 
            cliente c
        LEFT JOIN 
            usuario u ON c.id_usuario = u.id_usuario
        ORDER BY 
            c.nome_cliente ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar clientes:', err);
            return res.status(500).json({ 
                sucesso: false,
                mensagem: 'Erro ao buscar clientes' 
            });
        }
        
        res.json({ 
            sucesso: true,
            clientes: results 
        });
    });
});
// Rota para obter vendedores externos (apenas para administradores)
router.get('/vendedores', verificarAutenticacao, verificarAdmin, (req, res) => {
    const query = `
        SELECT 
            id_usuario, 
            nome
        FROM 
            usuario
        WHERE 
            funcao = 'vendedor'
        ORDER BY 
            nome ASC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar vendedores:', err);
            return res.status(500).json({ 
                sucesso: false,
                mensagem: 'Erro ao buscar vendedores' 
            });
        }
        
        res.json({ 
            sucesso: true,
            vendedores: results 
        });
    });
});
// Rota para obter um cliente específico
router.get('/:id', verificarAutenticacao, (req, res) => {
    const clienteId = req.params.id;
    
    const query = `
        SELECT 
            c.id_cliente, 
            c.cod_cliente, 
            c.nome_cliente, 
            c.cnpj,
            c.logradouro,
            c.numero,
            c.complemento,
            c.bairro,
            c.cep,
            c.cidade,
            c.estado,
            c.id_usuario,
            u.nome as vendedor_nome
        FROM 
            cliente c
        LEFT JOIN 
            usuario u ON c.id_usuario = u.id_usuario
        WHERE 
            c.id_cliente = ?
    `;
    
    db.query(query, [clienteId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar cliente:', err);
            return res.status(500).json({ 
                sucesso: false,
                mensagem: 'Erro ao buscar cliente' 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                sucesso: false,
                mensagem: 'Cliente não encontrado' 
            });
        }
        
        res.json({ 
            sucesso: true,
            cliente: results[0] 
        });
    });
});

// Rota para atualizar o vendedor responsável por um cliente
router.put('/:id/vendedor', verificarAutenticacao, verificarAdmin, (req, res) => {
    const clienteId = req.params.id;
    const { id_usuario } = req.body;
    
    // Verificar se o cliente existe
    const checkClienteQuery = `SELECT id_cliente FROM cliente WHERE id_cliente = ?`;
    
    db.query(checkClienteQuery, [clienteId], (err, results) => {
        if (err) {
            console.error('Erro ao verificar cliente:', err);
            return res.status(500).json({ 
                sucesso: false,
                mensagem: 'Erro ao verificar cliente' 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                sucesso: false,
                mensagem: 'Cliente não encontrado' 
            });
        }
        
        // Se id_usuario for fornecido, verificar se o vendedor existe
        if (id_usuario) {
            const checkVendedorQuery = `SELECT id_usuario FROM usuario WHERE id_usuario = ? AND funcao = 'vendedor'`;
            
            db.query(checkVendedorQuery, [id_usuario], (err, results) => {
                if (err) {
                    console.error('Erro ao verificar vendedor:', err);
                    return res.status(500).json({ 
                        sucesso: false,
                        mensagem: 'Erro ao verificar vendedor' 
                    });
                }
                
                if (results.length === 0) {
                    return res.status(404).json({ 
                        sucesso: false,
                        mensagem: 'Vendedor não encontrado' 
                    });
                }
                
                // Atualizar o cliente com o novo vendedor
                atualizarVendedor(clienteId, id_usuario, res);
            });
        } else {
            // Se id_usuario for null ou vazio, remover a associação
            atualizarVendedor(clienteId, null, res);
        }
    });
});

// Função auxiliar para atualizar o vendedor
function atualizarVendedor(clienteId, idVendedor, res) {
    const updateQuery = `UPDATE cliente SET id_usuario = ? WHERE id_cliente = ?`;
    
    db.query(updateQuery, [idVendedor, clienteId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar vendedor:', err);
            return res.status(500).json({ 
                sucesso: false,
                mensagem: 'Erro ao atualizar vendedor' 
            });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                sucesso: false,
                mensagem: 'Cliente não encontrado' 
            });
        }
        
        res.json({ 
            sucesso: true,
            mensagem: 'Vendedor atualizado com sucesso' 
        });
    });
}



module.exports = router;