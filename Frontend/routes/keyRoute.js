import cron from 'node-cron';
import crypto from 'crypto';

export let keys = {
    secretJwtKey: "ACB725326D68397E743DFC9F3FB64DA50CE7FB135721794C355B0DB219C449B3",
    secret_key: '\xc2\x99~t\xe52\xcbo\xaa\xe8\x93dX\x04\x14\xa8\xa8\x9a\xd8P\x90\xd9"\xd0|\x1cO\xe5\xcbE\x06n',
    secret_iv: '\xb1\xe1z9\xcf\xc7\x94\x14\xb7u\xa9C\x0f\xf6\x8c\xbc\xc0\x0b\xff\xc4X@\xa4\xb0\x05\x95Ni[\xc8\xdfg',
    encryption_method: 'aes-256-cbc'
};

const rotateKeys = () => {
    // Generate new keys
    keys.secretJwtKey = crypto.randomBytes(32).toString('hex');
    keys.secret_key = crypto.randomBytes(32).toString('hex');
    keys.secret_iv = crypto.randomBytes(16).toString('hex');

    console.log('Keys rotated:', keys.secretJwtKey);
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
//     console.log('Current Keys:', keys.secretJwtKey, keys.secret_key, keys.secret_iv);
// });