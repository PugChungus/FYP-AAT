import express, { Router } from 'express';
import crypto from 'crypto';
import argon2 from 'argon2-browser';
import { pool } from '../db-connection.js';

const accountRouter = express.Router();

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

accountRouter.post('/create_account', async (req, res) => {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;

        const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;

        // Check if all fields are filled
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields must be filled' });
        }

        // Check if email is valid
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const random_salt = generateSalt(16)
        const encodedHash = await hashPassword(password, random_salt)
        console.log("Salt:", random_salt)
        console.log("Encode Hash:", encodedHash)

        const [result] = await pool.execute('CALL create_account(?, ?, ?)', [username, encodedHash, email]);
        

        res.cookie('jwtToken', '', {
            expires: new Date(0),  // Set expiration to a past date
            httpOnly: true,
            sameSite: 'Strict',
            secure: true,
        });    

        return res.status(200).json({ message: 'Account created successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

accountRouter.post('/check_account', async (req, res) => {
    const email = req.body.email;
    console.log("EMAIL REQUEST:", email)
    const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const [result] = await pool.execute('CALL Check_account(?)', [email]);
        console.log("RESULT:", result)
        const count = result[0]['count(*)'] || 0;
        if (result[0][0]['count(*)'] == 1) {
            
            return res.status(200).json({ message: 'Email Exists', result });
        } else {
            return res.status(200).json({ message: 'Email Does Not Exist', result });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default accountRouter;