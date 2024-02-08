async function validateThisTFA() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const tokenwithUserName = urlParams.get('token');

        const [ token, encodedUsername ] = tokenwithUserName.split('.')

        // Modify the URL without the token using history.replaceState
        const newURL = window.location.origin + window.location.pathname;
        history.replaceState({}, document.title, newURL);

        const response = await fetch(`http://localhost:5000/verify_disable_tfa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token, username: encodedUsername }),
        });
        const data = await response.json();

        console.log("Verification Result:", data);

        // Check if you have another appropriate container element to display messages
        const messageContainer = document.getElementById('disable-2fa-message')
        if (messageContainer) {
            // Clear existing content in the container
            messageContainer.innerHTML = '';

            // Create a new element with a message
            const messageElement = document.createElement('div');
            if (data.Validation === 'success') {
                messageElement.innerHTML =
                    '<p style="color: green;">Two-Factor Authentication has been disabled. Redirecting to the login page...</p>';
            } else {
                messageElement.innerHTML =
                    '<p style="color: red;">Either you did not make this request or your link has expired. Please repeat the process again. Redirecting you to the login page in 10 seconds...</p>';
            }

            // Append the new element to the message container
            messageContainer.appendChild(messageElement);

            // Set a timeout to redirect after 10 seconds
            setTimeout(function () {
                // Change 'your-redirect-page.html' to the actual page you want to redirect to
                window.location.href = '/';
            }, 10000);
        }
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

validateThisTFA();