// main.js

function loadScript(scriptUrl, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptUrl;
    script.onload = callback;
    document.head.appendChild(script);
}

document.getElementById('loadScriptButton').addEventListener('click', function() {
    loadScript('scripts/dynamic-script.js', function() {
        console.log('Dynamic script loaded.');
        // You can now use functions or variables from dynamic-script.js
        dynamicFunction();
    });
});
