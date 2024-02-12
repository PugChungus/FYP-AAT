import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../db-connection.js';
import argon2 from 'argon2-browser';
import { checkTokenValidity } from './authorizeRolesRoute.js';
import { getAccountIdFromCookie, getEmailAddressById } from './checkRoute.js';

const changePasswordRouter = express.Router();
let verificationResult;

changePasswordRouter.post('/checkpassword', async (req, res) => {
    const cookie_from_frontend = req.headers.authorization;
    const isValid = await checkTokenValidity(cookie_from_frontend)

    if (isValid) {
        try {
            const id_from_cookie = await getAccountIdFromCookie(cookie_from_frontend);
            const email_address = await getEmailAddressById(id_from_cookie);
            console.log("email address: " + email_address);
    
            const { email } = req.body;
            console.log("Email", email)

            if (email == email_address) {
                console.log("Authorised")
            } else {
                return res.status(401).json({ error: 'Access forbidden' });
            }

            const currentpassword = req.body.currentPassword
            console.log('Inputted Current:', currentpassword)
            const [tables] = await pool.execute('CALL check2FA(?)', [email]);

            console.log("Tables:", tables);

            const pass_db = tables[0][0].password;
            console.log("Password:", currentpassword);
            console.log("Pass_db", pass_db);

            verificationResult = await verifyPassword(currentpassword, pass_db);


            if (verificationResult == true) {
                console.log('Passwords match') 
                return res.status(200).json({ 'Validation': 'success' });
            } else{
                console.log('Passwords dont match')
            }
        } catch (error) {
            console.error('Error getting 2FA status: ', error);
            res.status(500).json({ error: 'Internal Server Error'});
        };

    }else {
        console.error("Error")
    }
    
});

changePasswordRouter.post('/changepassword', async (req, res) => {
    const cookie_from_frontend = req.headers.authorization;
    const isValid = await checkTokenValidity(cookie_from_frontend)

    if (isValid) {
        try {
            const id_from_cookie = await getAccountIdFromCookie(cookie_from_frontend);
            const email_address = await getEmailAddressById(id_from_cookie);
            console.log("email address: " + email_address);
    
            const { email } = req.body;
            console.log("Email", email)

            if (email == email_address) {
                console.log("Authorised")
            } else {
                return res.status(401).json({ error: 'Access forbidden' });
            }

            const newPassword = req.body.newPassword
            const salt = generateSalt(16)
            const encodedPassword = await hashPassword(newPassword, salt)
            console.log('Inputted Current:', encodedPassword)
            const sql = 'UPDATE user_account SET password = ? WHERE email_address = ?';
            const values = [encodedPassword, email];

            const result = await pool.query(sql, values);
            console.log("Result: ", result)

            if (result && result.length > 0) {
                const firstResult = result[0];
                if (firstResult.affectedRows > 0 || firstResult.changedRows > 0) {
                    console.log("Query successful. Rows affected: ", firstResult.affectedRows);
                    // Additional logic if needed
                    res.sendStatus(200); // Send HTTP status code 200 for success
                } else {
                    console.log("Query was not successful or did not affect any rows.");
                    // Additional logic if needed
                    res.sendStatus(404); // Send HTTP status code 404 for not found or failure
                }
            } else {
                console.log("No result returned from the query.");
                // Additional logic if needed
                res.sendStatus(500); // Send HTTP status code 500 for internal server error
            }

            
        } catch (error) {
            console.error("Error executing query:", error);
        res.sendStatus(500);
        };

    }else {
        console.error("Error")
    }
    
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

function generateSalt(length) {
    return crypto.randomBytes(length).toString('hex');
}

async function hashPassword(password, salt) {
    try {
        const res = await argon2.hash({ pass: password, salt: salt });
        const encodedHash = res.encoded;
        return encodedHash;
    } catch (err) {
        console.error(err.message, err.code);
        throw err;
    }
}

export default changePasswordRouter;