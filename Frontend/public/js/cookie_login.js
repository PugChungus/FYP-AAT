import { get_cookie } from "./cookie.js";

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
      const id = data['id_username']['id'];
      
      const formData = new FormData();
      formData.append('id', id)
  
      const jwtToken = await get_cookie()
  
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