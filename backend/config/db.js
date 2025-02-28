const mysql = require('mysql2/promise');

// 🔹 Conexão com o banco central
const centralDb = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'rzbotvendas'
});

// 🔹 Função para conectar dinamicamente ao banco do cliente
const getConnection = async (banco) => {
    return mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: '',
        database: banco,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
};

module.exports = { centralDb, getConnection };
