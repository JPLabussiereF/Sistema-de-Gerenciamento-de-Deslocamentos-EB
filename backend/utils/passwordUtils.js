// utils/passwordUtils.js
const bcrypt = require('bcrypt');

// Função para gerar hash de senha
exports.hashPassword = async (plainPassword) => {
    const saltRounds = 10;
    return await bcrypt.hash(plainPassword, saltRounds);
};

// Função para verificar senha
exports.verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};