let db;

async function get_cookie() {
  const cookie_response = await fetch('http://localhost:3000/api/getCookie', {
      method: 'GET',
  });

  const cookie_data = await cookie_response.json()
  const token = cookie_data.token.jwtToken
  return token
}

function getCurrentTime() {
  const now = new Date();

  // Get the current date components
  const year = now.getFullYear().toString(); // Get the last two digits of the year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
  const day = now.getDate().toString().padStart(2, '0');

  // Get the current time components
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  // Combine the components into the desired format
  const currentTime = `${day}/${month}/${year} ${hours}:${minutes}`;

  console.log(currentTime);

  return currentTime;
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  const exportedAsString = ab2str(exported);
  const exportedAsBase64 = window.btoa(exportedAsString);
  const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
  return pemExported
}

async function exportPrivateKey(key) {
  const exported = await window.crypto.subtle.exportKey("jwk", key);
  const jwkString = JSON.stringify(exported, null, '  '); // Convert JWK to JSON string
  return jwkString
}

async function keygen() {
  try {
      const keyPair = await window.crypto.subtle.generateKey(
          {
              name: "RSA-OAEP",
              modulusLength: 4096,
              publicExponent: new Uint8Array([1, 0, 1]),
              hash: "SHA-256",
          },
          true,
          ["encrypt", "decrypt"]
      );

      return keyPair

  } catch (error) {
      console.error("Error generating key pair:", error);
  }
}

function openIndexDB(jwk_private, user_email) {
  //open specific to user email
  const DBOpenRequest = window.indexedDB.open(`${user_email}_db`, 4);
  DBOpenRequest.onupgradeneeded = (event) => {
      console.log("Database upgrade needed");
      db = event.target.result;

      if (!db.objectStoreNames.contains(`${user_email}__Object_Store`)) {
        console.log("Object Store Initialize.");
      
        const objectStore = db.createObjectStore(`${user_email}__Object_Store`, {
          keyPath: "name", // Use a valid keyPath, e.g., "privateKey"
        });
        
        // define what data items the objectStore will contain
        objectStore.createIndex("privateKey", "privateKey", { unique: false });
        objectStore.createIndex("email", "email", { unique: false });
        objectStore.createIndex("dateCreated", "dateCreated", { unique: false });
        objectStore.createIndex("name", "name", { unique: false });  
      
        // Wait for the onsuccess event before adding data
        objectStore.transaction.oncomplete = (event) => {
          console.log("Transaction completed, Object Store created successfully.");
          addData(jwk_private, user_email);
        };
      
        objectStore.transaction.onerror = (event) => {
          console.error("Error creating object store: ", event.target.error);
        };
      } else {
        console.log("Object Store already exists.");
      }      
  };

  function addData(jwk_private, user_email) {
    const transaction = db.transaction([`${user_email}__Object_Store`], "readwrite");
    const objectStore = transaction.objectStore(`${user_email}__Object_Store`);

    const newItem = {
      privateKey: jwk_private,
      email: user_email,
      dateCreated: getCurrentTime(),
      name: 'private_key'
    };

    const addRequest = objectStore.add(newItem);

    addRequest.onsuccess = () => {
      console.log("Data added successfully");
    };

    addRequest.onerror = (error) => {
      console.error("Error adding data: ", error);
    };
  }
}


const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;
//add frontend regex???????????
async function register() {
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
          keypair = await keygen();
          public_key = keypair.publicKey
          private_key = keypair.privateKey

          pem_public = await exportPublicKey(public_key)
          console.log(pem_public)
          jwk_private = await exportPrivateKey(private_key)
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
        }else{
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

async function encryptEmail(email) {
  try {
    const response = await fetch('http://localhost:5000/encrypt_email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
      }),
    });

    const data = await response.json();
    return data.encryptedEmail;
  } catch (error) {
    console.error('Error during email encryption:', error);
    return null;
  }
}

