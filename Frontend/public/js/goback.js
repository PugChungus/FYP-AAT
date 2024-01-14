document.addEventListener("DOMContentLoaded", function () {
    var goBackButton = document.getElementById("goBackButton");

    if (goBackButton) {
        goBackButton.addEventListener("click", function (event) {
            event.preventDefault();

            // Get the value of the 'source' query parameter
            var urlParams = new URLSearchParams(window.location.search);
            var source = urlParams.get('source');

            // Extract just the page name without the '/pages/' prefix
            var sourcePageName = source ? source.split('/').pop() : '';

            console.log('Source:', source);

            // Define a mapping of sources to page URLs
            var pageUrls = {
                'login': "/login",
                '2fa': "/2fa",
                'change-password': "/change-password",
                'encrypt.html': "/encrypt",
                'decrypt.html': "/decrypt",
                'keymanagement.html': "/keymanagement",
                'history.html': "/history",
                'settings.html': "/settings",
                'home.html': "/home"
            };

            // Log the intended URL before redirection with a timeout of 2000 milliseconds (2 seconds)
            console.log('Intended URL:', pageUrls[sourcePageName] || pageUrls['home.html']);

            // Redirect based on the source
            window.location.href = pageUrls[sourcePageName] || pageUrls['home.html'];
        });
    }
});
