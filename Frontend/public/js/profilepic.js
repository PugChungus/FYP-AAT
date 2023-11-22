document.getElementById('file-input').addEventListener('change', function (e) {
    const fileInput = e.target;
    const profilePicContainer = document.getElementById('profile-pic-container');

    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const image = document.createElement('img');
            image.src = e.target.result;

            // Clear the previous content of profilePicContainer
            profilePicContainer.innerHTML = '';

            // Append the new image to profilePicContainer
            profilePicContainer.appendChild(image);

            // Show a popup/modal for image cropping
            const cropPopup = document.createElement('div');
            cropPopup.innerHTML = `
                <div id="crop-modal" class="modal">
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <div id="cropper-container"></div>
                        <button id="crop-submit">Crop and Set as Profile Picture</button>
                    </div>
                </div>
            `;

            document.body.appendChild(cropPopup);

            // Attach Cropper.js to the new container in the popup
            const cropperContainer = document.getElementById('cropper-container');
            const cropperPopup = new Cropper(cropperContainer, {
                aspectRatio: 1, // Set the aspect ratio as needed
                viewMode: 2,    // Set the view mode to 2 to enable freeform crop
                autoCropArea: 1, // Set the autoCropArea to 1 for a circular crop
            });

            // Load the image into the cropper in the popup
            cropperPopup.replace(image.src);

            // Show the popup when the original image is clicked
            image.addEventListener('click', function () {
                document.getElementById('crop-modal').style.display = 'block';
            });

            // Close the popup when the close button is clicked
            document.querySelector('.close').addEventListener('click', function () {
                document.getElementById('crop-modal').style.display = 'none';
            });

            // Crop and set as profile picture when the submit button is clicked
            document.getElementById('crop-submit').addEventListener('click', function () {
                const croppedCanvas = cropperPopup.getCroppedCanvas();
                // You can send the croppedCanvas.toDataURL() to your server for saving the cropped image
                // Update the profile picture container with the cropped image
                profilePicContainer.innerHTML = '';
                profilePicContainer.appendChild(croppedCanvas);

                // Close the popup
                document.getElementById('crop-modal').style.display = 'none';
            });
        };

        reader.readAsDataURL(fileInput.files[0]);
    }
});
