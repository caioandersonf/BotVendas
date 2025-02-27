const mysql = require('mysql2/promise');

const centralDb = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'rzbotvendas'
});

module.exports = centralDb;
