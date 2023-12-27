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

  rotationButton.addEventListener('click', function() {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';
    cardDiv.innerHTML = `
    <div class="card-body">
      <h5 class="card-title">Key Rotation Warning</h5>
      <p class="card-text">This will destroy all your old public and private keys and create new ones. Old messages encrypted with your public key will not be retrievable. Do you wish to proceed?</p>
      <button type="button" class="btn btn-danger" id="denyRotation">Deny</button>
      <button type="button" class="btn btn-success" id="confirmRotation">Confirm</button>
    </div>`;

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

    const denyRotationButton = document.getElementById('denyRotation');
    denyRotationButton.addEventListener('click', function() {
      cardDiv.style.display = 'none';
    });

    const confirmRotationButton = document.getElementById('confirmRotation')
    confirmRotationButton.addEventListener('click', function() {
      //add your confirm idk what here trev
    })
  })

});



