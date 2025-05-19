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
  
      console.log('Recebido:', identificador, senha);
      console.log('Do banco:', usuario.email, usuario.cpf, usuario.senha);
  
      if (senha !== usuario.senha) {
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
    });
  };  



