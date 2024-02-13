import { keygen, exportPublicKey, exportPrivateKey } from "./RSA and IndexedDB/rsa_keygen.js";
import { openIndexDB } from "./RSA and IndexedDB/IndexedDB.js";

//NOTICE : using blur and alerts this way will cause infinite loop of alerts 
document.getElementById('username-field').addEventListener('blur', checkUsername);
document.getElementById('email-field').addEventListener('change', checkEmail);
document.getElementById('reg').addEventListener('click', register);


const emailRegex = /^[\w-]+(\.[\w-]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;
const passwordRegex = /[<>&'"\;`|]/
const specialcharregex = /[?!@#$%&]/;

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
    var emailbox = document.getElementById('email-field')
    var check =document.getElementById('check')
    var error = document.getElementById('error-circle')

    if (email.trim() !== "") {
        // Perform AJAX call only if email is not empty or whitespace
        $.ajax({
            type: "POST",
            url: "http://localhost:5000/check_email",  // Point to your Flask route
            data: { email: email },
            success: function(response) {
                if (response.status === "exists") {
                  emailbox.style.borderWidth = '1px'; // Set the border width to 1 pixel
                  emailbox.style.borderStyle = 'solid'; // Set the border style to solid
                  emailbox.style.borderColor = 'green';
                  check.style.display = 'block'
                  check.style.color = 'green'
                  error.style.display = 'none'
                  console.log("Correct")
                } else {
                  emailbox.style.borderWidth = '1px'; // Set the border width to 1 pixel
                  emailbox.style.borderStyle = 'solid'; // Set the border style to solid
                  emailbox.style.borderColor = 'red'; 
                  error.style.display = 'block'
                  error.style.color = 'red'
                  check.style.display = 'none'                

                  console.log("Wrong")
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
      alert("Forbidden Characters Detected in password field")
      return;
    }

    if (password.length < minLength) {
      alert("Minimum length is 8 characters")
        return;
    }

    // Check if password contains at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      alert("Password must contain at least one Uppercase letter")
      return;
    }

    if (!/[a-z]/.test(password)) {
      alert("Password must contain at least one Lowercase letter")
      return;
    }

    if (!/[0-9]/.test(password)) {
      alert("Password must contain at least one Digit")
      return;
    }

    if (!specialcharregex.test(password)) {
      alert("Password must contain at least one special Character")
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('username', username);
      formData.append('password', password);
      formData.append('confirmPassword', confirmPassword);
      console.log("FormData", formData)

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
          verificationFormData.append('username', username)
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
      } else {
        alert("Registeration Failed.")
      }
    } catch (error) {
      console.error('Error during fetch:', error);
    }
}

function checkPasswordStrength(password) {
  const strengthCriteria = [
      { label: "Minimum 8 characters", isValid: password.length >= 8 },
      { label: "Contains at least one uppercase letter", isValid: /[A-Z]/.test(password) },
      { label: "Contains at least one lowercase letter", isValid: /[a-z]/.test(password) },
      { label: "Contains at least one digit", isValid: /\d/.test(password) },
      { label: "Contains at least one special character", isValid: /[^a-zA-Z0-9]/.test(password) }
  ];

  return strengthCriteria;
}

// Function to update password strength dropdown
function updatePasswordStrength() {
  var password = document.getElementById("password-field").value;
  var strengthCriteria = checkPasswordStrength(password);

  var passwordStrengthDiv = document.getElementById("password-strength");
  var passwordStrengthList = document.getElementById("password-strength-list");
  
  // Hide the password strength div if password field is empty
  if (password.trim() === "") {
      passwordStrengthDiv.style.display = "none";
      return;
  }
  
  passwordStrengthDiv.style.display = "block"; // Show the password strength div
  
  passwordStrengthList.innerHTML = ""; // Clear previous list items

  strengthCriteria.forEach(criteria => {
      var listItem = document.createElement("li");
      listItem.textContent = criteria.label + ": " + (criteria.isValid ? "✓" : "✗");
      listItem.style.color = criteria.isValid ? "green" : "red";
      passwordStrengthList.appendChild(listItem);
  });
}

// Listen for input events on the password field
document.getElementById("password-field").addEventListener("input", updatePasswordStrength);
