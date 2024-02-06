import jwt from 'jsonwebtoken';
import { pool } from '../db-connection.js';
import { keys, decryptData } from './keyRoute.js';

export async function getAccountIdFromCookie(jwtToken) {
    let token;

    if (!jwtToken.startsWith('Bearer: ')) {
        return; // or handle the case where JWT token is missing or malformed
    } else {
        token = jwtToken.split(' ')[1];
        // Now you can proceed with the token
    }

    try {
        const decodedToken = jwt.verify(token, keys.secretJwtKey);
        const encryptedUserData = decodedToken.encryptedUserData;

        return new Promise((resolve, reject) => {
            decryptData(encryptedUserData)
                .then(decryptedUserData => {
                    const originalObject = JSON.parse(decryptedUserData);
                    const id = originalObject.id;
                    resolve(id);
                })
                .catch(error => {
                    reject(error);
                });
        });
    } catch (error) {
        throw error;
    }
}

export async function getEmailAddressById(id) {
    try {
        const [tables] = await pool.execute('SELECT email_address FROM user_account WHERE account_id = ?;', [id]);
        if (tables.length > 0) {
            return tables[0].email_address;
        } else {
            throw new Error('Account not found');
        }
    } catch (error) {
        throw error;
    }
}
