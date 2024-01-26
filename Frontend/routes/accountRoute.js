import express, { Router } from 'express';
import crypto from 'crypto';
import argon2 from 'argon2-browser';
import { pool } from '../db-connection.js';
import { checkTokenValidity } from '../authorizeRolesRoute.js';
import fs from 'fs/promises';

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
        //load insecure passwords from file.
        const content = await fs.readFile('10k-worst-passwords.txt', 'utf-8');
        const passworders = content.trim().split('\n').map(password => password.trim().toLowerCase()); 
        const insecurePasswords = new Set(passworders);
        const lowercasedpassword = password.toLowerCase()

        const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;
        const forbiddenPattern = /[<>&'"\$;`|]/
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
        // Check if password has forbidden characters
        if (forbiddenPattern.test(password)){
            return res.status(400).json({ error: 'Forbidden Characters detected'})
        }
 
        if (insecurePasswords.has(lowercasedpassword)) {
            return res.status(400).json({ error: 'Your password is execptionally weak, please choose a new one' });
        }else {
            console.log("Provided password is not in the list of insecure passwords.");
        }

        const minLength = 8; // You can adjust this value based on your requirements
        if (password.length < minLength) {
            return res.status(400).json({ error: `Password must be at least ${minLength} characters long` });
        }

        // Check if password contains at least one uppercase letter
        if (!/[A-Z]/.test(password)) {
            return res.status(400).json({ error: 'Password must contain at least one uppercase letter' });
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
        
        if (result[0][0]['count'] == 1) {
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


accountRouter.post('/delete_account', async (req, res) => {
    const cookie_from_frontend = req.headers.authorization;
    const isValid = checkTokenValidity(cookie_from_frontend);
  
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid jwtToken' });
    }
  
    const id = req.body.id;
  
    try {
      // Delete user account from the database
      const [result] = await pool.execute('DELETE FROM user_account WHERE account_id = ?', [id]);
  
      // Get the expiration timestamp from the token (assuming it's a JWT)
      const jwtToken = req.cookies.jwtToken;
      const expiration_timestamp = jwtToken ? jwtToken.exp : null;
  
      // Insert the token into the blacklist table
      const [result2] = await pool.execute(
        'INSERT INTO blacklist (token, expiration_timestamp) VALUES (?, ?)',
        [jwtToken, expiration_timestamp]
      );
  
      // Clear the jwtToken cookie on the client side
      res.clearCookie('jwtToken', {
        httpOnly: true,
        sameSite: 'Strict',
        secure: true,
      });
  
      return res.status(200).json({ message: 'Account Deleted', result });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default accountRouter;