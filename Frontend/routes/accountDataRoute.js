import express, { Router } from 'express';
import { pool } from '../db-connection.js';
import { checkTokenValidity } from './authorizeRolesRoute.js'
import { getAccountIdFromCookie, getEmailAddressById } from './check.js';

const accountDataRouter = express.Router();

accountDataRouter.post('/get_account', async (req, res) => {
    const id = req.body.id;
    const cookie_from_frontend = req.headers.authorization;

    const isValid = await checkTokenValidity(cookie_from_frontend);
    if (isValid === true) {
        console.log('Valid token');
        const id_from_cookie = await getAccountIdFromCookie(cookie_from_frontend);
        
        if (id == id_from_cookie) {
            console.log("Authorised")
        } else {
            return res.status(401).json({ error: 'Access forbidden' });
        }

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
    } else {
        return res.status(401).json({ error: 'Invalid Token' });
    }

});

accountDataRouter.post('/get_account2', async (req, res) => {
    const email = req.body.email;
    const cookie_from_frontend = req.headers.authorization;
    const isValid = await checkTokenValidity(cookie_from_frontend);

    if (isValid === true) {

        const id_from_cookie = await getAccountIdFromCookie(cookie_from_frontend);
        const email_address = await getEmailAddressById(id_from_cookie);

        if (email == email_address) {
            console.log("Authorised")
        } else {
            return res.status(401).json({ error: 'Access forbidden' });
        }

        try {
            const [tables] = await pool.execute('CALL GetUserAccountByEmail(?)', [email]);
            
            return res.status(200).json({ message: 'Account Data', tables });
        
        } catch (error) {
            console.log("error here")
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        return res.status(401).json({ error: 'Invalid Token' });
    }
});

accountDataRouter.post('/search_users', async (req, res) => {
    const userInput = req.body.search;
    const cookie_from_frontend = req.headers.authorization;
    const isValid = await checkTokenValidity(cookie_from_frontend)
    if (isValid === true) {
        console.log('Valid token');
        try {
            const [tables] = await pool.execute('SELECT username, profile_picture, email_address FROM user_account WHERE username LIKE ?', [`${userInput}%`]);
    
            return res.status(200).json({ message: 'Account Data', result: tables });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        return res.status(401).json({ error: 'Invalid Token' });
    }

});

export default accountDataRouter;