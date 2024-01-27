import cron from 'node-cron';
import crypto from 'crypto';
import express from 'express';

const keyRouter = express.Router();

export let keys = {
    secretJwtKey: crypto.randomBytes(32).toString('hex'),
    secret_key: crypto.randomBytes(32).toString('hex'),
    secret_iv: crypto.randomBytes(16).toString('hex'),
    encryption_method: 'aes-256-cbc'
};

console.log(keys)

keyRouter.get('/keys', (req, res) => {
    res.json({
        secretJwtKey: keys.secretJwtKey
    });
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

cron.schedule('0 0 * * *', rotateKeys);

// // // Example: Log the keys every minute for testing
// cron.schedule('* * * * *', () => {
//     console.log('Current Keys:', keys);
// });

export default keyRouter;