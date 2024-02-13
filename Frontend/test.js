import CryptoJS from "crypto-js"
import dotenv from 'dotenv';

dotenv.config()

var data = "192.168.3.3";
const encryption_key = "846cfa5d2e8dd94532d81a21eacc99d7f7a9bf5317fe2f7a52f3a646ac85a97d"

var encrypted = CryptoJS.AES.encrypt(data, encryption_key);
console.log(encrypted.toString());

// console.log(process.env.MYSQL_HOST)
var decrypted = CryptoJS.AES.decrypt(process.env.MYSQL_HOST, encryption_key);
var object = decrypted.toString(CryptoJS.enc.Utf8);
// console.log(object)