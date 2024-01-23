import express from 'express';
import jwt from 'jsonwebtoken';
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

export default cookieRouter;