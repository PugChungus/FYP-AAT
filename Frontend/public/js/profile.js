function getCurrentTime() {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${day}/${month}/${year} ${hours}:${minutes}`;
  console.log(currentTime);
  return currentTime;
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

async function get_cookie() {
  const cookie_response = await fetch('http://localhost:3000/api/getCookie', {
      method: 'GET',
  });

  const cookie_data = await cookie_response.json()
  const token = cookie_data.token.jwtToken
  return token
}

let jwtToken = await get_cookie()

async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey("spki", key);
  const exportedAsString = ab2str(exported);
  const exportedAsBase64 = window.btoa(exportedAsString);
  const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
  return pemExported;
}

async function exportPrivateKey(key) {
  const exported = await window.crypto.subtle.exportKey("jwk", key);
  const jwkString = JSON.stringify(exported, null, '  ');
  return jwkString;
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
    return keyPair;
  } catch (error) {
    console.error("Error generating key pair:", error);
  }
}

async function updateData(user_email, newData) {
  const DBOpenRequest = window.indexedDB.open(`${user_email}_db`, 4);
  DBOpenRequest.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction([`${user_email}__Object_Store`], "readwrite");
    const objectStore = transaction.objectStore(`${user_email}__Object_Store`);
    const request = objectStore.put(newData);
    request.onsuccess = function (event) {
      console.log('Data updated successfully');
    };
    request.onerror = function (event) {
      console.error('Error updating data: ', event.target.error);
    };
  };
}

async function verifyOTP(email, otp) {
  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('otp', otp);

    const response = await fetch('http://localhost:5000/verify_otp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer: ${jwtToken}`
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.is_valid === 1;
    } else {
      console.error('Error verifying OTP:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error making request:', error);
    return false;
  }
}


