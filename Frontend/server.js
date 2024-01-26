import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import multer from 'multer';
import argon2 from 'argon2-browser';
import path from 'path';
import crypto from 'crypto';
import { pool } from './db-connection.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { OAuth2Client } from "google-auth-library";
import jwt from 'jsonwebtoken';

import { authorizeRoles, checkJwtToken } from './routes/authorizeRolesRoute.js';
import loginRouter from './routes/loginroute.js'
import accountRouter from './routes/accountRoute.js'
import cookieRouter from './routes/cookieRoute.js';
import tfaRouter from './routes/tfaRoute.js';
import accountDataRouter from './routes/accountDataRoute.js';
import rsaRouter from './routes/rsaRoute.js';
import helmet from 'helmet';


const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(helmet());
app.use(upload.any());
app.use(cors());
app.use(cookieParser());
app.use('/', loginRouter);
app.use('/', accountRouter);
app.use('/', accountDataRouter);
app.use('/', rsaRouter);
app.use('/', cookieRouter);
app.use('/', tfaRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'pages'));

// Set up a route to render your HTML file
app.get('/', (req, res) => {
    const isTokenValid = checkJwtToken(req.cookies.jwtToken);

    if (isTokenValid) {
        return res.redirect('/home');
    } else {
        return res.render('login');
    }
});

app.get('/register', (req, res) => {
    // Render the HTML page for authorized users
    res.render('register');
});

app.get('/activation', (req, res) => {
    // Render the HTML page for authorized users
    res.render('activation');
});

app.get('/activation_failure', (req, res) => {
    // Render the HTML page for authorized users
    res.render('activation_failure');
});

app.get('/forgetpassword', (req, res) => {
    res.render('forgetpassword');
});

app.get('/2fa', authorizeRoles(), (req, res) => {
    res.render('2fa', { user: req.user });
});

app.get('/change-password', authorizeRoles(), (req, res) => {
    res.render('change-password', { user: req.user });
});

app.get('/decrypt', authorizeRoles(), (req, res) => {
    res.render('decrypt', { user: req.user });
});

app.get('/edit-profile', authorizeRoles(), (req, res) => {
    res.render('edit-profile', { user: req.user });
});

app.get('/encrypt', authorizeRoles(), (req, res) => {
    res.render('encrypt', { user: req.user });
});

app.get('/history', authorizeRoles(), (req, res) => {
    res.render('history', { user: req.user });
});

app.get('/home', authorizeRoles(), (req, res) => {
    res.render('home', { user: req.user });
});

app.get('/keymanagement', authorizeRoles(), (req, res) => {
    res.render('keymanagement', { user: req.user });
});

app.get('/profile', authorizeRoles(), (req, res) => {
    res.render('profile', { user: req.user });
});

app.get('/settings', authorizeRoles(), (req, res) => {
    res.render('settings', { user: req.user });
});

// app.post('/enable2fa', async (req, res) => {
//     try {
//         const cookie_from_frontend =  req.headers.authorization
//         const isValid = checkTokenValidity(cookie_from_frontend)
       
//         if (!isValid) {
//             console.log("Error Validating Key")
//         } else {
//             const { id } = req.body;
        
//             const sql = 'UPDATE user_account SET is_2fa_enabled = 1 WHERE account_id = ?';
//             const values = [id];
        
//             await pool.query(sql, values);
        
//             res.json({ message: '2FA Enabled' });
//         }
//     } catch (error) {
//       console.error('Error enabling 2FA:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
//   });

// app.post('/disable2fa', async (req, res) => {
//     try {
//         const { id } = req.body;

//         const sql = 'UPDATE user_account SET is_2fa_enabled = 0 WHERE account_id = ?'
//         const values = [id];
//         await pool.query(sql, values);
//         res.json({ message: '2FA Disabled'});
//     } catch (error) {
//         console.error('Error Disabling 2FA:', error)
//         res.status(500).json({error: 'Internal Server Error'})
//     }
// })

// app.post('/get2faStatus', async (req, res) => {
//     try {
//         const { email } = req.body.email;

//         const sql = 'SELECT is_2fa_enabled, tfa_secret FROM user_account WHERE email_address = ?';
//         const values = [email];

//         const result = await pool.query(sql, values);
//         console.log("Result: ", result)

//         if (result.length > 0 && result[0].length) {
//             const is2FAEnabled = result[0][0].is_2fa_enabled;
//             const tfasecret = result[0][0].tfa_secret;

//             console.log('is_2fa_enabled:', is2FAEnabled);
//             console.log("TFASecret:", tfasecret)
//             res.json({ is_2fa_enabled: is2FAEnabled, secret: tfasecret});
//         } else {
//             res.status(404).json({ error: 'User not found '});
//         }
//     } catch (error) {
//         console.error('Error getting 2FA status: ', error);
//         res.status(500).json({ error: 'Internal Server Error'});
//     };
// });




  app.post('/send_email_from_login', (req, res) => {
    const email = req.body.email;
  
    // Process the email as needed
    console.log('Received email from login:', email);
  
    // You can now use the email in your verification logic, store it in the database, etc.
  
    // Send a response back to the client
    res.json({ message: 'Email received successfully' });
  });


app.listen (port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});