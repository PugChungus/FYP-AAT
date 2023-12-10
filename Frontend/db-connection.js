const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: 'password',
    database: 'major_project_db'
}).promise()

console.log(pool)

module.exports = pool;