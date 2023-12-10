document.addEventListener("DOMContentLoaded", function () {
    var headerImg = document.querySelector('.header_img');

    if (headerImg) {
        headerImg.addEventListener('click', function(){
            // Get the current page URL
            var currentPage = window.location.href;

            // Redirect to profile.html with the current page as the source
            window.location.href = 'profile.html?source=' + encodeURIComponent(currentPage);
            console.log(window.location.href);
        });
    }
});
