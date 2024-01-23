// loginRoute.js
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from './db-connection.js';
import argon2 from 'argon2-browser';

const loginRouter = express.Router();
let verificationResult;

let keys = {
    secretJwtKey: "ACB725326D68397E743DFC9F3FB64DA50CE7FB135721794C355B0DB219C449B3",
    secret_key: '\xc2\x99~t\xe52\xcbo\xaa\xe8\x93dX\x04\x14\xa8\xa8\x9a\xd8P\x90\xd9"\xd0|\x1cO\xe5\xcbE\x06n',
    secret_iv: '\xb1\xe1z9\xcf\xc7\x94\x14\xb7u\xa9C\x0f\xf6\x8c\xbc\xc0\x0b\xff\xc4X@\xa4\xb0\x05\x95Ni[\xc8\xdfg',
    encryption_method: 'aes-256-cbc'
};

loginRouter.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {

        console.log(email)
        console.log("YEPP")
        const [tables] = await pool.execute('CALL check2FA(?)', [email]);



        console.log("Tables:", tables)

        const pass_db = tables[0][0].password;
        console.log(password);
        console.log(pass_db);

        verificationResult = await verifyPassword(password, pass_db)
        //Generation of JWT token

        if (verificationResult == true) {
            
            
            const [result] = await pool.execute('CALL ValidateUserCredentials(?, ?)', [email, pass_db]);

            
            if (result[0][0].user_count == 1) {
                
            const [result] = await pool.execute(
                'SELECT count(*) FROM user_account WHERE email_address = ? AND password = ?;',
                [email, pass_db]

            );

            if (result[0]['count(*)'] == 1) {

                const [tables_accountData] = await pool.execute(
                    'SELECT * FROM user_account WHERE email_address = ?;',
                    [email]
                );
                
                const account_id = tables_accountData[0]['account_id']
                const username = tables_accountData[0]['username']

                const userData = {
                    id: account_id,
                    username: username,
                    role: 'user',
                };

                const userDataString = JSON.stringify(userData);

                const encryptedUserData = await encryptData(userDataString)

                console.log("WHAT THE HELL!!!:", encryptedUserData)
                
                // if (tables['activated'] === 0) {
                //     window.location.href = 'http://localhost:3000/activation_failure' 
                // }else {

                if (tables["is_2fa_enabled"] === 1) {
                    console.log("2FA_enabled: True")
                } else {
                    const jwtToken = jwt.sign({ encryptedUserData }, keys.secretJwtKey, { algorithm: 'HS512', expiresIn: '1h' });

                    // Set the JWE in a cookie
                    res.cookie('jwtToken', jwtToken, {
                      httpOnly: true,
                      sameSite: 'Strict',
                      secure: true,
                      maxAge: 3600000,
                    });
                }
        
                return res.status(200).json({ message: 'Account Login Success', result });
            }
            } else {
                return res.status(200).json({ message: 'Account Login Failed', result });
            }
        }
        else {
            return res.status(200).json({ message: 'Account Login Failed'});
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function encryptData(data) {
    const cipher = crypto.createCipheriv(keys.encryption_method, key, encryptionIV);
    return Buffer.from(cipher.update(data, 'utf8', 'hex') + cipher.final('hex'), 'hex').toString('base64');
}

async function decryptData(encryptedData) {
    const buff = Buffer.from(encryptedData, 'base64');
    const decipher = crypto.createDecipheriv(keys.encryption_method, key, encryptionIV);
    return decipher.update(buff.toString('hex'), 'hex', 'utf8') + decipher.final('utf8');
}

async function verifyPassword(password, pass_db) {
    try {
        await argon2.verify({ pass: password, encoded: pass_db });
        verificationResult = true;
        return verificationResult
    } catch (e) {
        verificationResult = false;
        console.error(e.message, e.code);
    }
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

export default loginRouter;
