async function validateThisFP() {
    try {
        // Check if the form has already been submitted
        const formFlag = sessionStorage.getItem('formflag');
        if (formFlag === 'true') {
            return; // Do nothing if the form has already been submitted
        }

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const newURL = window.location.origin + window.location.pathname;
        history.replaceState({}, document.title, newURL);

        const response = await fetch(`http://localhost:5000/verify_reset_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token }),
        });
        const data = await response.json();


        console.log("WOAHHH:", data);
        if (data.Validation === 'success') {
            sessionStorage.setItem('formflag', 'true')
        } else {
            const loginForm = document.querySelector('.login-wrap');
            if (loginForm) {
                loginForm.style.display = 'none';

                // Create a new element with a message
                const messageElement = document.createElement('div');
                messageElement.innerHTML =
                    '<p>Either you did not make this request or your link has expired. Please repeat the process again. Redirecting you to login page in 10 seconds</p>';

                // Append the new element to the document body
                document.body.appendChild(messageElement);

                // Set a timeout to redirect after 10 seconds
                setTimeout(function () {
                    // Change 'your-redirect-page.html' to the actual page you want to redirect to
                    window.location.href = '/';
                }, 10000);
            }
        }
    } catch (error) {
        console.error('Error during verification:', error);
    }
}

validateThisFP();
