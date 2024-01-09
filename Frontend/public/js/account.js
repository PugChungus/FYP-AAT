let db;

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
            openIndexDB(jwk_private, email);

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
        
        // document.cookie = `jwtToken=${data.JWTtoken}; SameSite=Strict; Secure`;
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
          // document.cookie = `jwtToken=${token}; SameSite=Strict; Secure`;

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
