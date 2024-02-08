import express from 'express';
import { pool } from '../db-connection.js';
import { checkTokenValidity } from './authorizeRolesRoute.js';
import { getAccountIdFromCookie, getEmailAddressById } from './checkRoute.js';


const tfaRouter = express.Router();

tfaRouter.post('/get2faStatus', async (req, res) => {
    const cookie_from_frontend = req.headers.authorization;
    const isValid = await checkTokenValidity(cookie_from_frontend)

    if (isValid) {
        try {
            const id_from_cookie = await getAccountIdFromCookie(cookie_from_frontend);
            const email_address = await getEmailAddressById(id_from_cookie);
    
            const { email } = req.body;

            if (email == email_address) {
                console.log("Authorised")
            } else {
                return res.status(401).json({ error: 'Access forbidden' });
            }    
    
            console.log("email:", email)
    
            const sql = 'SELECT is_2fa_enabled, tfa_secret FROM user_account WHERE email_address = ?';
            const values = [email];
    
            const result = await pool.query(sql, values);
            console.log("Result: ", result)
    
            if (result.length > 0 && result[0].length) {
                const is2FAEnabled = result[0][0].is_2fa_enabled;
                const tfasecret = result[0][0].tfa_secret;
    
                console.log('is_2fa_enabled:', is2FAEnabled);
                console.log("TFASecret:", tfasecret)
                res.json({ is_2fa_enabled: is2FAEnabled, secret: tfasecret});
            } else {
                res.status(404).json({ error: 'User not found '});
            }
        } catch (error) {
            console.error('Error getting 2FA status: ', error);
            res.status(500).json({ error: 'Internal Server Error'});
        };

    }else {
        console.error("Error")
    }
    
});

tfaRouter.post('/disable2fa', async (req, res) => {
    try {
        const { id } = req.body.id;
        const cookie_from_frontend = req.headers.authorization
        const isValid = await checkTokenValidity(cookie_from_frontend)

        if (isValid === true) {
            console.log('Valid token');
            const id_from_cookie = await getAccountIdFromCookie(cookie_from_frontend);
        
            if (id == id_from_cookie) {
                console.log("Authorised")
            } else {
                return res.status(401).json({ error: 'Access forbidden' });
            }
    
            const sql = 'UPDATE user_account SET is_2fa_enabled = 0 WHERE account_id = ?'
            const values = [id];
            await pool.query(sql, values);
            res.json({ message: '2FA Disabled'});
        } else {
            return res.status(401).json({ error: 'Invalid Token' });
        }

    } catch (error) {
        console.error('Error Disabling 2FA:', error)
        res.status(500).json({error: 'Internal Server Error'})
    }
})

tfaRouter.post('/enable2fa', async (req, res) => {
    try {
        const cookie_from_frontend =  req.headers.authorization
        console.log("Cookie from Frontend:", cookie_from_frontend)
        const isValid = await checkTokenValidity(cookie_from_frontend)
       
        if (!isValid) {
            console.log("Error Validating Key")
        } else {
            const id  = parseInt(req.body.id);
            console.log('Req bidy', id)
            console.log('Req Body type:', typeof(id))
            const id_from_cookie = await getAccountIdFromCookie(cookie_from_frontend);
            console.log('id from cookie:', id_from_cookie)
            console.log('Type of id from cookie:', typeof(id_from_cookie))
        
            if (id === id_from_cookie) {
                console.log("Authorised")
                const sql = 'UPDATE user_account SET is_2fa_enabled = 1 WHERE account_id = ?';
                const values = [id];
        
                await pool.query(sql, values);
        
            res.json({ message: '2FA Enabled' });
            } else {
                return res.status(401).json({ error: 'Access forbidden' });
            }
    
        }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  export default tfaRouter;