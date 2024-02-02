import express from "express";
import { pool } from "../db-connection.js"; 

const forgetPasswordRouter = express.Router();

forgetPasswordRouter.post('/doesEmailExist', async (req, res) => {
    const email = req.body.email;
  
    try {
      // Check the count of occurrences of the username in the database
      const [result] = await pool.execute('SELECT COUNT(*) as count FROM user_account WHERE email_address = ?', [email]);
  
      const count = result[0].count;
  
      if (count > 0) {
        return res.status(200).json({ message: 'Continuing', exists: true });
      } else {
        return res.status(200).json({ message: 'Account does not exist', exists: false });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });



export default forgetPasswordRouter;