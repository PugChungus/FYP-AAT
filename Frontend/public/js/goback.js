document.addEventListener("DOMContentLoaded", function () {
    var goBackButton = document.getElementById("goBackButton");

    if (goBackButton) {
        goBackButton.addEventListener("click", function (event) {
            event.preventDefault();

            // Get the previous page's URL using document.referrer
            var previousPageUrl = document.referrer;

            // Log the intended URL before redirection with a timeout of 2000 milliseconds (2 seconds)
            console.log('Intended URL:', previousPageUrl);

            // Redirect to the previous page
            window.location.href = previousPageUrl;
        });
    }
});
