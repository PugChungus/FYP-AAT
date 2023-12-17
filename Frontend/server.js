const express = require('express');
const multer = require('multer');
const argon2 = require('argon2-browser');
const path = require('path');
const crypto = require('crypto');
const querystring = require("querystring") 
const pool = require('./db-connection.js');
const cors = require("cors")

const app = express();
const port = 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(upload.any());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up a route to render your HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/', 'login.html'));
});

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
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/create_pubkey', async (req, res) => {
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

    openIndexDB(jwk_private, email)

    if (publicKeyResult && publicKeyResult.affectedRows > 0) {
        return res.status(200).json({ message: 'Account and public key created successfully' });
    } else {
        return res.status(500).json({ error: 'Failed to create public key' });
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

        if (result[0].count > 0) {
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
            'SELECT password FROM user_account WHERE email_address = ?;',
            [email]
        );

        console.log("Tables:", tables)

        const pass_db = tables[0]['password'];
        console.log(password);
        console.log(pass_db);

        verificationResult = await verifyPassword(password, pass_db)
        console.log("check:", verificationResult)

        if (verificationResult == true) {
            console.log("ok")
            const [result] = await pool.execute(
                'SELECT count(*) FROM user_account WHERE email_address = ? AND password = ?;',
                [email, pass_db]
            );

            if (result[0]['count(*)'] == 1) {
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
    console.log(email)
    const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        const [tables] = await pool.execute(
            'SELECT * FROM user_account WHERE email_address = ?;',
            [email]
        );
        console.log(tables)
        return res.status(200).json({ message: 'Account Data', tables });
       
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});