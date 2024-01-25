import jwt from 'jsonwebtoken';
import { keys, decryptData } from './keyRoute.js';

export function authorizeRoles() {
    return (req, res, next) => {
        try {
            const jwtToken = req.cookies?.jwtToken;

            if (!jwtToken) {
                res.status(401).render('accessdenied');
            }

            const decodedToken = jwt.verify(jwtToken, keys.secretJwtKey);
            const encryptedUserData = decodedToken.encryptedUserData;

            decryptData(encryptedUserData)
                .then(decryptedUserData => {
                    const originalObject = JSON.parse(decryptedUserData)
                    const role = originalObject.role
                    if (role === 'user') {
                        next();
                    } else {
                        res.status(401).render('accessdenied');
                    }
                })
                .catch(error => {
                    console.error('Error during decryption:', error);
                    res.status(401).render('accessdenied');
                });
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                res.status(401).render('accessdenied');
            }

            res.status(401).render('accessdenied');
        }
    };
}

export function checkTokenValidity(authorizationHeader) {
    if (!authorizationHeader) {
        // If there's no token, it's considered invalid
        return false;
    }

    // Ensure authorizationHeader is a string
    const headerString = authorizationHeader.toString();

    // Extract the token from the Authorization header
    const token = headerString.split(' ')[1];

    try {
        // Decode the JWT token to check its validity
        jwt.verify(token, keys.secretJwtKey);
        return true;
    } catch (error) {
        // Handle token verification errors (e.g., expired token)
        return false;
    }
}
