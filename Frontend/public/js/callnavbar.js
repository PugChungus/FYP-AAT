function includeNavbar() {
    // Show the loader
    document.querySelector('.loader').style.display = 'block';

    // Fetch and include the navigation bar
    fetch("component/navbar.html")
        .then(response => response.text())
        .then(html => {
            // Insert the navigation bar content
            document.getElementById("nav-bar").innerHTML = html;

            // Hide the loader after one second
            setTimeout(function() {
                document.querySelector('.loader').style.display = 'none';
                
                // Set the active link based on the current page after loader is hidden
                setActiveLink();
            }, 500);
        });
}

function setActiveLink() {
    // Get the current page URL
    var currentUrl = window.location.pathname;

    // Remove the 'active' class from all navigation links
    var navLinks = document.querySelectorAll('.nav_link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Add the 'active' class to the link corresponding to the current page
    var activeLink = document.querySelector(`.nav_link[href="${currentUrl}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

// Call the function when the DOM content is loaded
document.addEventListener("DOMContentLoaded", function() {
    includeNavbar();
});
