import { keygen, exportPublicKey, exportPrivateKey } from "./rsa_keygen.js";
import { getCurrentTime, updateData } from "./IndexedDB.js";

async function rotateKeys() {
  const keypair = await keygen();
  const public_key = keypair.publicKey;
  const private_key = keypair.privateKey;

  const pem_public = await exportPublicKey(public_key);
  const jwk_private = await exportPrivateKey(private_key);

  const formData = new FormData();
  const email = get_email_via_id();
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
      name: 'private_key',
    };

    updateData(email, newData);
  }
}

function showKeyRotationWarning() {
  const cardDiv = document.createElement('div');
  cardDiv.className = 'card';
  cardDiv.innerHTML = `
    <div class="card-body">
      <h5 class="card-title">Key Rotation Warning</h5>
      <p class="card-text">This will destroy all your old public and private keys and create new ones. Old messages encrypted with your public key will not be retrievable. Do you wish to proceed?</p>
      <button type="button" class="btn btn-danger" id="denyRotation">Deny</button>
      <button type="button" class="btn btn-success" id="confirmRotation">Confirm</button>
    </div>`;

  // Append cardDiv to the document
  document.body.appendChild(cardDiv);

  // Retrieve the elements and add event listeners after appending to the DOM
  const denyRotationButton = document.getElementById('denyRotation');
  denyRotationButton.addEventListener('click', function () {
    cardDiv.style.display = 'none';
  });

  const confirmRotationButton = document.getElementById('confirmRotation');
  confirmRotationButton.addEventListener('click', async function () {
    // Call the rotateKeys function when the Confirm button is clicked
    await rotateKeys();

    // Hide the cardDiv after confirmation
    cardDiv.style.display = 'none';
  });

  // Style cardDiv
  cardDiv.style.position = 'fixed';
  cardDiv.style.top = '0';
  cardDiv.style.left = '50%';
  cardDiv.style.transform = 'translateX(-50%)';
  cardDiv.style.width = '300px';
  cardDiv.style.margin = '20px';
  cardDiv.style.border = '1px solid #ccc';
  cardDiv.style.borderRadius = '8px';
  cardDiv.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
}

export { showKeyRotationWarning };