import IndexedDB from './IndexedDB.js';
import rsaKeygen from './rsa_keygen.js';

const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;
//add frontend regex???????????
export async function register() {
  IndexedDB.openIndexDB();
  rsaKeygen.exportPrivateKey();
  const username = document.getElementById('username-field').value;
  const email = document.getElementById('email-field').value;
  const password = document.getElementById('password-field').value;
  const confirmPassword = document.getElementById('confirm-password-field').value;

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
  
  try {
    const formData = new FormData();
    formData.append('email', email);
    
    const response = await fetch('http://localhost:3000/check_account', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    count = data.result[0]['count(*)']

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

      try {
        const response = await fetch('http://localhost:3000/create_account', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          keypair = rsaKeygen.keygen();
          public_key = keypair.publicKey
          private_key = keypair.privateKey

          pem_public = rsaKeygen.exportPublicKey(public_key)
          jwk_private = rsaKeygen.exportPrivateKey(private_key)

          formData.append('public_key', pem_public);
          
          const newResponse = await fetch('http://localhost:3000/create_pubkey', {
            method: 'POST',
            body: formData,
          });
          if (newResponse.ok) {
            IndexedDB.openIndexDB(jwk_private, email)

            alert("Registeration Successful.")
            window.location.href = 'http://localhost:3000/pages/login.html'
          }
          else{
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

async function login(event) {
  event.preventDefault(); // Prevent the form from submitting normally

  // Get values from the form
  const email = document.getElementById('email-field').value;
  const password = document.getElementById('password-field').value;

  if (!emailRegex.test(email)) {
    alert("Invalid email format");
    return;
  }

  const formData = new FormData();
  formData.append('email', email);

  try {
    const response = await fetch('http://localhost:3000/check_account', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    count = data.result[0]['count(*)']
    console.log("Count:", count)

    if (count == 1) {
      formData.append('password', password);
      console.log("Hello")
      // account lockout after a number of tries?
      //mfa???
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        body: formData,
      });

      console.log("hello")
      const data = await response.json();
      if (data.result) {
        const count = data.result[0]['count(*)'];
      
        if (count === 1) {
          const response = await fetch('http://localhost:3000/get_account', {
            method: 'POST',
            body: formData,
          });

          const data = await response.json();
          var username = data["tables"][0]["username"]
          var email_addr = data["tables"][0]["email_address"]
          var pfp = data["tables"][0]["profile_picture"]

          sessionStorage.setItem('username', username);
          sessionStorage.setItem('email', email_addr);
          sessionStorage.setItem('profile_picture', pfp);
          
          window.location.href = 'http://localhost:3000/pages/home.html';
        } else {
          alert("Login Failed");
        }
      } else {
        alert("Login Failed");
      }
    }
    else {
      alert('You do not have an email registered with us.')
    }

  } catch (error) {
    console.error('Error during fetch:', error);
  }

  // Now you can use the 'email' and 'password' variables as needed (e.g., send them using fetch)
  console.log('Email:', email);
  console.log('Password:', password);
}
