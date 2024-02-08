import jwt from 'jsonwebtoken';
import express, { Router } from 'express';
import { pool } from '../db-connection.js';
import { keys, decryptData } from './keyRoute.js';
import { checkTokenValidity } from './authorizeRolesRoute.js'

const checkRouter = express.Router();

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

checkRouter.get('/get-account-id', async (req, res) => {
    const jwtToken = req.headers.authorization;
    try {
        const accountId = await getAccountIdFromCookie(jwtToken);
        res.json({ accountId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Define the route for getting email address by ID
checkRouter.post('/get-email-by-id', async (req, res) => {
    const id = req.body.id;
    const jwtToken = req.headers.authorization;
    const isValid = await checkTokenValidity(jwtToken);
    try {
        if (isValid === true) {
            const id_from_cookie = await getAccountIdFromCookie(jwtToken);

            if (id == id_from_cookie) {
                const email = await getEmailAddressById(id);
                res.json({ email });
            } else {
                return res.status(401).json({ error: 'Access forbidden' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default checkRouter;