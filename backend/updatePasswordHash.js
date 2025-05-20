const db = require('./db');
const passwordUtils = require('./utils/passwordUtils');

// Função para atualizar senhas dos usuários existentes
async function updateUserPasswords() {
    try {
        // Buscar todos os usuários
        const [users] = await db.promise().query('SELECT id_usuario, senha FROM usuario');
        
        console.log(`Encontrados ${users.length} usuários para atualizar senhas.`);
        
        // Para cada usuário, atualizar a senha com hash
        for (const user of users) {
            try {
                // Verifica se a senha já parece estar em formato de hash
                if (user.senha.length >= 60) {
                    console.log(`Senha do usuário ID ${user.id_usuario} já parece estar em formato hash, pulando...`);
                    continue;
                }
                
                // Gerar hash da senha atual
                const hashedPassword = await passwordUtils.hashPassword(user.senha);
                
                // Atualizar no banco
                await db.promise().query(
                    'UPDATE usuario SET senha = ? WHERE id_usuario = ?',
                    [hashedPassword, user.id_usuario]
                );
                
                console.log(`Senha atualizada para usuário ID ${user.id_usuario}`);
            } catch (err) {
                console.error(`Erro ao atualizar senha do usuário ID ${user.id_usuario}:`, err);
            }
        }
        
        console.log('Processo de atualização concluído.');
        process.exit(0);
    } catch (err) {
        console.error('Erro ao buscar usuários:', err);
        process.exit(1);
    }
}

// Executar a função
updateUserPasswords();