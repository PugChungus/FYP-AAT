import CryptoJS from "crypto-js"
import dotenv from 'dotenv';

dotenv.config()

var data = "513e2bb4e26ad8a2f1bcf51bb53a0b207d5e33567bc75aeec31d209c573c47975f63b390e20eaee4b06ec7c51d1ae12c8194b623099872b225e7cbbb1f13b486c82bb6aa6e664ee6fd726b316873db8aa4f9aaa48bfea65819d81a109d511c82215269af";
const encryption_key = "846cfa5d2e8dd94532d81a21eacc99d7f7a9bf5317fe2f7a52f3a646ac85a97d"

var encrypted = CryptoJS.AES.encrypt(process.env.ADMIN_PASSWORD, encryption_key);
console.log(encrypted.toString());

// console.log(process.env.MYSQL_HOST)
var decrypted = CryptoJS.AES.decrypt(process.env.MYSQL_HOST, encryption_key);
var object = decrypted.toString(CryptoJS.enc.Utf8);
// console.log(object)