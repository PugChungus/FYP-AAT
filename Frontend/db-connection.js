const mysql = require('mysql2');
const path = require('path');
const dotenv = require('dotenv');
const parentDirectory = path.resolve(__dirname, '..');
const envPath = path.resolve(parentDirectory, '.env');
dotenv.config({ path: envPath });

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

module.exports = pool;

