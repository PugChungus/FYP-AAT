import { get_cookie } from "./cookie.js";
import { get_email_via_id } from "./profile.js"; 

const passwordRegex = /[<>&'"\$;`|]/;

export async function changePassword(event) {
    event.preventDefault();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const minLength = 8; 

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert("All fields must be filled");
        return;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
        alert("Passwords don't match");
        return;
    }

    if (passwordRegex.test(newPassword)) {
        alert("Forbidden Characters Detected in password field");
        return;
    }

    if (newPassword.length < minLength) {
        alert("Minimum length is 8 characters");
        return;
    }

    try {
        const jwtToken = await get_cookie();
        const email = await get_email_via_id();
        const formData = new FormData();
        formData.append('email', email)
        formData.append('currentPassword', currentPassword);

        const response = await fetch('http://localhost:3000/checkpassword', {
            method: 'POST',
            headers : {
                'Authorization': `Bearer: ${jwtToken}`
            },
            body: formData,
        });

        if (response.ok) {
            const formData2 = new FormData();
            formData2.append('email', email)
            formData2.append('newPassword', newPassword)
            const response2 = await fetch('http://localhost:3000/changepassword', {
                method: 'POST',
                headers : {
                    'Authorization': `Bearer: ${jwtToken}`
                },
                body: formData2,
            });

            if (response2.ok) {
                alert('Password Successfully Changed')
                window.location.href = '/'
            } else {
                alert('Something went wrong')
            }
        }
    } catch (error) {
        console.error("Error:", error);
        // Handle error appropriately
    }
}

document.getElementById('submitChange').addEventListener('click', changePassword);
