async function get_cookie() {
    const cookie_response = await fetch('http://localhost:3000/api/getCookie', {
        method: 'GET',
    });

    const cookie_data = await cookie_response.json()
    const token = cookie_data.token.jwtToken
    return token
}