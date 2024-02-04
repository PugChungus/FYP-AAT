import express, { Router } from 'express';
import { pool } from '../db-connection.js';
import e from 'express';

const rsaRouter = express.Router();

rsaRouter.post('/get_shared_files', async (req, res) => {
    try {
        const id = req.body.id;

        // Now, you have the account_id, and you can use it in the next INSERT statement
        const file_rows = await pool.execute(`
            SELECT file_shared.*, user_account.email_address AS shared_by_email
            FROM file_shared
            INNER JOIN user_account ON file_shared.shared_by = user_account.account_id
            WHERE file_shared.shared_to = ?
            ORDER BY file_shared.date_shared DESC
        `, [id]);

        return res.status(200).json({ message: 'Shared files retrieved', file_rows });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

rsaRouter.post('/get_pubkey', async (req, res) => {
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