// activation.js

// Function to send a verification request to the server
async function verifyAccount() {
    try {
        // Get the token from the URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');

        // Modify the URL without the token using history.replaceState
        const newURL = window.location.origin + window.location.pathname;
        history.replaceState({}, document.title, newURL);

        const response = await fetch(`http://localhost:5000/verify_account`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: token })  // Send the token as a JSON object
        });

        const data = await response.json();

        console.log("WOAHHH", data);

        // Handle the response from the server
        if (data.activation_status === 'success') {
            // Account activated successfully
            // You can redirect the user or show a success message
            console.log('Account activated successfully!');
            displayActivationMessage('Account Activated Successfully!', 'Your account has been successfully activated.');
        } else {
            // Account activation failed
            // You can show an error message or redirect to an error page
            console.error('Account activation failed.');
            displayActivationMessage('Account Activation Failed!', 'Sorry, there was an issue activating your account.');
        }
    } catch (error) {
        console.error('Error during account verification:', error);
    }
}

// Function to display activation message dynamically
function displayActivationMessage(title, message) {
    document.getElementById('activation-title').innerText = title;
    document.getElementById('activation-message').innerText = message;
}

// Call the verification function when the page loads
verifyAccount();
