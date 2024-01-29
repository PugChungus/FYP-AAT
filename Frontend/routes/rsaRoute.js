import express, { Router } from 'express';
import { pool } from '../db-connection.js';

const rsaRouter = express.Router();

rsaRouter.post('/create_pubkey', async (req, res) => {
    try {
      
        

        const public_key = req.body.public_key;
        console.log(public_key)

        const accountIdResult = await pool.execute(
            'SELECT LAST_INSERT_ID() as account_id'
        );

        const accountId = accountIdResult[0][0].account_id;

        // Now, you have the account_id, and you can use it in the next INSERT statement
        const publicKeyResult = await pool.execute('CALL InsertPublicKey(?, ?)', [public_key, accountId]);


        return res.status(200).json({ message: 'Public Key created successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

rsaRouter.post('/update_pubkey', async (req, res) => {
    try {
        const public_key = req.body.public_key;
        const email = req.body.email;
        console.log(public_key)

        // Now, you have the account_id, and you can use it in the next INSERT statement
        const publicKeyResult = await pool.execute('CALL UpdatePublicKey(?, ?)', [public_key, email]);


        return res.status(200).json({ message: 'Public Key updated successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

export default rsaRouter;