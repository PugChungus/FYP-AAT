import express from 'express';
import crypto from 'crypto';
import argon2 from 'argon2-browser';

const hashPasswordRouter = express.Router();

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

hashPasswordRouter.post('/hashpassword', async (req, res) => {
    try {
        const { newPassword } = req.body;
        console.log("New Password: ", newPassword)

        if (!newPassword) {
            return res.status(400).json({ message: 'New password is required' });
        }

        // Generate a random salt
        const salt = generateSalt(16);

        // Hash the password using Argon2
        const encodedPassword = await hashPassword(newPassword, salt);

        // Respond with the encoded password
        return res.status(200).json({ encodedPassword });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

export default hashPasswordRouter;
