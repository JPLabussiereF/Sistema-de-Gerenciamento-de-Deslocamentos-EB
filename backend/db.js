// db.js
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // ou sua senha, se definida no XAMPP
    database: 'eletrica_bahiana' // substitua pelo nome do seu banco
});

connection.connect((err) => {
    if (err) {
        console.error('Erro na conexão com o banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados MySQL');
});

module.exports = connection;
