document.addEventListener("DOMContentLoaded", function() {
    // Fetch and include the navigation bar
    fetch("component/navbar.html")
        .then(response => response.text())
        .then(html => {
            document.getElementById("navbar-container").innerHTML = html;
        });
});
