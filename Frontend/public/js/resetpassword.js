document.addEventListener('DOMContentLoaded', function () {
    // This code will run after the DOM has fully loaded

    document.getElementById('resetPasswordConfirm').addEventListener('click', function(event) {
        alert("function is called");
        event.preventDefault();
        sessionStorage.setItem('formflag', 'true');
        resetPassword();
        return false;
    });
});

export async function resetPassword() {
    try {
        const newPassword = document.getElementById('new-password-field').value;
        const confirmPassword = document.getElementById('confirm-password-field').value;

        if (newPassword !== confirmPassword) {
            alert('New Password and Confirm Password do not match. Please check again.');
            return; // Stop execution if passwords do not match
        }

        const hashresponse = await fetch(`http://localhost:3000/hashpassword`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newPassword: newPassword }),
        });
        const hashdata = await hashresponse.json();
        const encodedPassword = hashdata.encodedPassword;


        const response = await fetch(`http://localhost:5000/a_reset_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newPassword: encodedPassword})
        });

        const data = await response.json();

        console.log("WOAHHH:", data['message']);
        
        if (data['message'] ===  "Password updated successfully") {
            alert("Password Changed Succesfully. Redirecting to login page to login")
            window.location.href = '/'
        }
        else {
            alert("error")
        }

    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred: " + error.message);
    }
}


