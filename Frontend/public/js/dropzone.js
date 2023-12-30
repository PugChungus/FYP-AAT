document.getElementById('file-input-encrypt').addEventListener('change', handleFileUpload);

const selectedFiles = [];

async function handleFileUpload(event) {
    const files = event.target.files;


    for (const file of files) {
        await sendFileToBackend(file);
        selectedFiles.push(file); // Add the file to the list
    }
}

async function uploadFiles() {
    // Check if there are files to upload
    if (selectedFiles.length > 0) {
        await sendFilesToBackend(selectedFiles);
    } else {
        console.log("No files selected to upload.");
        return;
    }
    hideDropZoneAndFileDetails();
}



function hideDropZoneAndFileDetails() {
    const dropZone = document.querySelector('.drag-zone-container');
    const fileDetails = document.querySelector('.file-details-container');
    const dropZoneEncasement = document.querySelector('.encasement-container')
    const encryptButton = document.getElementById('encryptButton');
    const downloadButton = document.createElement('button');
    downloadButton.id = 'downloadButton';
    downloadButton.textContent = 'Download Encrypted Files';
  
    // Append the download button to the document or display it wherever needed
    document.body.appendChild(downloadButton);
  
    // Hide the drop zone, file details, and encrypt button
    dropZone.style.display = 'none';
    fileDetails.style.display = 'none';
    encryptButton.style.display = 'none';
    dropZoneEncasement.style.display = 'none';
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

        if (response.ok) {
            const blob = await response.blob();
            
            // Create a Blob URL for the zip file
            const zipUrl = URL.createObjectURL(blob);

            // Create a hyperlink dynamically
            const downloadButton = document.createElement('a');
            downloadButton.href = zipUrl;
            downloadButton.download = 'encrypted_files.zip'; // Set the desired filename
            downloadButton.textContent = 'Download Encrypted Files';

            // Append the link to the document or display it wherever needed
            document.body.appendChild(downloadButton);
        } else {
            console.error('Error sending file:', response.statusText);
        }
    }
    catch (error) {
        console.error("Error send file:", error);
    }
  }

async function sendFileToBackend(file) {
    const formData = new FormData();
    formData.append('file', file);

    const scanLoader = document.getElementById('scan-loader');
    scanLoader.style.display = 'block'

    try {
        const scanResult = await performScan(formData);

        if (scanResult.isValid) {
            console.log(`Scan result for ${file.name}: Non-malicious. Proceeding with upload`)
            displayFileDetails(file, formData)
        }else {
            console.warn(`Scan result for ${file.name}: Malicious. Upload denied`)
            
            setTimeout(() => {
                alert(`File ${file.name} is malicious. Upload denied.`);
            }, 500); 
        }
    } catch (error){
        console.error(`Error during scan for ${file.name}:`, error)
    } finally {
        scanLoader.style.display = 'none'
    }
}

async function performScan(formData) {
    try {
        const response = await fetch('http://localhost:5000/upload_file', {
            method:'POST',
            body: formData,
        });

        const data = await response.json()
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error during scan:', error);
        return {isValid:false, error: 'Error during scan'};
    }
}

function displayFileDetails(file, formData) {
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

    // Perform the scan after displaying file details
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

function getAllKeyData() {
    const keyData = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        // Check if the key starts with 'key_' to identify your keys
        if (key.startsWith('key_')) {
            const keyName = key.substring(4); // Extract the fileNameWithoutExtension part
            const data = JSON.parse(sessionStorage.getItem(key));
            keyData.push({ keyName, uploadTime: data.uploadTime });
        }
    }
    return keyData;
}

function createKeyDropdown() {
    const keyDropdown = document.getElementById('key-dropdown');

    // Clear existing options
    keyDropdown.innerHTML = '';

    // Get all key data from sessionStorage
    const keyData = getAllKeyData();

    // Sort key data based on upload time (assuming uploadTime is in ISO format)
    keyData.sort((a, b) => new Date(a.uploadTime) - new Date(b.uploadTime));

    // Add each key name as an option in the dropdown
    keyData.forEach((data, index) => {
        const option = document.createElement('option');
        option.value = `key_${data.keyName}`;
        option.textContent = data.keyName;
        keyDropdown.appendChild(option);
    });
}

createKeyDropdown()



