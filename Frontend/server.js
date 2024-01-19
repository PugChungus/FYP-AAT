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

const secretJwtKey = "ACB725326D68397E743DFC9F3FB64DA50CE7FB135721794C355B0DB219C449B3" //key rotation?
const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(upload.any());
app.use(cors());
app.use(cookieParser());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public', 'pages'));

function checkTokenValidity(req) {
    const jwtToken = req.cookies.jwtToken;
    
    if (!jwtToken) {
        // If there's no token, it's considered invalid
        return false;
    }

    try {
        // Decode the JWT token to check its validity
        jwt.verify(jwtToken, secretJwtKey);
        return true;
    } catch (error) {
        // Handle token verification errors (e.g., expired token)
        return false;
    }
}

// Set up a route to render your HTML file
app.get('/', (req, res) => {
    // Check if the JWT token is valid
    const isTokenValid = checkTokenValidity(req);

    if (isTokenValid) {
        // If the token is valid, redirect to '/home'
        return res.redirect('/home');
    } else {
        // alert("Your session has expire. Please login again.");
        // If the token is invalid or not present, render 'login'
        return res.render('login');
    }
});

app.get('/2fa', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('2fa', { user: req.user });
});

app.get('/change-password', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('change-password', { user: req.user });
});

app.get('/decrypt', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('decrypt', { user: req.user });
});

app.get('/edit-profile', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('edit-profile', { user: req.user });
});

app.get('/encrypt', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('encrypt', { user: req.user });
});

app.get('/forgetpassword', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('forgetpassword', { user: req.user });
});

app.get('/history', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('history', { user: req.user });
});

app.get('/home', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('home', { user: req.user });
});

app.get('/keymanagement', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('keymanagement', { user: req.user });
});

app.get('/keypopup', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('keypopup', { user: req.user });
});

app.get('/profile', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('profile', { user: req.user });
});

app.get('/register', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('register', { user: req.user });
});

app.get('/settings', authorizeRoles(), (req, res) => {
    // Render the HTML page for authorized users
    res.render('settings', { user: req.user });
});
  
function authorizeRoles() {
    return (req, res, next) => {
      // Check if req.cookies is defined
      if (!req.cookies) {
        return res.status(401).render('accessdenied');
      }
  
      // Retrieve JWT token from the cookie
      const jwtToken = req.cookies.jwtToken;
      console.log(jwtToken)
  
      if (!jwtToken) {
        // If there's no token, user is not authenticated
        return res.status(401).render('accessdenied');
      }
  
      try {
        // Decode the JWT token to get user information, including roles
        const decodedToken = jwt.verify(jwtToken, secretJwtKey);
        try {
            // Check if req.cookies is defined
            if (!req.cookies) {
                return res.status(401).json({ message: 'Unauthorized' });
            }

            // Retrieve JWT token from the cookie
            const jwtToken = req.cookies.jwtToken;

            if (!jwtToken) {
                // If there's no token, user is not authenticated
                return res.status(401).json({ message: 'Please return to the login page to renew your token.' });
            }

            // Verify the token, catching TokenExpiredError
            const decodedToken = jwt.verify(jwtToken, secretJwtKey);

            if (decodedToken.userData && decodedToken.userData.role === 'user') {
                // User has the required role, proceed to the next middleware
                next();
            } else {
                // User does not have the required role
                res.status(403).json({ message: 'Insufficient permissions' });
            }
        } catch (error) {
            // Handle other token verification errors
            res.status(401).json({ message: 'Unauthorized' });
        }
      } catch (error) {
        // Handle token verification errors
        res.status(401).render('accessdenied');
      }
    };
}

function generateSalt(length) {
    return crypto.randomBytes(length).toString('hex');
}

async function hashPassword(password, salt) {
    try {
      const res = await argon2.hash({ pass: password, salt: salt });
      const encodedHash = res.encoded;
      return encodedHash;
    } catch (err) {
      console.error(err.message, err.code);
      throw err;
    }
}

let verificationResult;

async function verifyPassword(password, pass_db) {
    try {
        await argon2.verify({ pass: password, encoded: pass_db });
        verificationResult = true;
        return verificationResult
    } catch (e) {
        verificationResult = false;
        console.error(e.message, e.code);
    }
}

