import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config()

function decodeEnvVariable(encodedVariable) {
  return Buffer.from(encodedVariable, 'base64').toString('utf-8');
}

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST ? decodeEnvVariable(process.env.MYSQL_HOST) : undefined,
  port: process.env.MYSQL_PORT ? parseInt(decodeEnvVariable(process.env.MYSQL_PORT), 10) : undefined,
  user: process.env.MYSQL_USER ? decodeEnvVariable(process.env.MYSQL_USER) : undefined,
  password: process.env.MYSQL_PASSWORD ? decodeEnvVariable(process.env.MYSQL_PASSWORD) : undefined,
  database: process.env.MYSQL_DATABASE ? decodeEnvVariable(process.env.MYSQL_DATABASE) : undefined,
}).promise();

export { pool };