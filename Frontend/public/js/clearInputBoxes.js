// clearInputBoxes.js

document.addEventListener('DOMContentLoaded', function() {
    // Clear input boxes on page load
    document.getElementById('email-field').placeholder = 'Email';
    document.getElementById('password-field').placeholder = 'Password';
});
