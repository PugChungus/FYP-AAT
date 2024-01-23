import express, { Router } from 'express';
import { pool } from '../db-connection.js';

const accountDataRouter = express.Router();

accountDataRouter.post('/get_account', async (req, res) => {
    const id = req.body.id;

    try {
        const [tables] = await pool.execute(
            'SELECT * FROM user_account WHERE account_id = ?;',
            [id]
        );

        return res.status(200).json({ message: 'Account Data', tables });
       
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

accountDataRouter.post('/get_account2', async (req, res) => {
    const email = req.body.email;
    
    try {
        const [tables] = await pool.execute('CALL GetUserAccountByEmail(?)', [email]);
        
        return res.status(200).json({ message: 'Account Data', tables });
       
    } catch (error) {
        console.log("error here")
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default accountDataRouter;