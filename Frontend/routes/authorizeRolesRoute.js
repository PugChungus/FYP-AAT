import jwt from 'jsonwebtoken';
import { pool } from '../db-connection.js';
import { keys, decryptData } from './keyRoute.js';

export function authorizeRoles() {
    return async (req, res, next) => {
        try {
            const jwtToken = req.cookies.jwtToken;

            if (!jwtToken) {
                return res.status(401).render('accessdenied');
            }

            const isValid = await checkTokenValidity(`Bearer: ${jwtToken}`);

            if (isValid) {
                const decodedToken = jwt.verify(jwtToken, keys.secretJwtKey);
                const encryptedUserData = decodedToken.encryptedUserData;

                try {
                    const decryptedUserData = await decryptData(encryptedUserData);
                    const originalObject = JSON.parse(decryptedUserData);
                    const role = originalObject.role;

                    if (role === 'user') {
                        return next();
                    } else {
                        return res.status(401).render('accessdenied');
                    }
                } catch (error) {
                    console.error('Error during decryption:', error);
                    return res.status(401).render('accessdenied');
                }
            } else {
                return res.status(401).render('accessdenied');
            }
        } catch (error) {
            return res.status(401).render('accessdenied');
        }
    };
}

export async function checkTokenValidity(authorizationHeader) {
    if (!authorizationHeader) {
        // If there's no token, it's considered invalid
        return false;
    }

    // Ensure authorizationHeader is a string
    const headerString = authorizationHeader.toString();

    // Extract the token from the Authorization header
    const [bearer, token] = headerString.split(' ');

    if (bearer !== 'Bearer:' || token == 'undefined') {
        // Invalid format, return false
        return false;
    }

    console.log('this is da token', token)

    try {
        // Check if the token is in the token_blacklist table
        const [blacklistResult] = await pool.execute('SELECT * FROM token_blacklist WHERE token = ?', [token]);

        // Check if the token is in the token_whitelist table
        const [whitelistResult] = await pool.execute('SELECT * FROM token_whitelist WHERE token = ?', [token]);

        console.log('results', blacklistResult, whitelistResult)
        console.log('results2', blacklistResult.length, whitelistResult.length)

        // Check if the token has expired
        const decodedToken = jwt.verify(token, keys.secretJwtKey);
        
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (decodedToken.exp && decodedToken.exp < currentTimestamp) {
            // Token has expired
            return false;
        }

        // Check conditions and return the result
        if (blacklistResult.length === 0 && whitelistResult.length > 0) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error('Error during token validity check:', error);
        return false;
    }
}