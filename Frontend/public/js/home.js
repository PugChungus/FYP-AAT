async function get_cookie() {
  const cookie_response = await fetch('http://localhost:3000/api/getCookie', {
      method: 'GET',
  });

  const cookie_data = await cookie_response.json()
  const token = cookie_data.token.jwtToken
  return token
}

let jwtToken = await get_cookie()

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

async function cookie_login() {

  const valid_token = await fetch('http://localhost:3000/checkTokenValidity', {
    method: 'GET',
  });

  const isValid = await valid_token.json();

  if (isValid['isValid'] == true) {
    
    const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
      method: 'POST'
    });
  
    const data = await newResponse.json(); // await here
    const email_cookie = data['email_username']['email'];
    
    const formData = new FormData();
    formData.append('email', email_cookie)

    const response = await fetch('http://localhost:5000/create_user_dict', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer: ${jwtToken}`
      },
      body: formData,
    });
  }
  else {
    window.location.href = 'login'
  }
}

cookie_login()
  