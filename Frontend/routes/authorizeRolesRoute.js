import jwt from 'jsonwebtoken';
import { keys, decryptData } from './keyRoute.js';

export function authorizeRoles() {
    return async (req, res, next) => {
        try {
            const jwtToken = req.cookies.jwtToken;

            if (!jwtToken) {
                return res.status(401).render('accessdenied');
            }

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
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).render('accessdenied');
            }

            return res.status(401).render('accessdenied');
        }
    };
}

export function checkJwtToken(token) {
    try {
        // Decode the JWT token to check its validity
        jwt.verify(token, keys.secretJwtKey);
        return true;
    } catch (error) {
        // Handle token verification errors (e.g., expired token)
        return false;
    }
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
