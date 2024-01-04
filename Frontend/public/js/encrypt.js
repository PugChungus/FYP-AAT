const selectedFiles = {
    files: []
};

const keyDropdown = document.getElementById('key-dropdown');
let selectedKey = keyDropdown.value;

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

    // Set the selected key to the value of the first option
    selectedKey = keyDropdown.value;

    // Trigger the change event manually
    keyDropdown.dispatchEvent(new Event('change'));
}

createKeyDropdown()

document.getElementById('file-input-encrypt').addEventListener('change', handleFileUpload);

async function handleFileUpload(event) {
    const files = event.target.files;

    for (const file of files) {
        await sendFileToBackend(file);
    }
}

keyDropdown.addEventListener('change', function () {
    // Update the selected key value
    selectedKey = keyDropdown.value;
});

async function uploadFiles() {
    // Check if there are files to upload
    if (selectedFiles.files.length > 0) {
        await clearEncryptedFolder();
        await sendFilesToBackend();
    } else {
        console.log("No files selected to upload.");
        return;
    }

    hideDropZoneAndFileDetails();
}

async function hideDropZoneAndFileDetails() {
    const dropZone = document.querySelector('.drag-zone-container');
    const fileDetails = document.querySelector('.file-details-container');
    const dropZoneEncasement = document.querySelector('.encasement-container');
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

    if (selectedFiles.files.length >= 2) {
        // Create a card div for file download options
        const cardDiv = document.createElement('div');
        cardDiv.id = 'downloadCard';

        // Create buttons for zip and individual file download
        const zipButton = document.createElement('button');
        zipButton.textContent = 'Download as Zip';
        zipButton.addEventListener('click', async () => {
            downloadEncryptedFiles('zip');
        });

        const individualButton = document.createElement('button');
        individualButton.textContent = 'Download Encrypted Files Individually';
        individualButton.addEventListener('click', async () => {
            downloadEncryptedFiles('individual');
        });

        // Append buttons to the card div
        cardDiv.appendChild(zipButton);
        cardDiv.appendChild(individualButton);

        // Append the card div to the document or display it wherever needed
        document.body.appendChild(cardDiv);
    } else {
        // If there is only one file, create a simple download button
        downloadButton.style.display = 'block';
        downloadButton.textContent = 'Download Encrypted File';  // Reuse the existing variable
        
        // Add click event listener to the download button
        downloadButton.addEventListener('click', async () => {
            downloadEncryptedFiles('individual');
        });
        
        // Append the download button to the document or display it wherever needed
        document.body.appendChild(downloadButton);
    }
}

//send files to backend to perform a virus check
async function sendFileToBackend(file) {
    const formData = new FormData();
    formData.append('file', file);

    const scanLoader = document.getElementById('scan-loader');
    scanLoader.style.display = 'block'

    try {
        const scanResult = await performScan(formData);

        if (scanResult.isValid) {
            selectedFiles.files.push(file); 
            console.log(`Scan result for ${file.name}: Non-malicious. Proceeding with upload`)
            displayFileDetails(file, formData)
        } else {
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

async function clearEncryptedFolder() {
    try {
        const clearResponse = await fetch('http://localhost:5000/clear_encrypted_folder', {
            method: 'GET',
        });

        if (clearResponse.ok) {
            console.log('Encrypted folder cleared.');
        } else {
            console.error('Error clearing encrypted folder:', clearResponse.statusText);
        }
    } catch (clearError) {
        console.error('Error clearing encrypted folder:', clearError);
    }
}

async function encrypt(file) {
    const formData = new FormData();

    const jsonString = sessionStorage.getItem(selectedKey);

    if (jsonString) {
        const keyData = JSON.parse(jsonString);
        const keyValue = keyData.keyValue;
        console.log(keyValue)
        formData.append('hex', keyValue);
    }
  
    formData.append('files', file);
  
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

//send files to the backend to encrypt
async function sendFilesToBackend() {
    const files = selectedFiles.files;
    const totalFiles = files.length; // Get the total number of files

    if (totalFiles == 1){
        const file = files[0];
        await encrypt(file)
    }
    else {
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            await encrypt(file)
        }
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

function downloadEncryptedFiles(type) {
    if (type === 'individual') {
        const files = selectedFiles.files;
        const totalFiles = files.length;
        
        for (let i = 0; i < totalFiles; i++) {
            const filename = files[i].name;
            let fileNameWithoutExtension;

            const numberOfDots = (filename.match(/\./g) || []).length;

            if (numberOfDots === 1 || numberOfDots > 1) {
                fileNameWithoutExtension = filename.split('.').slice(0, -1).join('.');
            } else {
                fileNameWithoutExtension = filename;
            }

            const fileNameWithEnc = `${fileNameWithoutExtension}.enc`;

            fetch(`http://localhost:5000/download_single_encrypted_file/${fileNameWithEnc}`)
                .then(response => response.blob())
                .then(blob => {
                    const downloadLink = document.createElement('a');
                    downloadLink.href = URL.createObjectURL(blob);
                    downloadLink.download = fileNameWithEnc;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                });
        }
    } else {
        const filename = 'encrypted_zip.zip';

        fetch(`http://localhost:5000/download_zip/${filename}`)
            .then(response => response.blob())
            .then(blob => {
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);
                downloadLink.download = filename;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            });
    }
}