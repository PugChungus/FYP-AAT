import { get_cookie } from "./cookie.js";
import { deleteIndexDB } from "./RSA and IndexedDB/IndexedDB.js";
import * as QRCode from 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/+esm'
import { showKeyRotationWarning } from '../js/RSA and IndexedDB/key_regen.js';

let id

export async function get_email_via_id() {
  const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
    method: 'POST'
  });

  const data = await newResponse.json(); // await here
  const id = data['id_username']['id'];

  const formData = new FormData();
  formData.append('id', id);
  const jwtToken = await get_cookie()

  const response = await fetch('http://localhost:3000/get_account', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer: ${jwtToken}`
    },
    body: formData,
  });

  const data2 = await response.json();
  var email_addr = data2["tables"][0]["email_address"];

  return email_addr
}

async function verifyOTP(email, otp, secret) {
  try {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('otp', otp);
    formData.append('secret', secret)
    console.log("im in your pants:", secret)
    const jwtToken = await get_cookie()
    console.log("ahdjoasd:", formData)

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
  id = data1['id_username']['id'];
  const jwtToken = await get_cookie()

  const formData = new FormData();
  formData.append('id', id);
  const response = await fetch('http://localhost:3000/get_account', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer: ${jwtToken}`
    },
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
  if (userInfoElement){
  userInfoElement.innerHTML = `
    <h2>Welcome, ${username}</h2>
    <p>Username: ${username}</p>
    
    <p><a href="/edit-profile">Edit Profile</a></p>
    <div id="2fa-section">
      <label class="switch">
        <input type="checkbox" id="2faToggle">
        <span class="slider"></span>
      </label>
      <span>Enable Two-Factor Authentication</span>
    </div>
    
  `;}

  const imgElement = document.getElementById('profile-picture');
  imgElement.src = objectURL;

  const enable2FASwitch = document.getElementById('2faToggle');

  async function check2FAStatus() {
    try {
      const formData = new FormData();
      const email = await get_email_via_id()
      console.log("SENDING EMAIL", email)
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
  if (enable2FASwitch) {
   
  enable2FASwitch.addEventListener('click', async function () {

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
            return;
        }

        try {
            const formData = new FormData();
            
            let email = await get_email_via_id()
            formData.append('email', email);
            const cookie = await get_cookie();

            const jwtToken = await get_cookie();
            console.log("cookie:",cookie)
            console.log("jwttoken:", jwtToken)

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
                        <canvas id="qrcode"></canvas>
                        <label for="otpInput">Enter OTP:</label>
                        <input type="text" autocomplete="off" id="otpInput" name="otpInput">
                        <button type="button" class="btn btn-secondary" id="cancelButton">Cancel</button>
                        <button type="button" class="btn btn-primary" id="submitOTP">Submit OTP</button>
                    </div>`;

                const qrCodeCanvas = qrCodeCardDiv.querySelector('#qrcode');
                try {
                  await QRCode.toCanvas(qrCodeCanvas, qrCodeUrl, {
                      //text: qrCodeUrl,
                      width: 128,
                      height: 128,
                  });
              } catch (error) {
                  console.error('Error generating QR code:', error);
              }

                const closeCardButton = qrCodeCardDiv.querySelector('#closeCard');
                closeCardButton.addEventListener('click', function () {
                    qrCodeCardDiv.style.display = 'none';
                    enable2FASwitch.checked = false;
                });

                const cancelButton = qrCodeCardDiv.querySelector('#cancelButton');
                cancelButton.addEventListener('click', function () {
                    qrCodeCardDiv.style.display = 'none';
                    enable2FASwitch.checked = false;
                });

                const submitOTPButton = qrCodeCardDiv.querySelector('#submitOTP');
                submitOTPButton.addEventListener('click', async function () {
                    const enteredOTP = qrCodeCardDiv.querySelector('#otpInput').value;

                    if (/^\d{6}$/.test(enteredOTP)) {
                        const email = await get_email_via_id()
                        console.log("line 209 email:", email)
                        console.log('Submitted OTP:', enteredOTP);
                        console.log('Secret Key', qrData.secret)
                        let secret = qrData.secret
                        const isValidOTP = await verifyOTP(email, enteredOTP, secret);

                        if (isValidOTP) {
                            console.log('OTP is valid. Proceed with enabling 2FA.');

                            try {
                                // Move the enable2faRoute request here
                                const enable2faResponse = await fetch('http://localhost:3000/enable2fa', {
                                    method: 'POST',
                                    body: formData,
                                    headers: {
                                        'authorization': `Bearer: ${cookie}`
                                    },
                                });

                                if (enable2faResponse.ok) {
                                    console.log('enable2faRoute Successfully Called');
                                } else {
                                    console.error('Error calling enable2faRoute:', enable2faResponse.statusText);
                                }
                            } catch (error) {
                                console.error('Error calling enable2faRoute:', error);
                            }

                            qrCodeCardDiv.style.display = 'none';
                        } else {
                            alert('Invalid OTP. Please enter a valid 6-digit numeric OTP.');
                        }
                    } else {
                        alert('Invalid OTP. Please enter a valid 6-digit numeric OTP.');
                    }
                });

                // Append the QR Code card div to the body
                document.body.appendChild(qrCodeCardDiv);
            } else {
                console.error('Error generating QR code:', qrResponse.statusText);
            }
        } catch (error) {
            console.error('Error Making request: ', error);
            enable2FASwitch.checked = false;
        }
    } else {
        try {
            const formData = new FormData();
            formData.append('id', id);
            const jwtToken = await get_cookie()

            const response = await fetch('http://localhost:3000/disable2fa', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${jwtToken}`,
                  },
                body: formData,
            });

            if (response.ok) {
                console.log('2FA Disabled Successfully');
            } else {
                console.error('Error disabling 2FA:', response.statusText);
                enable2FASwitch.checked = true;
            }
        } catch (error) {
            console.error('Error making request:', error);
            enable2FASwitch.checked = true;
        }
    }
});
}
  check2FAStatus();
});

