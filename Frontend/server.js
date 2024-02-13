import express from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import multer from 'multer';
import argon2 from 'argon2-browser';
import path from 'path';
import crypto from 'crypto';
import { pool } from './db-connection.js';
import { fileURLToPath } from 'url';
import sizeof from 'object-sizeof';
import { dirname } from 'path';
import { OAuth2Client } from "google-auth-library";
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rotatingFileStream from 'rotating-file-stream'
import moment from 'moment-timezone';

import { authorizeRoles, checkTokenValidity } from './routes/authorizeRolesRoute.js';
import loginRouter from './routes/loginroute.js'
import keyRouter from './routes/keyRoute.js';
import accountRouter from './routes/accountRoute.js'
import cookieRouter from './routes/cookieRoute.js';
import tfaRouter from './routes/tfaRoute.js';
import accountDataRouter from './routes/accountDataRoute.js';
import rsaRouter from './routes/rsaRoute.js';
import hashPasswordRouter from './routes/hashpasswordRoute.js';
import checkRouter from './routes/checkRoute.js';
import changePasswordRouter from './routes/changePasswordRoute.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const port = 3000;

moment.tz.setDefault('Asia/Singapore');

function createAccessLogStream() {
    return rotatingFileStream.createStream('access.log', {
        interval: '1d', // Rotate daily
        path: path.join(__dirname, 'log'),
        size: '10M', // Limit size of individual log files
        compress: 'gzip', // Compress rotated files
        initialRotation: true, // Rotate files on startup
        mode: '0644', // File mode (permissions)
    });
}

// Define custom token for date in Singapore time
morgan.token('date', (req, res, tz) => {
    return moment().tz(tz).format('YYYY-MM-DD HH:mm:ss');
});

// Define custom token to log user input
morgan.token('userInput', (req, res) => {
    return JSON.stringify(req.body); // Assuming request body is JSON
});

// Define custom token for security headers
morgan.token('securityHeaders', (req, res) => {
    const securityHeaders = {
        'Content-Security-Policy': res.get('Content-Security-Policy'),
        'X-Frame-Options': res.get('X-Frame-Options'),
        'X-XSS-Protection': res.get('X-XSS-Protection'),
        // Add more security headers as needed
    };
    return JSON.stringify(securityHeaders);
});

// Define custom format
morgan.format('securityFormat', ':date[Asia/Singapore] | :remote-addr | :remote-user | :method | :url | :status | :res[content-length] | :response-time ms | :referrer | :user-agent | :req[header] | :res[header] | :userInput | :securityHeaders');

// Log HTTP requests using Morgan with the rotating file stream and custom format
app.use(morgan('securityFormat', { stream: createAccessLogStream() }));

// Example route to demonstrate logging user input





app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  // Generate a nonce value
  const nonce = crypto.randomBytes(16).toString('hex');
  // Set the nonce value as a local variable to be accessed in the view/template
  res.locals.nonce = nonce;

  console.log(`Authentication attempt: ${req.method} ${req.originalUrl}`)
  // Call the next middleware
  next();
});

// app.use(
//     helmet({
//       contentSecurityPolicy: {
//         directives: {
//           defaultSrc: ["'self'", 'http://localhost:5000', 'cdn.jsdelivr.net'],
//           scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'cdn.jsdelivr.net'],
//           scriptSrcAttr: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
//           // Add other directives as needed
//         },
//       },
//     })
// );



//this line removes the x powered by , reducing info given out
app.use(helmet.hidePoweredBy());
app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'",'http://localhost:5000','cdn.jsdelivr.net'],
        scriptSrc: ["'self'",(req, res) => `'nonce-${res.locals.nonce}'`,
                    "https://code.jquery.com", 
                    "https://cdn.jsdelivr.net", 
                    "https://alcdn.msauth.net" ,
                    "https://apis.google.com" ,
                    "https://accounts.google.com",
                    "https://apis.google.com/js/api.js",
                    "https://accounts.google.com/gsi/client",
                    'cdn.jsdelivr.net',
                    'https://unpkg.com'],
        connectSrc: ["'self'", 
        'https://graph.microsoft.com',
        'https://unpkg.com','https://api.onedrive.com'
        ,'https://public.bn.files.1drv.com',
        'https://api.onedrive.com/v1.0/drives', 
        "https://alcdn.msauth.net",'https://login.microsoftonline.com',
        "http://localhost:5000","https://www.googleapis.com",'https://91exrw.bn.files.1drv.com'],  
        imgSrc: ["'self'", "data:","blob:"],
        formAction: ["'self'", "https://onedrive.live.com"],
        frameSrc: ["'self'", "https://docs.google.com","https://content.googleapis.com/"],
        scriptSrcAttr: [(req, res) => `'nonce-${res.locals.nonce}'`]
      },
    })
);

