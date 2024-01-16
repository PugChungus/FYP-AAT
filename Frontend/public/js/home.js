document.addEventListener('DOMContentLoaded', async function() {
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
  var pfpBuffer = data["tables"][0]["profile_picture"];
  if (pfpBuffer !== null) {
    var dataArray = pfpBuffer.data;
    var uint8Array = new Uint8Array(dataArray);
    var blob = new Blob([uint8Array]);
    var objectURL = URL.createObjectURL(blob);
  }

  const imgElement = document.getElementById('profile-picture');
  imgElement.src = objectURL;
});
  