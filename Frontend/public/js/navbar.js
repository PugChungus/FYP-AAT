document.body.classList.add('loading');

// After content is loaded, remove the loading class
window.addEventListener('load', function () {
    document.body.classList.remove('loading');
});
