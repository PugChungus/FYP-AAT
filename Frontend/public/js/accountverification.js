// Get the token from the URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

// Function to send a verification request to the server
async function verifyAccount() {
    try {
        const response = await fetch(`http://localhost:5000/verify_account?token=${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        console.log("WOAHHH", data)

        // Handle the response from the server
        if (data.activation_status === 'success') {
            // Account activated successfully
            // You can redirect the user or show a success message
            console.log('Account activated successfully!');
        } else {
            // Account activation failed
            // You can show an error message or redirect to an error page
            console.error('Account activation failed.');
        }
    } catch (error) {
        console.error('Error during account verification:', error);
    }
}

// Call the verification function when the page loads
verifyAccount();