export async function deleteAccount() {
  console.log("CLICKING ON DELETE BUTTON")
  // Show a prompt to the user
  const confirmation = window.prompt('To delete your account, type "DELETE" and click OK:');

  if (confirmation !== 'DELETE') {
    // User did not confirm, you might want to show a message or take other actions
    window.alert('Account deletion cancelled.');
    return;
  }

  try {
    const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
      method: 'POST'
    });
  
    const data = await newResponse.json(); // await here
    const id = data['id_username']['id'];
    const email = await get_email_via_id()
    const jwtToken = await get_cookie();

    const formData = new FormData();
    formData.append('id', id)
    console.log('Profile Delete Token:', jwtToken)

    const response1 = await fetch('http://localhost:3000/blacklist_token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer: ${jwtToken}`
      },
      body: formData,
    });

    if (response1.status === 401){ 
      window.alert('Account deletion failed.');
      return
    }

    const response2v = await fetch(`http://localhost:5000/email_deletea`, {
      method: 'POST',
      headers : {
        'Content-Type' : 'application/json',
      },
      body : JSON.stringify({ email: email})
    })

    const isEmailSent = await response2v.json()
  
    if (isEmailSent.message === 'Email sent successfully') {
      alert('An Email has been sent to delete your account. Account will not be deleted until link in email is opened. ')
    }else {
      window.alert('Account deletion failed.');
    }

  } catch (error) {
    // Handle errors
    console.error('Error deleting account:', error);
    window.alert('Account deletion failed.');
  }

}

const rotationButton = document.getElementById('rotationButton');
if (rotationButton) {
    rotationButton.addEventListener('click', function(event) {
        event.preventDefault();
        showKeyRotationWarning();
        return false;
    });
}
const deletebutt = document.getElementById('deleteButton');
if (deletebutt){
deletebutt.addEventListener('click', function(event) {
event.preventDefault();
deleteAccount();
return false;
});
}