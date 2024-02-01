document.getElementById('resetPasswordBtn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevents the form from submitting traditionally
    forgetPassword();
});

async function forgetPassword() {
    var email = document.getElementById('email-field').value; // Extract the value of the email field
    try {
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
    } catch (error) {
        console.log("Error:", error);
        alert('Error occurred while processing the request');
    }
}
