import { get_cookie } from "./cookie.js";

document.addEventListener('DOMContentLoaded', async function() {
  const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
    method: 'POST'
  });

  const data1 = await newResponse.json(); // await here
  const id = data1['id_username']['id'];

  const formData = new FormData();
  formData.append('id', id);

  const response = await fetch('http://localhost:3000/get_account', {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  var pfpBuffer = data.tables[0].profile_picture
  if (pfpBuffer !== null) {
    var dataArray = pfpBuffer.data;
    var uint8Array = new Uint8Array(dataArray);
    var blob = new Blob([uint8Array]);
    var objectURL = URL.createObjectURL(blob);
  }

  const imgElement = document.getElementById('profile-picture');
  imgElement.src = objectURL;
});

function handleSignOut() {
fetch('http://localhost:3000/logout', {
    method: 'GET',
  })
  .then(response => {
    if (response.ok) {
      sessionStorage.clear();
      window.location.href = '/';
      clearInputBoxes();
    } else {
      console.log("Logout Success.");
    }
  })
  .catch(error => {
    console.error('Error during fetch:', error);
  });
}

function clearInputBoxes() {
  // Set placeholders for input boxes
  document.getElementById('email-field').placeholder = 'Email';
  document.getElementById('password-field').placeholder = 'Password';

  // Clear input values
  document.getElementById('email-field').value = '';
  document.getElementById('password-field').value = '';
}

const signOutIcon = document.getElementById('signOutIcon')

signOutIcon.addEventListener('click', function() {
  handleSignOut();
});

