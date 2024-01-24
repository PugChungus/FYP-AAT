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

import { authorizeRoles, checkTokenValidity } from './routes/authorizeRolesRoute.js';
import loginRouter from './routes/loginroute.js'
import accountRouter from './routes/accountRoute.js'
import cookieRouter from './routes/cookieRoute.js';
import tfaRouter from './routes/tfaRoute.js';
import accountDataRouter from './routes/accountDataRoute.js';
import rsaRouter from './routes/rsaRoute.js';

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
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
    const isTokenValid = checkTokenValidity(req);

    if (isTokenValid) {
        return res.redirect('/home');
    } else {
        return res.render('login');
    }
});

app.get('/ww', (req, res) => {
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

app.get('/get-access-token', async (req, res) => {
    try {
      const oauth2Client = new OAuth2Client({
        clientId: '822327410701-losrrlt7ukr1l2l3v7t2rgur3l7sf3kk.apps.googleusercontent.com',
        clientSecret: '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',
        redirectUri: 'http://localhost:3000/auth/google/callback'
      });
  
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive']
      });
  
      res.redirect(authUrl);
    } catch (error) {
      console.error('Error generating auth URL:', error);
      res.status(500).send('Error generating auth URL.');
    }
  });


app.get('/auth/google/callback', async (req, res) => {
    const { code } = req.query;

    // Create a new OAuth2Client with your Google credentials
    const clientId = '822327410701-losrrlt7ukr1l2l3v7t2rgur3l7sf3kk.apps.googleusercontent.com';
    const clientSecret = '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';
    const redirectUri = 'http://localhost:3000/auth/google/callback'; // Your redirect URI

    const oauth2Client = new OAuth2Client({
      clientId,
      clientSecret,
      redirectUri
    });

    try {
      // Get an access token using the code from the callback
      const { tokens } = await oauth2Client.getToken(code);
      
      
      // Use the access token to make requests to Google APIs or other services
      const accessToken = tokens.access_token;
      //app.locals.accessToken = accessToken;
      console.log("TOKENZ:", accessToken)
      // Sending the access token in the response
      app.locals.token = accessToken;
      //TODO: Discuss
      //Check username and create client file , check if user file exist if not create.


      
      res.send(`You are authenticated close this page and return to the app`)
      
    } catch (error) {
      console.error('Error getting access token:', error);
      res.status(500).send('Error getting access token.');
    }
  });


  app.post('/send_email_from_login', (req, res) => {
    const email = req.body.email;
  
    // Process the email as needed
    console.log('Received email from login:', email);
  
    // You can now use the email in your verification logic, store it in the database, etc.
  
    // Send a response back to the client
    res.json({ message: 'Email received successfully' });
  });




 
// Function to handle opening Google Picker
// function openGooglePicker() {
//   const developerKey = 'YOUR_DEVELOPER_KEY'; // Replace with your own Google Developer API Key
//   const clientId = 'YOUR_CLIENT_ID'; // Replace with your own Google Client ID
//   const scope = ['https://www.googleapis.com/auth/drive.file'];
//   const SCOPES = 'https://www.googleapis.com/auth/drive';
//   //const CLIENT_ID = '984198711838-2uekpq9dj3nkbe4igf9jl3h78lsvse9p.apps.googleusercontent.com';
//   //const API_KEY = 'AIzaSyB90VRo8ldzFuNyJNk1nmmgUgUUOn90IVs';
//   //const APP_ID = '984198711838';
//   const API_KEY = 'AIzaSyDxVkK8qEwzfy0T7jWzrVlExGicSv6ntro';
//   const APP_ID = '822327410701';
//   const CLIENT_ID = '822327410701-losrrlt7ukr1l2l3v7t2rgur3l7sf3kk.apps.googleusercontent.com'
  
//   gapi.auth.authorize(
//     {
//       'client_id': CLIENT_ID,
//       'scope': SCOPES,
//       'immediate': false
//     },
//     function (authResult) {
//       if (authResult && !authResult.error) {
//         const picker = new google.picker.PickerBuilder()
//             .enableFeature(google.picker.Feature.NAV_HIDDEN)
//             .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
//           .addView(new google.picker.DocsView())
//           .setOAuthToken(authResult.access_token)
//           .setDeveloperKey(developerKey)
//           .setCallback(pickerCallback)
//           .build();
//         picker.setVisible(true);
//       }
//     }
//   );
// }

// // Callback function for Google Picker
// async function pickerCallback(data) {
//     if (data.action === google.picker.Action.PICKED) {
//         const headers = {
//             Authorization: `Bearer ${accessToken}` // Include the access token in the Authorization header
  
//           };
//         const document = data[google.picker.Response.DOCUMENTS][0];
//         const fileId = document[google.picker.Document.ID];
//         const mimeType = document[google.picker.Document.MIME_TYPE];
//         console.log(fileId)
//         try {
//     const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
//         method: 'GET',
//         headers: headers,
//         'key': API_KEY
//         });
//          // Process  each picked file
//          console.log('response', response)
//          if (response.ok) {
//            const blobe = await response.blob();
//            console.log("heyy")
//            console.log(response)
//            //const base64 = `data:${mimeType};base64,${await this.blobToBase64(blob)}`;
//            // Now you have the file content as a base64-encoded string - proceed as desired
//            const file = new File([blob], document[google.picker.Document.NAME]);
//            uploadFile(file)
          
//         } else {
//           console.error('Failed to fetch file:', response.status, response.statusText);
//         }
//         } catch (error) {
//           console.error('Error while fetching file:', error);
//         }
        
//       }
// }

// Add click event listener to the button to open Google Picker
//document.getElementById('openPicker').addEventListener('click', openGooglePicker);

app.listen (port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});