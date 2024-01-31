import { get_cookie } from "./cookie.js";
import { keygen, exportPublicKey, exportPrivateKey } from "./RSA and IndexedDB/rsa_keygen.js";
import { openIndexDB } from "./RSA and IndexedDB/IndexedDB.js";

const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;
//add frontend regex???????????
export async function register() {
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



export async function login(event) {
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
  console.log("FORMDATAAPPENDING:", formData)

  try {

    const response = await fetch('http://localhost:3000/check_account', {
      method: 'POST',
      body: formData,
    });

    const responseData = await response.text()
    console.log("Response Data: ", responseData)
    const data = JSON.parse(responseData)
    let count = data.result[0][0].count
    console.log("Count:", count)

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
      let encryptedUserData = loginData['encryptedUserData']
      console.log("MAYBE???:", loginData['encryptedUserData'])
      console.log("IS THIS EVEN CORRECT???:", encryptedUserData)
      console.log("loginDataMessage:", loginData['message'])
      if (loginData['message'] === 'Account is Not Activated') {
        window.location.href='http://localhost:3000/activation_failure'
      } else if (loginData['message'] === '2FA Required' ) {
        const get2FAResponse = await fetch('http://localhost:3000/get2faStatus', {
            method: 'POST',
            body: formData,
          });

          const get2FAData = await get2FAResponse.json();
          console.log("2fa Data:", get2FAData);
          const is2FAEnabled = get2FAData.is_2fa_enabled === 1;
          const secret = get2FAData.secret;
          const emailz = get2FAData.email;

          console.log('Is 2FA Enabled: ', is2FAEnabled);
          console.log('Secret Key: ', secret);
          const sendSecretResponse = await fetch('http://localhost:5000/send_secret', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                secret: secret,
              }),
            })

            const sendSecretData = await sendSecretResponse.json();
            console.log('Secret sent to server:', sendSecretData);
            const encryptedEmail = await encryptEmail(email);

            sessionStorage.setItem('encrypted_email', encryptedEmail);
            const encryptUserDataResponse = await fetch('http://localhost:5000/encrypt_user_data', {
                    method: 'POST',
                    body: JSON.stringify({
                    userData: encryptedUserData,
                  }),
                  headers: {
                'Content-Type': 'application/json',
                  },
              });

            const encryptUserDataResult = await encryptUserDataResponse.json();
            console.log('Result of encrypt_user_data_route:', encryptUserDataResult);
            console.log("NOWNOW:", encryptUserDataResult["encryptedUserData"])

  // Store encryptedUserData in sessionStorage
            sessionStorage.setItem('encrypted_user_data', encryptUserDataResult["encryptedUserData"]);
            // console.log("SESSION STORAGE???:", encryptedUserData)
            window.location.href='http://localhost:3000/2fa';
        


      } else {
      const jwtToken = await get_cookie();

      console.log(data)
      
      if (loginData.result) {
        console.log(data.result)
        // document.cookie = `jwtToken=${data.JWTtoken}; SameSite=Strict; Secure`;
        const count = loginData.result[0]['count(*)']
        console.log(count)
        if (count === 1) {


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
            await continueRegularLogin(formData);
          
        } else {
          alert("Login Failed");
        }
      } else {
        alert("Login Failed here  ");
      }
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

export async function verifyTOTP(event) {
  event.preventDefault();

  // Get the OTP value from the input field
  const otpValue = document.getElementById('otp-field').value;

  const encryptedEmail = sessionStorage.getItem('encrypted_email');
  let emailData;

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

    emailData = await response.json();

    console.log('Decrypted Email Data:', emailData);
    console.log("MORE SPECIFIC:",emailData.decryptedEmail )

    if (emailData.decryptedEmail) {
      const emailValue = emailData.decryptedEmail;
      console.log("email check:", emailValue)

      if (!emailValue) {
        // Handle the case where the email is not found in sessionStorage
        console.error('Email not found in sessionStorage');
        return;
      }
    }
  } catch (error) {
    console.error('Error during email decryption:', error);
  }

  // Retrieve the encryptedUserData from sessionStorage
  const formData = new FormData();
  formData.append('email', emailData.decryptedEmail);

  const encryptedUserDataFromSession = sessionStorage.getItem('encrypted_user_data');

  if (!encryptedUserDataFromSession) {
    console.error('Encrypted user data not found in sessionStorage');
    return;
  }
  console.log("LOUD AND PROUD:", encryptedUserDataFromSession)
  try {
    const response1 = await fetch('http://localhost:5000/decrypt_user_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        encryptedUserData: encryptedUserDataFromSession,
      }),
    });

    // const responseText1 = await response1.text();
    // console.log('Response from decrypt_user_data:', responseText1);

    const decryptedUserData = await response1.json();
    console.log("WEHWEH:", decryptedUserData)

    const data = {
      otp: otpValue,
    };

    // Make an HTTP POST request to verify the OTP
    const response2 = await fetch('http://localhost:5000/verify_2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response2.json();
    const newData = decryptedUserData.decryptedUserData
    const formDatax = new FormData();
    formDatax.append('encryptedUData', JSON.stringify(newData))

    console.log('Data to be sent to http://localhost:3000/genToken:', {
  encryptedUserData: newData,
});

    console.log('FormDataxData: ', formDatax)

    if (responseData.message === 'OTP is valid') {
      console.log("WEHWEH2:", decryptedUserData.decryptedUserData)
      console.log('Data to be sent to http://localhost:3000/genToken:', JSON.stringify({ encryptedUData: newData }));
      const verifyTokenResponse = await fetch('http://localhost:3000/genToken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedUData: newData }),
      });

      const verifyTokenData = await verifyTokenResponse.json();

      if (verifyTokenData.message === 'JWT Token Generated Successfully') {
        // Continue with regular login process or handle success as needed

        continueRegularLogin(formData);
      } else {
        alert('Error generating JWT Token after TOTP verification');
      }
    } else {
      alert('Invalid OTP. Please try again.');
    }
  } catch (error) {
    console.error('Error during OTP verification:', error);
  }
}


  export function checkEmail() {
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

export async function checkUsername() {
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
    if (response.ok) {
      const data = await response.json();
      if (data.exists) {
        // Username already exists
        alert('Username already exists');
      } else {
        // Username is available
        alert('Username is available');
      }
    } else {
      // Handle non-successful status codes
      alert('Failed to check username');
    }
  } catch (error) {
    // Handle any other errors
    console.error(error);
  }
}
  
