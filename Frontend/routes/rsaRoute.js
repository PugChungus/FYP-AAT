import express, { Router } from 'express';
import { pool } from '../db-connection.js';
import e from 'express';
import { checkTokenValidity } from './authorizeRolesRoute.js';

const rsaRouter = express.Router();

rsaRouter.post('/get_shared_files', async (req, res) => {
    try {
        const id = req.body.id;
        const cookie_from_frontend = req.headers.authorization
        const isValid = await checkTokenValidity(cookie_from_frontend)
        if (isValid === true) {
            console.log('Valid token');
            const file_rows = await pool.execute(`
            SELECT file_shared.*, user_account.email_address AS shared_by_email
            FROM file_shared
            INNER JOIN user_account ON file_shared.shared_by = user_account.account_id
            WHERE file_shared.shared_to = ?
            ORDER BY file_shared.date_shared DESC
        `, [id]);

        return res.status(200).json({ message: 'Shared files retrieved', file_rows });
        } else {
            return res.status(401).json({ error: 'Invalid Token' });
        }

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

rsaRouter.post('/get_pubkey', async (req, res) => {

    const cookie_from_frontend = req.headers.authorization
    const isValid = await checkTokenValidity(cookie_from_frontend)

    if (isValid === true) {
        console.log('Valid token');
        try {
            const email = req.body.email;
    
            // Now, you have the account_id, and you can use it in the next INSERT statement
            const publicKeyResult = await pool.execute(`SELECT public_key
            FROM public_key
            INNER JOIN user_account
            ON public_key.account_id = user_account.account_id
            WHERE email_address = ?`, [email]);
    
            return res.status(200).json({ message: 'Public Key retrieved', result: publicKeyResult });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        return res.status(401).json({ error: 'Invalid Token' });
    }

})


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