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

    if (!/[A-Z]/.test(newPassword)) {
        alert("Password must contain at least one Uppercase letter")
        return;
      }

      if (!/[a-z]/.test(newPassword)) {
        alert("Password must contain at least one Lowercase letter")
        return;
      }

      if (!/[0-9]/.test(newPassword)) {
        alert("Password must contain at least one digit")
        return;
      }

    if (!/[^a-zA-Z0-9]/.test(password)) {
        alert("Password must contain at least one special Character")
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

document.addEventListener("DOMContentLoaded", function() {
    var toggleIcons = document.querySelectorAll(".toggle-password");
    toggleIcons.forEach(function(icon) {
        icon.addEventListener("click", function() {
            var passwordField = this.previousElementSibling;
            if (passwordField.type === "password") {
                passwordField.type = "text";
                this.classList.remove("fa-eye-slash");
                this.classList.add("fa-eye");
            } else {
                passwordField.type = "password";
                this.classList.remove("fa-eye");
                this.classList.add("fa-eye-slash");
            }
        });

        // Update icon based on initial state
        var passwordField = icon.previousElementSibling;
        if (passwordField.type === "password") {
            icon.classList.add("fa-eye-slash");
        } else {
            icon.classList.add("fa-eye");
        }

        var backButton = document.getElementById("backButton");
        backButton.addEventListener("click", function() {
            window.location.href = "/profile"; // Redirect to the /profile page
        });
    });
});


function checkPasswordStrength(password) {
    const strengthCriteria = [
        { label: "Minimum 8 characters", isValid: password.length >= 8 },
        { label: "Contains at least one uppercase letter", isValid: /[A-Z]/.test(password) },
        { label: "Contains at least one lowercase letter", isValid: /[a-z]/.test(password) },
        { label: "Contains at least one digit", isValid: /\d/.test(password) },
        { label: "Contains at least one special character", isValid: /[^a-zA-Z0-9]/.test(password) }
    ];
  
    return strengthCriteria;
  }
  
  // Function to update password strength dropdown
  function updatePasswordStrength() {
    var password = document.getElementById("new-password").value;
    var strengthCriteria = checkPasswordStrength(password);
  
    var passwordStrengthDiv = document.getElementById("password-strength");
    var passwordStrengthList = document.getElementById("password-strength-list");
    
    // Hide the password strength div if password field is empty
    if (password.trim() === "") {
        passwordStrengthDiv.style.display = "none";
        return;
    }
    
    passwordStrengthDiv.style.display = "block"; // Show the password strength div
    
    passwordStrengthList.innerHTML = ""; // Clear previous list items
  
    strengthCriteria.forEach(criteria => {
        var listItem = document.createElement("li");
        listItem.textContent = criteria.label + ": " + (criteria.isValid ? "✓" : "✗");
        listItem.style.color = criteria.isValid ? "green" : "red";
        passwordStrengthList.appendChild(listItem);
    });
  }
  
  // Listen for input events on the password field
document.getElementById("new-password").addEventListener("input", updatePasswordStrength);

document.getElementById('submitChange').addEventListener('click', changePassword);
