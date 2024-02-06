import { keygen, exportPublicKey, exportPrivateKey } from "./RSA and IndexedDB/rsa_keygen.js";
import { openIndexDB } from "./RSA and IndexedDB/IndexedDB.js";

//NOTICE : using blur and alerts this way will cause infinite loop of alerts 
document.getElementById('username-field').addEventListener('blur', checkUsername);
document.getElementById('email-field').addEventListener('change', checkEmail);
document.getElementById('reg').addEventListener('click', register);


const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;
const passwordRegex = /[<>&'"\$;`|]/

async function checkUsername() {
  // Get the username from the input field
  var username = document.getElementById('username-field').value;

  try {
    // Make a POST request to the /check_username endpoint
    const response = await fetch('http://localhost:3000/check_username', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username: username }),
    });

    // Check if the request was successful (status code 200)
    // if (response.ok) {
    //   const data = await response.json();
    //   if (data.exists) {
    //     // Username already exists
    //     alert('Username already exists');
    //   } else {
    //     // Username is available
    //     alert('Username is available');
    //   }
    // } else {
    //   // Handle non-successful status codes
    //   alert('Failed to check username');
    // }
  } catch (error) {
    // Handle any other errors
    console.error(error);
  }
}

function checkEmail() {
    var email = document.getElementById('email-field').value;

    if (email.trim() !== "") {
        // Perform AJAX call only if email is not empty or whitespace
        $.ajax({
            type: "POST",
            url: "http://localhost:5000/check_email",  // Point to your Flask route
            data: { email: email },
            success: function(response) {
                if (response.status === "exists") {
                    alert("OK");
                } else {
                    alert("Please use an email that actually exists");
                }
            },
            error: function() {
                alert("Error checking email existence. Please try again.");
            }
        });
    }
    // If email is empty or whitespace, do nothing
}

async function register() {
    const username = document.getElementById('username-field').value;
    const email = document.getElementById('email-field').value;
    const password = document.getElementById('password-field').value;
    const confirmPassword = document.getElementById('confirm-password-field').value;
    const minLength = 8; // min length of password
    // const content = await fs.readFile('10k-worst-passwords.txt', 'utf-8');
    // const passworders = content.trim().split('\n').map(password => password.trim().toLowerCase()); 
    // // const insecurePasswords = new Set(passworders);
    // const lowercasedpassword = password.toLowerCase()
    // Check if all fields are filled
    if (!username || !email || !password || !confirmPassword) {
      alert("All fields must be filled");
      return;
    }
  
    // Check if email is valid
    if (!emailRegex.test(email)) {
      alert("Invalid email format");
      return;
    }
  
    // Check if passwords match
    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }
    // if (insecurePasswords.has(lowercasedpassword)) {
    //   alert("Your password is execeptionally weak, choose another one")
    //   return;
    // }
    if (passwordRegex.test(password)){
      alert("Forbidden Characters Detected")
      return;
    }

    if (password.length < minLength) {
      alert("Minimum length is 8 characters")
        return;
    }

    // Check if password contains at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      alert("Passowrd must contain at least one Uppercase letter")
      return;
  }
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      
      const response = await fetch('http://localhost:3000/check_account', {
        method: 'POST',
        body: formData,
      });
  
      const data = await response.json();
      const count = data.result[0][0]['count']
  
      if (count == 1) {
        alert('This email is already registered. Please use a different email.')
        return
      }
      else {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('confirmPassword', confirmPassword);
        console.log("FormData", formData)
  
        try {
          const response = await fetch('http://localhost:3000/create_account', {
            method: 'POST',
            body: formData,
          });
  
          if (response.ok) {
            const keypair = await keygen();
            const public_key = keypair.publicKey
            const private_key = keypair.privateKey
  
            const pem_public = await exportPublicKey(public_key)
            console.log(pem_public)
            const jwk_private = await exportPrivateKey(private_key)
            console.log(jwk_private)
  
            formData.append('public_key', pem_public);
            
            const newResponse = await fetch('http://localhost:3000/create_pubkey', {
              method: 'POST',
              body: formData,
            });
            
            if (newResponse.ok) {
              const verificationFormData = new FormData();
              verificationFormData.append('email', email)
              console.log('Am I getting it lmao?:', verificationFormData)
  
              const verificationResponse = await fetch('http://localhost:5000/email_verification', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(Object.fromEntries(verificationFormData.entries())),
            });
  
            if (verificationResponse.ok) {
              openIndexDB(jwk_private, email);
              alert("Registration Successful. Please Check your Email to activate your account. Mail Might take up to 5 Minutes. Might wanna check Junk or Spam folder ;)");
              window.location.href = 'http://localhost:3000';
            } else {
              alert("Email verification failed. Please try again.");
            }
  
          } else {
              alert("Registeration Failed.")
            }
          }
  
        } catch (error) {
          console.error('Error during fetch:', error);
        }
      }
    } catch (error) {
      console.error('Error during fetch:', error);
    }
}
