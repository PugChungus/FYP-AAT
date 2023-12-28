document.getElementById('file-input-encrypt').addEventListener('change', handleFileUpload);

const selectedFiles = [];

function handleFileUpload(event) {
    const files = event.target.files;

    // Clear previous file details
    document.getElementById('file-details-container').innerHTML = '';

    // Display file details
    for (const file of files) {
        displayFileDetails(file);
        selectedFiles.push(file); // Add the file to the list
    }
}

function displayFileDetails(file) {
    const fileDetailsContainer = document.getElementById('file-details-container');

    // Create a div element for each file
    const fileContainer = document.createElement('div');
    fileContainer.classList.add('file-container');

    // Display file name
    const fileName = document.createElement('div');
    fileName.textContent = `File Name: ${file.name}`;
    fileContainer.appendChild(fileName);

    // Display file size
    const fileSize = document.createElement('div');
    fileSize.textContent = `File Size: ${formatFileSize(file.size)}`;
    fileContainer.appendChild(fileSize);

    // Append file container to the details container
    fileDetailsContainer.appendChild(fileContainer);
}

async function uploadFiles() {
    // Check if there are files to upload
    if (selectedFiles.length > 0) {
        await sendFilesToBackend(selectedFiles);
    } else {
        console.log("No files selected to upload.");
    }
}

async function sendFilesToBackend(files) {
    const formData = new FormData();
  
    // Append each file to the FormData object
    for (const file of files) {
      formData.append('files', file);
    }
  
    try {
        const response = await fetch('http://localhost:5000/encrypt', {
            method: 'POST',
            body: formData,
        });
    }
    catch (error) {
        console.error("Error send file:", error);
    }
  }

function formatFileSize(size) {
    const kilobyte = 1024;
    const megabyte = kilobyte * 1024;

    if (size < kilobyte) {
        return `${size} B`;
    } else if (size < megabyte) {
        return `${(size / kilobyte).toFixed(2)} KB`;
    } else {
        return `${(size / megabyte).toFixed(2)} MB`;
    }
}