document.addEventListener('DOMContentLoaded', async function () {
  const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
    method: 'POST'
  });

  const data1 = await newResponse.json(); // await here
  const email = data1['email_username']['email'];

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

  const userInfoElement = document.getElementById('user-info');
  userInfoElement.innerHTML = `
    <h2>Welcome, ${username}</h2>
    <p>Email: ${email}</p>
    <p>Username: ${username}</p>
    
    <p><a href="/edit-profile">Edit Profile</a></p>
    <div id="2fa-section">
      <label class="switch">
        <input type="checkbox" id="2faToggle">
        <span class="slider"></span>
      </label>
      <span>Enable Two-Factor Authentication</span>
    </div>
    <button type="button" class="btn btn-danger" id="rotationButton">Key Rotation</button>
  `;

  const imgElement = document.getElementById('profile-picture');
  imgElement.src = objectURL;


  const enable2FASwitch = document.getElementById('2faToggle');

  async function check2FAStatus() {
    try {
      const formData = new FormData();
      formData.append('email', email)

      const response = await fetch('http://localhost:3000/get2faStatus', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const data = await response.json();
        const is2FAEnabled = data.is_2fa_enabled === 1;

      // Set the switch based on the correct 2FA status
        enable2FASwitch.checked = is2FAEnabled;
      } else {
        console.error('Error getting 2FA status:', response.statusText);
      }
    } catch (error) {
      console.error('Error making request: ', error);
    }
  }
  enable2FASwitch.addEventListener('click',  async function () {

    const currentState = enable2FASwitch.checked;

    if (currentState) {
      const confirmation = window.confirm(
        'Before continuing, please make sure that your phone number, email address, ' +
        'and mailing/physical address under "Account Details" are true and correct. ' +
        'Valid information is required for account recovery should you become locked out.' +
        ' Do you wish to proceed?'
      );
      if (!confirmation) {
        enable2FASwitch.checked = false;
        return
      }

      try {
        const formData = new FormData();
        formData.append('email', email)
        const cookie = await get_cookie()
        const response = await fetch('http://localhost:3000/enable2fa', {
          method: 'POST',
          body: formData,
          headers: {'Authorization':  `Bearer: ${cookie}`}
        });

        if (response.ok){
          console.log('2FA Enabled Succesfully');
          const qrResponse = await fetch('http://localhost:5000/generate_2fa_qr_code', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer: ${jwtToken}`
            },
            body: formData,
          });

        if (qrResponse.ok) {
          const qrData = await qrResponse.json();
          console.log("Received QR Data:", qrData)
          const qrCodeUrl = qrData.qr_code_url;
          const otp = qrData.otp !== undefined ? qrData.otp : 'N/A';

          console.log("QR Code URL: ", qrCodeUrl)
          console.log("OTP: ", otp)

          // Create a new card div for displaying QR Code
          const qrCodeCardDiv = document.createElement('div');
          qrCodeCardDiv.className = 'card2fa';
          qrCodeCardDiv.innerHTML = `
          <div class="card-header">
            <button type="button" class="close" aria-label="Close" id="closeCard">&times;</button>
          </div>
          <div class="card-body">
            <h5 class="card-title">Two-Factor Authentication Setup</h5>
            <p class="card-text">Scan the QR code using the Google Authenticator app.</p>
            <div id="qrcode"></div>
            <label for="otpInput">Enter OTP:</label>
            <input type="text" autocomplete="off" id="otpInput" name="otpInput">
            <button type="button" class="btn btn-secondary" id="cancelButton">Cancel</button>
            <button type="button" class="btn btn-primary" id="submitOTP">Submit OTP</button>
          </div>`;

            const qrCodeCanvas = qrCodeCardDiv.querySelector('#qrcode');
            new QRCode(qrCodeCanvas, {
              text: qrCodeUrl,
              width: 128,
              height: 128,
            });

            const closeCardButton = qrCodeCardDiv.querySelector('#closeCard');
            closeCardButton.addEventListener('click', function() {
              qrCodeCardDiv.style.display = 'none';
              enable2FASwitch.checked = false
            })

            const cancelButton = qrCodeCardDiv.querySelector('#cancelButton');
            cancelButton.addEventListener('click', function() {
              qrCodeCardDiv.style.display = 'none';
              enable2FASwitch.checked = false;
            })

            const submitOTPButton = qrCodeCardDiv.querySelector('#submitOTP')
            submitOTPButton.addEventListener('click', async function() {
              const enteredOTP = qrCodeCardDiv.querySelector('#otpInput').value;

              if (/^\d{6}$/.test(enteredOTP)) {
                console.log('Submitted OTP:', enteredOTP);
                const isValidOTP = await verifyOTP(email, enteredOTP);

                if (isValidOTP) {
                  console.log('OTP is valid. Proceed with enabling 2FA.');
                qrCodeCardDiv.style.display = 'none'

                } else {
                  alert('Invalid OTP. Please enter a valid 6-digit numeric OTP.');
                }
              } else {
                alert('Invalid OTP. Please enter a valid 6-digit numeric OTP.')
              }
            });
            
            // Append the QR Code card div to the body
            document.body.appendChild(qrCodeCardDiv);
        } else {
          console.error('Error generating QR code:', qrResponse.statusText);
        }
        } else {
          console.error('Error enabling 2FA:', response.statusText);
          enable2FASwitch.checked = false;
        }
      } catch (error) {
          console.error('Error Making request: ', error)
          enable2FASwitch.checked = false
      }
    } else {
      try {
        const formData = new FormData();
        formData.append('email', email);

        const response = await fetch('http://localhost:3000/disable2fa', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          console.log('2FA Disabled Succesfully')
        } else {
          console.error('Error disabling 2FA:', response.statusText);
          enable2FASwitch.checked = true;
        }
      } catch (error) {
        console.error('Error making request:', error)
        enable2FASwitch.checked = true;
      }
    }

  });

  check2FAStatus();

  const rotationButton = document.getElementById('rotationButton');
  rotationButton.addEventListener('click', function () {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerHTML = `
      <div class="card-body">
        <h5 class="card-title">Key Rotation Warning</h5>
        <p class="card-text">This will destroy all your old public and private keys and create new ones. Old messages encrypted with your public key will not be retrievable. Do you wish to proceed?</p>
        <button type="button" class="btn btn-danger" id="denyRotation">Deny</button>
        <button type="button" class="btn btn-success" id="confirmRotation">Confirm</button>
      </div>`;

    const denyRotationButton = document.getElementById('denyRotation');
    denyRotationButton.addEventListener('click', function () {
      cardDiv.style.display = 'none';
    });

    const confirmRotationButton = document.getElementById('confirmRotation')
    confirmRotationButton.addEventListener('click', async function () {
      keypair = await keygen();
      public_key = keypair.publicKey;
      private_key = keypair.privateKey;

      pem_public = await exportPublicKey(public_key);
      jwk_private = await exportPrivateKey(private_key);

      const formData = new FormData();
      formData.append('email', email);
      formData.append('public_key', pem_public);

      const response = await fetch('http://localhost:3000/update_pubkey', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newData = {
          privateKey: jwk_private,
          email: email,
          dateCreated: getCurrentTime(),
          name: 'private_key'
        };

        updateData(email, newData);
      }
    });

    cardDiv.style.position = 'fixed';
    cardDiv.style.top = '0';
    cardDiv.style.left = '50%';
    cardDiv.style.transform = 'translateX(-50%)';
    cardDiv.style.width = '300px';
    cardDiv.style.margin = '20px';
    cardDiv.style.border = '1px solid #ccc';
    cardDiv.style.borderRadius = '8px';
    cardDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    document.body.appendChild(cardDiv);
  });
});

async function get_cookie() {
  const cookie_response = await fetch('http://localhost:3000/api/getCookie', {
      method: 'GET',
  });

  const cookie_data = await cookie_response.json()
  const token = cookie_data.token.jwtToken
  return token
}
