const passwordUtils = require('../utils/passwordUtils');
const db = require('../db');

exports.login = (req, res) => {
  const { identificador, senha } = req.body;

  const query = 'SELECT * FROM usuario WHERE email = ? OR cpf = ?';
  db.query(query, [identificador, identificador], (err, results) => {
    if (err) {
      console.error('Erro ao consultar o banco de dados:', err);
      return res.status(500).send('Erro no servidor');
    }

    if (results.length === 0) {
      return res.status(401).send('Usuário não encontrado');
    }

    const usuario = results[0];

    passwordUtils.verifyPassword(senha, usuario.senha)
    .then(match => {
        if (!match) {
            return res.status(401).send('Senha incorreta');
        }
        
        res.json({
            mensagem: 'Login realizado com sucesso',
            usuario: {
                id: usuario.id_usuario,
                nome: usuario.nome,
                funcao: usuario.funcao,
                email: usuario.email
            }
        });
    })
    .catch(err => {
        console.error('Erro ao verificar senha:', err);
        return res.status(500).send('Erro no servidor');
    });
  });
};  



