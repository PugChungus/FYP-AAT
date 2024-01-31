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
import helmet from 'helmet';

import { authorizeRoles, checkTokenValidity } from './routes/authorizeRolesRoute.js';
import loginRouter from './routes/loginroute.js'
import keyRouter from './routes/keyRoute.js';
import accountRouter from './routes/accountRoute.js'
import cookieRouter from './routes/cookieRoute.js';
import tfaRouter from './routes/tfaRoute.js';
import accountDataRouter from './routes/accountDataRoute.js';
import rsaRouter from './routes/rsaRoute.js';

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  // Generate a nonce value
  const nonce = crypto.randomBytes(16).toString('hex');
  // Set the nonce value as a local variable to be accessed in the view/template
  res.locals.nonce = nonce;
  // Call the next middleware
  next();
});

app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", 'http://localhost:5000', 'cdn.jsdelivr.net'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net'],
          scriptSrcAttr: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          // Add other directives as needed
        },
      },
    })
  );
  

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//          defaultSrc: ["'self'", 'http://localhost:5000'],
//         'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
//         'script-src-attr': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
//         // Add other directives as needed
//       },
//     },
//   })
// );

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(upload.any());
app.use(cors());
app.use(cookieParser());
app.use('/', keyRouter);
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
app.get('/', async (req, res) => {
    const isValid = await checkTokenValidity(`Bearer ${req.cookies.jwtToken}`);
    
    if (isValid === true) {
        return res.redirect('/home');
    } else {
        return res.render('login',{ nonce: res.locals.nonce });
    }
});

app.get('/test', (req, res) => {
    // Render the HTML page for authorized users
    res.render('test');
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

app.get('/2fa',  (req, res) => {
    res.render('2fa', {user: req.user});
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

app.get('/resetpassword', (req, res) => {
    res.render('resetpassword', {user: req})
})

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