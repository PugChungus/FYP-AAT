document.addEventListener('DOMContentLoaded', function () {
    // This code will run after the DOM has fully loaded

    document.getElementById('resetPasswordConfirm').addEventListener('click', function(event) {
        event.preventDefault();
        resetPassword();
        return false;
    });
});

const passwordRegex = /[<>&'"\;`|]/

export async function resetPassword() {
    try {
        const newPassword = document.getElementById('new-password-field').value;
        const confirmPassword = document.getElementById('confirm-password-field').value;
        const minLength = 8;

        if (newPassword !== confirmPassword) {
            alert('New Password and Confirm Password do not match. Please check again.');
            return; // Stop execution if passwords do not match
        }

        if ( !newPassword || !confirmPassword) {
            alert("All fields must be filled");
            return;
          }
        
          // Check if email is valid
        
          // Check if passwords match
          if (newPassword !== confirmPassword) {
            alert("Passwords don't match");
            return;
          }
          // if (insecurePasswords.has(lowercasedpassword)) {
          //   alert("Your password is execeptionally weak, choose another one")
          //   return;
          // }
          if (passwordRegex.test(newPassword)){
            alert("Forbidden Characters Detected in password field")
            return;
          }
      
          if (newPassword.length < minLength) {
            alert("Minimum length is 8 characters")
              return;
          }
      
          // Check if password contains at least one uppercase letter
          if (!/[A-Z]/.test(newPassword)) {
            alert("Password must contain at least one Uppercase letter")
            return;
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
        const encodedu = sessionStorage.getItem('formflag')


        const response = await fetch(`http://localhost:5000/a_reset_password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newPassword: encodedPassword, encodedu: encodedu})
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
    var password = document.getElementById("new-password-field").value;
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
  document.getElementById("new-password-field").addEventListener("input", updatePasswordStrength);