async function login(event) {
  event.preventDefault(); // Prevent the form from submitting normally

  // Get values from the form
  const email = document.getElementById('email-field').value;
  console.log("THIS:", email)
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

    const responseData = await response.text();
    console.log("Response Data: ", responseData);
    const data = JSON.parse(responseData);
    const count = data.result[0]['count(*)'];
    console.log("Count:", count);

    if (count === 1) {
      formData.append('password', password);
      console.log("ok")

      // Check if 2FA is required
      const loginResponse = await fetch('http://localhost:3000/login', {
        method: 'POST',
        body: formData,
      });

      console.log("BROOOOO:", loginResponse)

      const loginData = await loginResponse.json();
      const jwtToken = await get_cookie()

      if (loginData.result) {
        const count = loginData.result[0]['count(*)'];

        if (count === 1) {

          // Check if 2FA is required
          const get2FAResponse = await fetch('http://localhost:3000/get2faStatus', {
            method: 'POST',
            body: formData,
          });

          const response = await fetch('http://localhost:3000/get_account2', { 
            method: 'POST',
            body: formData,
          });

          const response2 = await fetch('http://localhost:5000/create_user_dict', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer: ${jwtToken}`
            },
            body: formData,
          });

          const data = await response.json();
          var username = data["tables"][0]["username"]
          var email_addr = data["tables"][0]["email_address"]
          var pfp = data["tables"][0]["profile_picture"]

          sessionStorage.setItem('profile_picture', pfp);

          const get2FAData = await get2FAResponse.json();
          console.log("2fa Data:", get2FAData);
          const is2FAEnabled = get2FAData.is_2fa_enabled === 1;
          const secret = get2FAData.secret;
          const emailz = get2FAData.email;

          console.log('Is 2FA Enabled: ', is2FAEnabled);
          console.log('Secret Key: ', secret);

          if (is2FAEnabled) {
            const sendSecretResponse = await fetch('http://localhost:5000/send_secret', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer: ${jwtToken}`
              },
              body: JSON.stringify({
                secret: secret,
              }),
            })

            const sendSecretData = await sendSecretResponse.json();
            console.log('Secret sent to server:', sendSecretData);

            const encryptedEmail = await encryptEmail(email);

            if (!encryptedEmail) {
              console.error('Email encryption failed');
            return;
            }

            sessionStorage.setItem('encrypted_email', encryptedEmail);
            window.location.href = 'http://localhost:3000/2fa';
          } else {
            // Continue with regular login process
            await continueRegularLogin(formData);
          }
          
        } else {
          alert("Login Failed");
        }
      } else {
        alert("Login Failed");
      }
    } else {
      alert('You do not have an email registered with us.');
    }
  } catch (error) {
    console.error('Error during fetch:', error);
  }
}

async function continueRegularLogin(formData) {
  // Perform additional steps for regular login if needed
  const response = await fetch('http://localhost:3000/get_account2', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  var username = data["tables"][0]["username"];
  var email_addr = data["tables"][0]["email_address"];
  var pfp = data["tables"][0]["profile_picture"];

  sessionStorage.setItem('profile_picture', pfp);

  window.location.href = 'http://localhost:3000/home';
}

async function getEmailFromSessionStorage() {
  const email = sessionStorage.getItem('encryptedEmail');
  if (!email) {
    console.error('Email not found in sessionStorage');
    return null;
  }

  // Prepare the data to be sent in the POST request
  var data = {
    otp: otpValue
  };

  const jwtToken = await get_cookie()

  // Make an HTTP POST request to your backend endpoint
  fetch('http://localhost:5000/verify_2fa', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer: ${jwtToken}`
      },
      body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
      // Handle the response from the backend
      console.log(data);
      if (data.message === 'OTP is valid') {
        continueRegularLogin(formData)
        
      } else {
        alert('Invalid OTP. Please try again.')
      }
  })
  .catch((error) => {
      console.error('Error:', error);
  });

  return email;
}

  async function verifyTOTP(event) {
    event.preventDefault();
  
    // Get the OTP value from the input field
    var otpValue = document.getElementById('otp-field').value;
  
    // Retrieve the encrypted email from sessionStorage
    let encryptedEmail = sessionStorage.getItem('encrypted_email');
  
    if (!encryptedEmail) {
      console.error('Encrypted email not found in sessionStorage');
      return;
    }
  
    try {
      const response = await fetch('http://localhost:5000/decrypt_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedEmail: encryptedEmail,
        }),
      });
  
      const emaildata = await response.json();
  
      if (emaildata.decryptedEmail) {
        const emailValue = emaildata.decryptedEmail;
  
        // Now you can use the emailValue and otpValue for further processing
        const formData = new FormData();
        formData.append('email', emailValue);
        formData.append('otp', otpValue);

        if (!emailValue) {
          // Handle the case where the email is not found in sessionStorage
          console.error('Email not found in sessionStorage');
          return;
        }
        // Prepare the data to be sent in the POST request
        var data = {
          otp: otpValue
        };
    
        // Make an HTTP POST request to your backend endpoint
        fetch('http://localhost:5000/verify_2fa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
            // Handle the response from the backend
            console.log(data);
            if (data.message === 'OTP is valid') {
              continueRegularLogin(formData)
              
            } else {
              alert('Invalid OTP. Please try again.')
            }
        })
  
        
  
      } else {
        console.error('Email decryption failed');
      }
    } catch (error) {
      console.error('Error during email decryption:', error);
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
  
