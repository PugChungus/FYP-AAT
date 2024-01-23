// loginRoute.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db-connection.js';
import argon2 from 'argon2-browser';
import { keys, encryptData } from './keyRoute.js';

const loginRouter = express.Router();
let verificationResult;

loginRouter.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
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

loginRouter.get('/logout', (req, res) => {
    // Clear the JWT token cookie
    res.cookie('jwtToken', '', {
        expires: new Date(0),  // Set expiration to a past date
        httpOnly: true,
        sameSite: 'Strict',
        secure: true,
    });

    // Redirect or respond as needed
    return res.redirect('/');
});

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

export default loginRouter;
