let id;

async function get_cookie() {
    const cookie_response = await fetch('http://localhost:3000/api/getCookie', {
        method: 'GET',
    });

    const cookie_data = await cookie_response.json()
    const token = cookie_data.token.jwtToken
    return token
}

document.addEventListener('DOMContentLoaded', async function() {
    const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
        method: 'POST'
    });
    
    const data_1 = await newResponse.json(); // await here
    id = data_1['id_username']['id'];

    const formData = new FormData();
    formData.append('id', id);
  
    const response = await fetch('http://localhost:3000/get_account', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    var username = data["tables"][0]["username"]

    document.getElementById('pfp').innerHTML = `
    <label for="profile-picture">Change Profile Picture:</label>
    <input type="file" id="profile-picture" name="profile-picture" accept="image/*">
    `;
    
    document.getElementById('username-info').innerHTML = `
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" value="${username}" required>
    `;
  });

document.getElementById('profileForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const formData = new FormData();
    const name = document.getElementById('name').value;
    const fileInput = document.getElementById('profile-picture');

    formData.append('name', name);
    formData.append('id', id);
    
    if (fileInput.files.length > 0) {
        formData.append('profile-picture', fileInput.files[0]);
    }

    const jwtToken = get_cookie()

    // Send data to the /upload route using Fetch
    fetch('http://localhost:5000/upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer: ${jwtToken}`
        },
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if ('error' in result) {
            alert(result.error)
            console.error('Error:', result.error);
        } else {
            console.log('Success:', result.message);
            window.location.href = 'http://localhost:3000/profile'
        }
    })
    .catch(error => console.error('Error:', error));
});