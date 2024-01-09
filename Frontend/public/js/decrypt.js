const selectedFiles = {
    files: []
};

const keyDropdown = document.getElementById('key-dropdown');
let selectedKey = keyDropdown.value;
let decryptedExtension;
let decryptedExtensionList = [];

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

document.getElementById('file-input-decrypt').addEventListener('change', handleFileUpload);

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
        await clearDecryptedFolder();
        await sendFilesToBackend();
    } else {
        console.log("No files selected to upload.");
        return;
    }
}

async function hideDropZoneAndFileDetails() {
    const dropZone = document.querySelector('.drag-zone-container');
    const fileDetails = document.querySelector('.file-details-container');
    const dropZoneEncasement = document.querySelector('.encasement-container');
    const decryptButton = document.getElementById('decryptButton');
    const downloadButton = document.createElement('button');
    downloadButton.id = 'downloadButton';
    downloadButton.textContent = 'Download Encrypted Files';

    // Append the download button to the document or display it wherever needed
    document.body.appendChild(downloadButton);

    // Hide the drop zone, file details, and encrypt button
    dropZone.style.display = 'none';
    fileDetails.style.display = 'none';
    decryptButton.style.display = 'none';
    dropZoneEncasement.style.display = 'none';

    if (selectedFiles.files.length >= 2) {
        // Create a card div for file download options
        const cardDiv = document.createElement('div');
        cardDiv.id = 'downloadCard';

        // Create buttons for zip and individual file download
        const zipButton = document.createElement('button');
        zipButton.textContent = 'Download as Zip';
        zipButton.addEventListener('click', async () => {
            downloadDecryptedFiles('zip');
        });

        const individualButton = document.createElement('button');
        individualButton.textContent = 'Download Decrypted Files Individually';
        individualButton.addEventListener('click', async () => {
            downloadDecryptedFiles('individual', decryptedExtension);
        });

        // Append buttons to the card div
        cardDiv.appendChild(zipButton);
        cardDiv.appendChild(individualButton);

        // Append the card div to the document or display it wherever needed
        document.body.appendChild(cardDiv);
    } else {
        // If there is only one file, create a simple download button
        downloadButton.style.display = 'block';
        downloadButton.textContent = 'Download Decrypted File';  // Reuse the existing variable
        
        // Add click event listener to the download button
        downloadButton.addEventListener('click', async () => {
            downloadDecryptedFiles('individual', decryptedExtension);
        });
        
        // Append the download button to the document or display it wherever needed
        document.body.appendChild(downloadButton);
    }
}

function isValidFileExtension(file) {
    const allowedExtension = ".enc";
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2);

    if (fileExtension === allowedExtension) {
        return true; // Valid extension
    } else {
        alert(`Please upload files with ${allowedExtension} or .zip extension`);
        return false; // Invalid extension
    }
}

async function sendFileToBackend(file) {
    const formData = new FormData();
    formData.append('file', file);

    const isValid = isValidFileExtension(file);
    
    if (!isValid) {
        return
    }

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

async function clearDecryptedFolder() {
    try {
        const clearResponse = await fetch('http://localhost:5000/clear_decrypted_folder', {
            method: 'GET',
        });

        if (clearResponse.ok) {
            console.log('Decrypted folder cleared.');
        } else {
            console.error('Error clearing decrypted folder:', clearResponse.statusText);
        }
    } catch (clearError) {
        console.error('Error clearing decrypted folder:', clearError);
    }
}

async function decrypt(file) {
    const formData = new FormData();

    if (selectedKey.length === 0) {
        alert('No Key Selected')
        return false; // Return false indicating decryption failure
    }

    const jsonString = sessionStorage.getItem(selectedKey);

    if (jsonString) {
        const keyData = JSON.parse(jsonString);
        const keyValue = keyData.keyValue;
        console.log(keyValue)
        formData.append('hex', keyValue);
    }

    formData.append('files', file);

    try {
        const response = await fetch('http://localhost:5000/decrypt', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const responseData = await response.json();
            decryptedExtension = responseData.decrypted_extension;
            decryptedExtensionList.push(decryptedExtension);
            return true; // Return true indicating decryption success
        } else {
            return false; // Return false indicating decryption failure
        }
    } catch (error) {
        console.error("Error send file:", error);
        return false; // Return false indicating decryption failure
    }
}

//send files to the backend to encrypt
async function sendFilesToBackend() {
    const files = selectedFiles.files;
    const totalFiles = files.length;

    if (totalFiles == 1) {
        const file = files[0];
        const decryptionSuccessful = await decrypt(file);

        if (decryptionSuccessful) {
            hideDropZoneAndFileDetails();
        }
    } else {
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const decryptionSuccessful = await decrypt(file);

            if (!decryptionSuccessful) {
                // If decryption fails for any file, stop processing the rest
                return;
            }
        }

        // If all files are successfully decrypted, hide the drop zone
        hideDropZoneAndFileDetails();
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

function downloadDecryptedFiles(type) {
    if (type === 'individual') {
        const files = selectedFiles.files;
        const totalFiles = files.length;
        
        for (let i = 0; i < totalFiles; i++) {
            const filename = files[i].name;
            console.log(filename)
            let fileNameWithoutExtension;

            const numberOfDots = (filename.match(/\./g) || []).length;

            if (numberOfDots === 1 || numberOfDots > 1) {
                fileNameWithoutExtension = filename.split('.').slice(0, -1).join('.');
            } else {
                fileNameWithoutExtension = filename;
            }

            if (fileNameWithoutExtension.startsWith("encrypted_")) {
                fileNameWithoutExtension = fileNameWithoutExtension.replace('encrypted_', 'decrypted_');
            }
            
            const decryptedExtension = decryptedExtensionList[i % decryptedExtensionList.length];

            let fileNameWithEnc = `${fileNameWithoutExtension}.${decryptedExtension}`;

            fetch(`http://localhost:5000/download_single_decrypted_file/${fileNameWithEnc}`)
                .then(response => response.blob())
                .then(blob => {
                    const downloadLink = document.createElement('a');
                    downloadLink.href = URL.createObjectURL(blob);
                    if (filename.startsWith('encrypted_')){
                        console.log("working")
                        fileNameWithEnc = 'decrypted_zip.zip'
                    }
                    downloadLink.download = fileNameWithEnc;
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                });
        }
    } else {
        const filename = 'unencrypted.zip';

        fetch(`http://localhost:5000/download_decrypted_zip/${filename}`)
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