import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { keys } from './keys.js';

export function authorizeRoles() {
    return (req, res, next) => {
        try {
            const jwtToken = req.cookies?.jwtToken;

            if (!jwtToken) {
                res.status(401).render('accessdenied');
            }

            const decodedToken = jwt.verify(jwtToken, keys.secretJwtKey);
            const encryptedUserData = decodedToken.encryptedUserData;

            decryptData(encryptedUserData)
                .then(decryptedUserData => {
                    const originalObject = JSON.parse(decryptedUserData)
                    const role = originalObject.role
                    if (role === 'user') {
                        next();
                    } else {
                        res.status(401).render('accessdenied');
                    }
                })
                .catch(error => {
                    console.error('Error during decryption:', error);
                    res.status(401).render('accessdenied');
                });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).render('accessdenied');
            }

            res.status(401).render('accessdenied');
        }
    };
}

async function encryptData(data) {
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