app.get('/api/getCookie', async (req, res) => {
    try {
        const jwtToken = req.cookies.jwtToken;
        console.log(jwtToken)
        return res.status(200).json({ token: {jwtToken} });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/checkTokenValidity', (req, res) => {
    const jwtToken = req.cookies.jwtToken;
  
    if (!jwtToken) {
      // If there's no token, it's considered invalid
      return res.status(401).json({ isValid: false });
    }
  
    try {
      // Decode the JWT token to check its validity
      jwt.verify(jwtToken, secretJwtKey);
      console.log("Token exists")
      res.status(200).json({ isValid: true });
    } catch (error) {
      res.render('accessdenied')
      // Handle token verification errors (e.g., expired token)
      res.status(401).json({ isValid: false });
    }
  });  

app.post('/get_data_from_cookie', async (req, res) => {
    try {
        if (!req.cookies) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const jwtToken = req.cookies.jwtToken;

        if (!jwtToken) {
            // If there's no token, user is not authenticated
            return res.status(401).json({ message: 'Unauthorized' });
        }
        else {
            const decodedToken = jwt.verify(jwtToken, secretJwtKey);
            console.log(decodedToken)
            const email = decodedToken.userData.email
            const username = decodedToken.userData.username
            
            const email_username = {
                "email": email,
                "username": username
            }
            
            console.log(email_username)

            return res.status(200).json({ message: 'Cookie data retrieved', email_username });
        }
      
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/create_account', async (req, res) => {
    try {
        const username = req.body.username;
        const email = req.body.email;
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;

        const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;

        // Check if all fields are filled
        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields must be filled' });
        }

        // Check if email is valid
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const random_salt = generateSalt(16)
        const encodedHash = await hashPassword(password, random_salt)
        console.log("Salt:", random_salt)
        console.log("Encode Hash:", encodedHash)

        const [result] = await pool.execute(  //the execute method from the mysql2 takes care of proper escaping
            'INSERT INTO user_account (username, password, email_address) VALUES (?, ?, ?)',
            [username, encodedHash, email]
        );

        return res.status(200).json({ message: 'Account created successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/create_pubkey', async (req, res) => {
    try {
        const public_key = req.body.public_key;
        console.log(public_key)

        const accountIdResult = await pool.execute(
            'SELECT LAST_INSERT_ID() as account_id'
        );

        const accountId = accountIdResult[0][0].account_id;

        // Now, you have the account_id, and you can use it in the next INSERT statement
        const publicKeyResult = await pool.execute(
            'INSERT INTO public_key (public_key, account_id, date_created) VALUES (?, ?, NOW())',
            [public_key, accountId]
        );

        return res.status(200).json({ message: 'Public Key created successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.post('/update_pubkey', async (req, res) => {
    try {
        const public_key = req.body.public_key;
        const email = req.body.email;
        console.log(public_key)

        // Now, you have the account_id, and you can use it in the next INSERT statement
        const publicKeyResult = await pool.execute(
            'UPDATE public_key ' +
            'INNER JOIN user_account ON public_key.account_id = user_account.account_id ' +
            'SET public_key.public_key = ?, public_key.date_created = NOW() ' +
            'WHERE user_account.email_address = ?',
            [public_key, email]
        );

        return res.status(200).json({ message: 'Public Key updated successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
})

app.post('/check_account', async (req, res) => {
    const email = req.body.email;
    const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const [result] = await pool.execute(  //the execute method from the mysql2 takes care of proper escaping
        'SELECT count(*) FROM user_account WHERE email_address = ?',
        [email]
        )

        if (result[0]['count(*)'] == 1) {
            return res.status(200).json({ message: 'Email Exists', result });
        } else {
            return res.status(200).json({ message: 'Email Does Not Exist', result });
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const [tables] = await pool.execute(
            'SELECT password, is_2fa_enabled FROM user_account WHERE email_address = ?;',
            [email]
        );

        const pass_db = tables[0]['password'];

        verificationResult = await verifyPassword(password, pass_db)
        //Generation of JWT token

        if (verificationResult == true) {
            
            const [result] = await pool.execute(
                'SELECT count(*) FROM user_account WHERE email_address = ? AND password = ?;',
                [email, pass_db]

            );

            if (result[0]['count(*)'] == 1) {

                const [tables_accountData] = await pool.execute(
                    'SELECT * FROM user_account WHERE email_address = ?;',
                    [email]
                );
                
                const account_email_addr = tables_accountData[0]['email_address']

                const userData = {
                    email: account_email_addr,
                    role: 'user',
                };

                if (tables["is_2fa_enabled"] === 1) {
                    console.log("2FA_enabled: True")
                } else {
                    const JWTtoken = jwt.sign({ userData }, secretJwtKey, { algorithm: 'HS256', expiresIn: '1h' });

                    res.cookie('jwtToken', JWTtoken, {
                      httpOnly: true,
                      sameSite: 'Strict',
                      secure: true,
                      maxAge: 3600000,
                    });    
                }
        
                return res.status(200).json({ message: 'Account Login Success', result });
            } else {
                return res.status(200).json({ message: 'Account Login Failed', result });
            }
        }
        else {
            return res.status(200).json({ message: 'Account Login Failed'});
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/get_account', async (req, res) => {
    const email = req.body.email;
    console.log("isit this one:", email)
    const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const [tables] = await pool.execute(
            'SELECT * FROM user_account WHERE email_address = ?;',
            [email]
        );

        return res.status(200).json({ message: 'Account Data', tables });
       
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/enable2fa', async (req, res) => {
    try {
      const { email } = req.body;
  
      const sql = 'UPDATE user_account SET is_2fa_enabled = 1 WHERE email_address = ?';
      const values = [email];
  
      await pool.query(sql, values);
  
      res.json({ message: '2FA Enabled' });
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

app.post('/disable2fa', async (req, res) => {
    try {
        const { email } = req.body;

        const sql = 'UPDATE user_account SET is_2fa_enabled = 0 WHERE email_address = ?'
        const values = [email];
        await pool.query(sql, values);
        res.json({ message: '2FA Disabled'});
    } catch (error) {
        console.error('Error Disabling 2FA:', error)
        res.status(500).json({error: 'Internal Server Error'})
    }
})

app.post('/get2faStatus', async (req, res) => {
    try {
        const { email } = req.body;

        const sql = 'SELECT is_2fa_enabled, tfa_secret FROM user_account WHERE email_address =?';
        const values = [email];

        const result = await pool.query(sql, values);
        console.log("Result: ", result)

        if (result.length > 0 && result[0].length) {
            const is2FAEnabled = result[0][0].is_2fa_enabled;
            const tfasecret = result[0][0].tfa_secret;

            console.log('is_2fa_enabled:', is2FAEnabled);
            console.log("TFASecret:", tfasecret)
            res.json({ is_2fa_enabled: is2FAEnabled, secret: tfasecret, email: email });
        } else {
            res.status(404).json({ error: 'User not found '});
        }
    } catch (error) {
        console.error('Error getting 2FA status: ', error);
        res.status(500).json({ error: 'Internal Server Error'});
    };
});

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
      console.log(accessToken)
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