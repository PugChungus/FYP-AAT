// cookie.js
export async function get_cookie() {
    try {
      const cookie_response = await fetch('http://localhost:3000/api/getCookie', {
        method: 'GET',
      });
  
      const cookie_data = await cookie_response.json();
      const token = cookie_data.token.jwtToken;
      return token;
    } catch (error) {
      console.error('Error in get_cookie:', error);
      throw error;
    }
  }
  