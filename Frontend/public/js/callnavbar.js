document.addEventListener("DOMContentLoaded", function() {
    // Show the loader
    document.querySelector('.loader').style.display = 'block';

    // Fetch and include the navigation bar
    fetch("component/navbar.html")
        .then(response => response.text())
        .then(html => {
            // Insert the navigation bar content
            document.getElementById("navbar-container").innerHTML = html;

            // Hide the loader after one second
            setTimeout(function() {
                document.querySelector('.loader').style.display = 'none';
            }, 500); // 1000 milliseconds = 1 second
        });
});
