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
  rotationButton.addEventListener('click', function() {
    // Your code to handle the button click goes here
    alert("This will destroy all your old public and private keys and create new one. Old messages encrypted with you public key will not be retrievable. Do you wish to Proceed?"); // Example: Display an alert
  });

});