// app.use(
//     helmet.contentSecurityPolicy({
//       directives: {
//         defaultSrc: ["'self'",'http://localhost:5000','cdn.jsdelivr.net'],
//         scriptSrc: ["'self'",(req, res) => `'nonce-${res.locals.nonce}'`,"https://code.jquery.com", "https://cdn.jsdelivr.net", "https://alcdn.msauth.net" , "https://apis.google.com" ,"https://accounts.google.com","https://apis.google.com/js/api.js","https://accounts.google.com/gsi/client",'cdn.jsdelivr.net'], // Use the nonce value dynamically
//         connectSrc: ["'self'", 'https://unpkg.com','https://api.onedrive.com','https://public.bn.files.1drv.com','https://api.onedrive.com/v1.0/drives', "https://alcdn.msauth.net",'https://login.microsoftonline.com',"http://localhost:5000","https://www.googleapis.com"],    
//         imgSrc: ["'self'", "data:"],
//         formAction: ["'self'", "https://onedrive.live.com"],
//         frameSrc: ["'self'", "https://docs.google.com","https://content.googleapis.com/"],
//         scriptSrcAttr: [(req, res) => `'nonce-${res.locals.nonce}'`]
//       },
//     })
//   );

// const allowedOrigins = ['http://localhost:5000', 'http://localhost:3000'];

// const corsOptions = {
//   origin: function (origin, callback) {
//     if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true, // Allow cookies
// };
// const corsOptions = {
//   origin: function (origin, callback) {
//     if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   },
//   credentials: true, // Allow cookies
// };
// app.use(cors(corsOptions));

const corsOptions = {
    origin: 'http://127.0.0.1:5000', // Allow requests from this origin
    methods: ['GET', 'POST'],      // Allow only specified HTTP methods
    allowedHeaders: ['Content-Type'], // Allow only specified headers
    credentials: true              // Allow sending cookies along with requests
};  

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// app.use(cors(corsOptions));
app.use(upload.any());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use('/', keyRouter);
app.use('/', loginRouter);
app.use('/', accountRouter);
app.use('/', accountDataRouter);
app.use('/', rsaRouter);
app.use('/', cookieRouter);
app.use('/', tfaRouter);
app.use('/', hashPasswordRouter)
app.use('/', checkRouter);
app.use('/', changePasswordRouter)


app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'pages'));

// Set up a route to render your HTML file
app.get('/', async (req, res) => {
    const isValid = await checkTokenValidity(`Bearer: ${req.cookies.jwtToken}`);
    console.log("JWTTOKENNN:", `Bearer: ${req.cookies.jwtToken}` )
    
    if (isValid === true) {
        return res.redirect('/home');
    } else {
        return res.render('login');
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

app.get('/fileInbox', authorizeRoles(), (req, res) => {
    res.render('fileInbox', { user: req.user });
});

app.get('/resetpassword', (req, res) => {
    res.render('resetpassword', {user: req})
})

app.get('/disabletfa', (req, res) => {
    res.render('disabletfa', {user: req})
})

app.get('/deleteaccount', (req, res) => {
    res.render('deleteaccount', {user: req})
})

// app.post('/send_email_from_login', (req, res) => {
//   const email = req.body.email;

//   // Process the email as needed
//   console.log('Received email from login:', email);

//   // You can now use the email in your verification logic, store it in the database, etc.

//   // Send a response back to the client
//   res.json({ message: 'Email received successfully' });
// });

app.listen (port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});