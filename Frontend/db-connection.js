import mysql from 'mysql2';
import CryptoJS from "crypto-js"
import dotenv from 'dotenv';

dotenv.config()

const encryption_key = "846cfa5d2e8dd94532d81a21eacc99d7f7a9bf5317fe2f7a52f3a646ac85a97d"

function decrypt(data) {
  var decrypted = CryptoJS.AES.decrypt(data, encryption_key);
  var object = decrypted.toString(CryptoJS.enc.Utf8);
  return object
}

const pool = mysql.createPool({
  host: decrypt(process.env.MYSQL_HOST),
  port: decrypt(process.env.MYSQL_PORT),
  user: decrypt(process.env.MYSQL_USER),
  password: decrypt(process.env.MYSQL_PASSWORD),
  database: decrypt(process.env.MYSQL_DATABASE),
}).promise();

export { pool };