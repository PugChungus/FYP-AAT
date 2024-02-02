document.getElementById('resetPasswordBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevents the form from submitting traditionally
    forgetPassword();
});

async function forgetPassword() {
    var email = document.getElementById('email-field').value; // Extract the value of the email field

    // Email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }

    try {
        // Check if the email exists
        const checkResponse = await fetch('http://localhost:3000/doesEmailExist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });

        if (checkResponse.ok) {
            const checkData = await checkResponse.json();

            if (checkData.exists) {
                // If email exists, proceed to send the forget password email
                const response = await fetch('http://localhost:5000/email_forgetPassword', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("Checking", data);
                    alert('Email sent successfully');
                } else {
                    console.log("Error");
                    alert('Failed to send email');
                }
            } else {
                // If email does not exist, show an alert
                alert('Account does not exist');
            }
        } else {
            console.log("Error");
            alert('Failed to check email existence');
        }
    } catch (error) {
        console.log("Error:", error);
        alert('Error occurred while processing the request');
    }
}
