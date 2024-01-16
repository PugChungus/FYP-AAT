document.addEventListener("DOMContentLoaded", function () {
    var headerImg = document.querySelector('.header_img');

    if (headerImg) {
        headerImg.addEventListener('click', function(){
            // Get the current page URL
            var currentPage = window.location.href;

            // Store the current page in sessionStorage
            sessionStorage.setItem('currentPage', currentPage);

            // Redirect to the profile page
            window.location.href = 'profile';
        });
    }
});
