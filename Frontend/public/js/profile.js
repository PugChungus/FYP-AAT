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

async function updateData(user_email, newData) {
  // Open a new transaction with readwrite access
  const transaction = db.transaction([`${user_email}__Object_Store`], 'readwrite');

  // Access the object store
  const objectStore = transaction.objectStore(`${user_email}__Object_Store`);

  // Perform the update operation
  const request = objectStore.put(newData);

  // Handle the success or error of the update operation
  request.onsuccess = function (event) {
    console.log('Data updated successfully');
  };

  request.onerror = function (event) {
    console.error('Error updating data: ', event.target.error);
  };
}

document.addEventListener('DOMContentLoaded', async function() {
  const email = sessionStorage.getItem('email');

  const formData = new FormData();
  formData.append('email', email);

  const response = await fetch('http://localhost:3000/get_account', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  var username = data["tables"][0]["username"];
  var pfpBuffer = data["tables"][0]["profile_picture"];
  if (pfpBuffer !== null) {
    var dataArray = pfpBuffer.data;
    var uint8Array = new Uint8Array(dataArray);
    var blob = new Blob([uint8Array]);
    var objectURL = URL.createObjectURL(blob);
  }

  // Wait for the object URL to load before setting it as the image source
  const userInfoElement = document.getElementById('user-info');
  userInfoElement.innerHTML = `
    <h2>Welcome, ${username}</h2>
    <p>Email: ${email}</p>
    <p>Username: ${username}</p>
    
    <p><a href="/pages/edit-profile.html">Edit Profile</a></p>
    <button type="button" class="btn btn-danger" id="rotationButton">Key Rotation</button>
  `;

  const imgElement = document.getElementById('profile-picture');
  imgElement.src = objectURL;

  const rotationButton = document.getElementById('rotationButton');

  // Add a click event listener to the button
  rotationButton.addEventListener('click', async function() {
    // Your code to handle the button click goes here
    alert("This will destroy all your old public and private keys and create new one. Old messages encrypted with you public key will not be retrievable. Do you wish to Proceed?");

    keypair = await keygen();
    public_key = keypair.publicKey
    private_key = keypair.privateKey

    pem_public = await exportPublicKey(public_key)
    jwk_private = await exportPrivateKey(private_key)

    const formData = new FormData();
    formData.append('email', email);
    formData.append('public_key', pem_public);

    const response = await fetch('http://localhost:3000/update_pubkey', {
      method: 'POST',
      body: formData,
    });

    if (response.ok){
      const newData = {
        privateKey: jwk_private,
        email: email,
        dateCreated: getCurrentTime(),
        name: 'private_key'
      };

      // Call the updateData function to update the data in the object store
      updateData(email, newData);
    }
    
  });

});

