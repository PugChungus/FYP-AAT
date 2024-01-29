document.addEventListener("DOMContentLoaded", function () {
    var goBackButton = document.getElementById("goBackButton");

    if (goBackButton) {
        goBackButton.addEventListener("click", function (event) {
            event.preventDefault(); // Prevent the default action of the anchor element

            // Get the previous page's URL from sessionStorage
            var previousPageUrl = sessionStorage.getItem("currentPage");

            // Log the intended URL before redirection
            console.log('Intended URL:', previousPageUrl);

            // Redirect to the previous page
            window.location.href = previousPageUrl;
            sessionStorage.setItem('currentPage', "")
        });
    }
});
