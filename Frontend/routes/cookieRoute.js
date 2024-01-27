import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db-connection.js';
import { keys, decryptData } from './keyRoute.js';

const cookieRouter = express.Router();

cookieRouter.get('/api/getCookie', async (req, res) => {
    try {
        const jwtToken = req.cookies.jwtToken;
        console.log("Getting Cookie:", jwtToken)
        return res.status(200).json({ token: {jwtToken} });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

const moveTokenToBlacklist = async (jwtToken) => {
    try {
        // Move the token from token_whitelist to token_blacklist
        await pool.execute('INSERT INTO token_blacklist (token, expiration_timestamp) SELECT token, expiration_timestamp FROM token_whitelist WHERE token = ?', [jwtToken]);

        // Remove the token from token_whitelist
        await pool.execute('DELETE FROM token_whitelist WHERE token = ?', [jwtToken]);

        console.log('Token moved to token_blacklist successfully.');
    } catch (error) {
        console.error('Error moving token to token_blacklist:', error);
    }
};

cookieRouter.post('/blacklist_token', async (req, res) => {
    try {
        const jwtToken = req.cookies.jwtToken;

        await moveTokenToBlacklist(jwtToken)
        
        res.clearCookie('jwtToken', {
            httpOnly: true,
            sameSite: 'Strict',
            secure: true,
        });

        return res.status(200).json({ message: 'Token Blacklisted', result});
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

cookieRouter.get('/checkTokenValidity', (req, res) => {
    const jwtToken = req.cookies.jwtToken;
  
    if (!jwtToken) {
      // If there's no token, it's considered invalid
      return res.status(401).json({ isValid: false });
    }
  
    try {
      // Decode the JWT token to check its validity
      jwt.verify(jwtToken, keys.secretJwtKey);
      console.log("Token exists")
      res.status(200).json({ isValid: true });
    } catch (error) {
      res.render('accessdenied')
      // Handle token verification errors (e.g., expired token)
      res.status(401).json({ isValid: false });
    }
});  

cookieRouter.post('/get_data_from_cookie', async (req, res) => {
    try {
        if (!req.cookies) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const jwtToken = req.cookies.jwtToken;

        if (!jwtToken) {
            // If there's no token, user is not authenticated
            return res.status(401).json({ message: 'Unauthorized' });
        }
        else {
            const decodedToken = jwt.verify(jwtToken, keys.secretJwtKey);
            const encryptedUserData = decodedToken.encryptedUserData;
            decryptData(encryptedUserData)
                .then(decryptedUserData => {
                    const originalObject = JSON.parse(decryptedUserData)
                    const id = originalObject.id
                    console.log(id)
                    const username = originalObject.username
                    console.log(username)
                    
                    const id_username = {
                        "id": id,
                        "username": username
                    }
                    
                    return res.status(200).json({ message: 'Cookie data retrieved', id_username });
                })
                .catch(error => {
                    console.error('Error during decryption:', error);
                    res.status(500).json({ message: 'Internal Server Error' });
                });
        }
      
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

const moveExpiredTokens = async () => {
    try {
      // Find expired tokens in the whitelist
      const [expiredTokens] = await pool.execute('SELECT * FROM token_whitelist WHERE expiration_timestamp < NOW()');
      
      // Move expired tokens to the blacklist
      for (const token of expiredTokens) {
        await pool.execute('INSERT INTO token_blacklist (token, expiration_timestamp) VALUES (?, ?)', [token.token, token.expiration_timestamp]);
      }
  
      // Optionally, delete the expired tokens from the whitelist
      await pool.execute('DELETE FROM token_whitelist WHERE expiration_timestamp < NOW()');
  
      console.log('Expired tokens moved to blacklist successfully.');
    } catch (error) {
      console.error('Error moving expired tokens:', error);
    }
};

setInterval(moveExpiredTokens, 60 * 1000);

export default cookieRouter;