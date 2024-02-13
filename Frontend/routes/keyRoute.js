import cron from 'node-cron';
import crypto from 'crypto';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config()

const keyRouter = express.Router();
const encryption_key = "846cfa5d2e8dd94532d81a21eacc99d7f7a9bf5317fe2f7a52f3a646ac85a97d"
const adminPassword = process.env.ADMIN_PASSWORD ? Buffer.from(process.env.ADMIN_PASSWORD, 'base64').toString('utf-8') : undefined;


export let keys = {
    secretJwtKey: crypto.randomBytes(32).toString('hex'),
    secret_key: crypto.randomBytes(32).toString('hex'),
    secret_iv: crypto.randomBytes(16).toString('hex'),
    encryption_method: 'aes-256-cbc'
};

console.log(keys)

keyRouter.post('/keys', (req, res) => {
    const { password } = req.body;

    if (password === adminPassword) {
      res.json({ secretKey: keys.secretJwtKey });
    } else {
      res.status(401).json({ error: 'Invalid parameter.' });
    }
});

const rotateKeys = () => {
    // Generate new keys
    keys.secretJwtKey = crypto.randomBytes(32).toString('hex');
    keys.secret_key = crypto.randomBytes(32).toString('hex');
    keys.secret_iv = crypto.randomBytes(16).toString('hex');

    console.log('Keys rotated:', keys);
};

export async function encryptData(data) {
    const cipher = crypto.createCipheriv(keys.encryption_method, key, encryptionIV);
    return Buffer.from(cipher.update(data, 'utf8', 'hex') + cipher.final('hex'), 'hex').toString('base64');
}

export async function decryptData(encryptedData) {
    const buff = Buffer.from(encryptedData, 'base64');
    const decipher = crypto.createDecipheriv(keys.encryption_method, key, encryptionIV);
    return decipher.update(buff.toString('hex'), 'hex', 'utf8') + decipher.final('utf8');
}

const key = crypto
    .createHash('sha512')
    .update(keys.secret_key)
    .digest('hex')
    .substring(0, 32);

const encryptionIV = crypto
    .createHash('sha512')
    .update(keys.secret_iv)
    .digest('hex')
    .substring(0, 16);

const key2 = crypto
    .createHash('sha512')
    .update(encryption_key)
    .digest('hex')
    .substring(0, 32);

async function encryptData2(data) {
    const cipher = crypto.createCipheriv(keys.encryption_method, key2, encryptionIV);
    return Buffer.from(cipher.update(data, 'utf8', 'hex') + cipher.final('hex'), 'hex').toString('base64');
}

async function decryptData2(encryptedData) {
    const buff = Buffer.from(encryptedData, 'base64');
    const decipher = crypto.createDecipheriv(keys.encryption_method, key2, encryptionIV);
    return decipher.update(buff.toString('hex'), 'hex', 'utf8') + decipher.final('utf8');
}

keyRouter.post('/encrypt', async (req, res) => {
    const data = req.body.data;

    try {
        const encryptedData = await encryptData2(data);
        res.json({ encryptedData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

keyRouter.post('/decrypt', async (req, res) => {
    const encryptedData = req.body.encryptedData;

    try {
        const decryptedData = await decryptData2(encryptedData);
        res.json({ decryptedData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

cron.schedule('0 0 * * *', rotateKeys);

// // // Example: Log the keys every minute for testing
// cron.schedule('* * * * *', () => {
//     console.log('Current Keys:', keys);
// });

export default keyRouter;