const selectedFiles = {
    files: []
};

const seen = new Set();
const keyDropdown = document.getElementById('key-dropdown');
let selectedKey = keyDropdown.value;

async function get_cookie() {
    const cookie_response = await fetch('http://localhost:3000/api/getCookie', {
        method: 'GET',
    });

    const cookie_data = await cookie_response.json()
    const token = cookie_data.token.jwtToken
    return token
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
        const individualButton = document.createElement('button');
        zipButton.textContent = 'Download as Zip';
        zipButton.addEventListener('click', async () => {
            const zipFolderName = window.prompt('Enter the name for the zip folder (without extension)');
            if (zipFolderName) {
                downloadEncryptedFiles('zip', zipFolderName);
                dropZone.style.display = 'block';
                fileDetails.style.display = 'block';
                encryptButton.style.display = 'block';
                dropZoneEncasement.style.display = 'block';
                zipButton.style.display = 'none';
                individualButton.style.display = 'none';
                cardDiv.style.display = 'none';
                selectedFiles.files = []
                var div = document.getElementById("file-details-container");
                div.innerHTML = "";
                seen.clear();
            }
        });

        individualButton.textContent = 'Download Encrypted Files Individually';
        individualButton.addEventListener('click', async () => {
            downloadEncryptedFiles('individual');
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            encryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            zipButton.style.display = 'none';
            individualButton.style.display = 'none';
            cardDiv.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
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
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            encryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            downloadButton.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
        });
        
        // Append the download button to the document or display it wherever needed
        document.body.appendChild(downloadButton);
    }
}

//send files to backend to perform a virus check
async function sendFileToBackend(file) {
    const formData = new FormData();
    formData.append('file', file);

    const fileNameParts = file.name.split('.');
    const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : '';
    const fileNameWithoutExtension = fileNameParts.join('');
    console.log(fileNameWithoutExtension)

    const scanLoader = document.getElementById('scan-loader');
    scanLoader.style.display = 'block'

    try {
        const scanResult = await performScan(formData);

        if (scanResult.isValid) {
            selectedFiles.files.push(file); 
            if (seen.has(fileNameWithoutExtension)) {
                alert('Duplicate file name')
                return;
            }
            
            seen.add(fileNameWithoutExtension);
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
    const jwtToken = get_cookie()
    try {
        const response = await fetch('http://localhost:5000/upload_file', {
            method:'POST',
            headers: {
                'Authorization': `Bearer: ${jwtToken}`
            },
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

async function encrypt(file, i) {
    const formData = new FormData();

    if (selectedKey.length === 0) {
        alert('No Key Selected')
        return false;
    }

    const jsonString = sessionStorage.getItem(selectedKey);

    let keyData;

    if (jsonString) {
        keyData = JSON.parse(jsonString);
        const keyValue = keyData.keyValue;
        console.log(keyValue)
        formData.append('hex', keyValue);
    }
      
    formData.append('files', file);
    console.log(file)
    formData.append('clear', i);
    console.log(formData)

    try {
        const jwtToken = get_cookie()
        const response = await fetch('http://localhost:5000/encrypt', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer: ${jwtToken}`
            },
            body: formData,
            // headers: myHeaders,
        });

        console.log('Response Status:', response.status); 

        if (response.ok) {
            const formData2 = new FormData();
            const keyName = keyData.keyName;
            console.log(keyName)

            const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
                method: 'POST'
            });
            
            const data = await newResponse.json(); // await here
            const id = data['id_username']['id'];

            formData2.append('files', file);
            formData2.append('key_name', keyName);
            formData2.append('type', 'encryption')
            formData2.append('id', id)

            const jwtToken = get_cookie()

            const response2 = await fetch('http://localhost:5000/add_to_encryption_history', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${jwtToken}`
                },
                body: formData2,
            });

            return true;
        }

        else {
            return false;
        }
    }
    catch (error) {
        console.error("Error send file:", error);
        return false;
    }
}

//send files to the backend to encrypt
async function sendFilesToBackend() {
    const files = selectedFiles.files;
    const totalFiles = files.length;

    if (totalFiles == 1) {
        const file = files[0];
        const i = 0
        const encryptionSuccessful = await encrypt(file, i);

        if (encryptionSuccessful) {
            hideDropZoneAndFileDetails();
        }
    } else {
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const encryptionSuccessful = await encrypt(file, i);

            if (!encryptionSuccessful) {
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

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => {
        // Remove the file container from the details container
        fileDetailsContainer.removeChild(fileContainer);
        const fileNameParts = file.name.split('.');
        const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : '';
        const fileNameWithoutExtension = fileNameParts.join('');
        console.log(fileNameWithoutExtension)
        seen.delete(fileNameWithoutExtension);
        // You can also perform additional logic or updates here
    });
    fileContainer.appendChild(removeButton);

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

async function downloadEncryptedFiles(type, name) {
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

            const response = await fetch(`http://localhost:5000/download_single_encrypted_file/${fileNameWithEnc}`);
            const blob = await response.blob();

            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.download = fileNameWithEnc;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }

        await clearEncryptedFolder();

    } else {
        const filename = 'encrypted.zip';
        const outfilename = `${name}.zip`;

        const response = await fetch(`http://localhost:5000/download_zip/${filename}`);
        const blob = await response.blob();

        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = outfilename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        await clearEncryptedFolder();
    }
}const selectedFiles = {
    files: []
};

const seen = new Set();
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
}

async function hideDropZoneAndFileDetails() {
    const dropZone = document.querySelector('.drag-zone-container');
    const fileDetails = document.querySelector('.file-details-container');
    const dropZoneEncasement = document.querySelector('.encasement-container');
    const encryptButton = document.getElementById('encryptButton');
    const downloadButton = document.createElement('button');
    const googleupload = document.createElement('button');
    const onedriveupload = document.createElement('button');

    downloadButton.id = 'downloadButton';
    downloadButton.textContent = 'Download Encrypted Files';

    googleupload.id = 'uploadgoogleButton';
    googleupload.textContent = 'Upload To GoogleDrive';

    onedriveupload.id = 'onedrivebutton';
    onedriveupload.textContent = 'Upload To OneDrive';

    // Append the download button to the document or display it wherever needed
    // document.body.appendChild(downloadButton);
    // document.body.appendChild(googleupload);
    // document.body.appendChild(onedriveupload);
    // Hide the drop zone, file details, and encrypt button
    dropZone.style.display = 'none';
    fileDetails.style.display = 'none';
    encryptButton.style.display = 'none';
    dropZoneEncasement.style.display = 'none';

    if (selectedFiles.files.length >= 2) {
        // Create a card div for file download options
        const cardDiv = document.createElement('div');
        cardDiv.id = 'downloadCard';
        // Create Google Button
        const googlebutton = document.createElement('button');
        googlebutton.textContent ="Download Zip to google";
        googlebutton.addEventListener('click', async () => {
            const googleFolderName = window.prompt('Enter the name for the zip folder (without extension)');
            if (googleFolderName) {
                uploadtoGoogle('zip', googleFolderName);
            }
        })
        //Create One Drive
        const onedrivebutton = document.createElement('button');
        onedrivebutton.textContent ="Download Zip to onedrive";
        onedrivebutton.addEventListener('click', async () => {
            const onedriveFolderName = window.prompt('Enter the name for the zip folder (without extension)');
            if (onedriveFolderName) {
                uploadtoOneDrive('zip', onedriveFolderName);
            }
        })
        // Create buttons for zip and individual file download
        const zipButton = document.createElement('button');
        zipButton.textContent = 'Download as Zip';
        zipButton.addEventListener('click', async () => {
            const zipFolderName = window.prompt('Enter the name for the zip folder (without extension)');
            if (zipFolderName) {
                downloadEncryptedFiles('zip', zipFolderName);
            }
        });

        const individualButton = document.createElement('button');
        individualButton.textContent = 'Download Encrypted Files Individually';
        individualButton.addEventListener('click', async () => {
            downloadEncryptedFiles('individual');
        });
        const individualGoogle = document.createElement('button');
        individualGoogle.textContent = 'Upload Files To Google Individually';
        individualGoogle.addEventListener('click', async () => {
            uploadtoGoogle('individual');
        });

        const individualOnedrive = document.createElement('button');
        individualOnedrive.textContent = 'Upload Files To OneDrive Individually';
        individualOnedrive.addEventListener('click', async () => {
            uploadtoOneDrive('individual');
        });


        // Append buttons to the card div
        cardDiv.appendChild(googlebutton)
        cardDiv.appendChild(onedrivebutton)
        cardDiv.appendChild(zipButton);
        cardDiv.appendChild(individualButton);
        cardDiv.appendChild(individualGoogle);
        cardDiv.appendChild(individualOnedrive);


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

        googleupload.style.display = 'block';
        googleupload.textContent = 'Upload File To Google';  // Reuse the existing variable
        
        // Add click event listener to the download button
        googleupload.addEventListener('click', async () => {
            uploadtoGoogle('individual');
        });
        
        
        onedriveupload.style.display = 'block';
        onedriveupload.textContent = 'Upload File to OneDrive';  // Reuse the existing variable
        
        // Add click event listener to the download button
        onedriveupload.addEventListener('click', async () => {
            uploadtoOneDrive('individual');
        });
        // Append the download button to the document or display it wherever needed
        document.body.appendChild(downloadButton);
        document.body.appendChild(googleupload);
        document.body.appendChild(onedriveupload);
    }
}
//finish individ upload today

//send files to backend to perform a virus check
async function sendFileToBackend(file) {
    const formData = new FormData();
    formData.append('file', file);

    const fileNameParts = file.name.split('.');
    const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : '';
    const fileNameWithoutExtension = fileNameParts.join('');
    console.log(fileNameWithoutExtension)

    if (seen.has(fileNameWithoutExtension)) {
        alert('Duplicate file name')
        return;
    }
    
    seen.add(fileNameWithoutExtension);

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

    if (selectedKey.length === 0) {
        alert('No Key Selected')
        return false;
    }

    const jsonString = sessionStorage.getItem(selectedKey);

    let keyData;

    if (jsonString) {
        keyData = JSON.parse(jsonString);
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

        console.log('Response Status:', response.status); 

        if (response.ok) {
            const formData2 = new FormData();
            const keyName = keyData.keyName;
            console.log(keyName)

            formData2.append('files', file);
            formData2.append('key_name', keyName);
            formData2.append('type', 'encryption')
            formData2.append('email', sessionStorage.getItem('email'))

            const response2 = await fetch('http://localhost:5000/add_to_encryption_history', {
                method: 'POST',
                body: formData2,
            });

            return true;
        }

        else {
            return false;
        }
    }
    catch (error) {
        console.error("Error send file:", error);
        return false;
    }
}

//send files to the backend to encrypt
async function sendFilesToBackend() {
    const files = selectedFiles.files;
    const totalFiles = files.length;

    if (totalFiles == 1) {
        const file = files[0];
        const decryptionSuccessful = await encrypt(file);

        if (decryptionSuccessful) {
            hideDropZoneAndFileDetails();
        }
    } else {
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const decryptionSuccessful = await encrypt(file);

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
async function uploadtoGoogle (type,name){
    if (type === 'individual') {
        const files = selectedFiles.files;
        const totalFiles = files.length;
        const accesstoken = await getGoogleToken()
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
            const backendurl = `http://localhost:5000/download_single_encrypted_file/${fileNameWithEnc}`

            const blob = await fetch(backendurl).then(response => response.blob());
        
            const headers = new Headers();
            headers.append('Authorization', 'Bearer ' + accesstoken);

            // Construct the request body
            console.log(files)
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify({ name: fileNameWithEnc })], { type: 'application/json' }));
            formData.append('file', blob, fileNameWithEnc);

            // Make the POST request
            fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers,
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('Files uploaded successfully:', data);
            })
            .catch(error => {
                console.error('Error uploading file:', error);
            });
        }
    } else {
        const filename = 'encrypted.zip'
        const backendURL = `http://localhost:5000/download_zip/${filename}`;
        const googleDriveAPI = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

        // Step 1: Download ZIP file from the backend
        const blob = await fetch(backendURL).then(response => response.blob());
        // Step 2: Upload ZIP file to Google Drive
        
        const accessToken = await getGoogleToken();
        console.log(accessToken)
        const headers = new Headers();
        headers.append('Authorization', `Bearer'${accessToken}`);
        console.log(headers)
        const formData = new FormData();
        const fileNameOnDrive = `${name}.zip`;

        formData.append('metadata', new Blob([JSON.stringify({ name: fileNameOnDrive })], { type: 'application/json' }));
        formData.append('file', blob, fileNameOnDrive);

        try {
            const response = await fetch(googleDriveAPI, {
                method: 'POST',
                headers,
                body: blob,
            });
       
     if (response.ok) {
        const data = await response.json();
        console.log('File uploaded successfully:', data);
        const fileId = data.id; // Assuming the response contains the file ID
        const updateFilenameAPI = `https://www.googleapis.com/drive/v3/files/${fileId}`;
        const updateFilenameData = {
            name: `${name}.zip`,
        };

        const updateResponse = await fetch(updateFilenameAPI, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateFilenameData),
        });
        if (updateResponse.ok) {
            const updateData = await updateResponse.json();
            console.log('Filename updated successfully:', updateData);
        } else {
            console.error('Error updating filename:', updateResponse.statusText);
        }
    } else {
        console.error('Error uploading file to Google Drive:', response.statusText);
    }
} catch (error) {
    console.error('Error uploading file to Google Drive:', error);
}
}
       


    


}

function downloadEncryptedFiles(type, name) {
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
        const filename = 'encrypted.zip';

        const outfilename = `${name}.zip`

        fetch(`http://localhost:5000/download_zip/${filename}`)
            .then(response => response.blob())
            .then(blob => {
                const downloadLink = document.createElement('a');
                downloadLink.href = URL.createObjectURL(blob);
                downloadLink.download = outfilename;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            });
    }
}


//create a new function for onedrive upload 
async function uploadtoOneDrive (type,name){
    if (type === 'individual') {
        const files = selectedFiles.files;
        const totalFiles = files.length;
        const accesstoken = await getTokenForRequest()
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
            
            const OneDriveAPI = `https://api.onedrive.com/v1.0/drive/root:/${fileNameWithEnc}:/content`;
            
            const backendurl = `http://localhost:5000/download_single_encrypted_file/${fileNameWithEnc}`

            const blob = await fetch(backendurl).then(response => response.blob());
            const headers = new Headers();

            
            headers.append('Authorization', 'Bearer ' + accesstoken);

            // Construct the request body
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify({ name: fileNameWithEnc })], { type: 'application/json' }));
            formData.append('file', blob, fileNameWithEnc);
                console.log(accesstoken)
            // Make the POST request
            fetch(OneDriveAPI, {
                method: 'PUT',
                headers,
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                console.log('File uploaded successfully:', data);
            })
            .catch(error => {
                console.error('Error uploading file:', error);
            });
        }
    } else {
        const filenamefordrive = `${name}.zip`
        const filename = 'encrypted.zip'
        const backendURL = `http://localhost:5000/download_zip/${filename}`;
        
        const OneDriveAPI = `https://api.onedrive.com/v1.0/drive/root:/${filenamefordrive}:/content`;
        // Step 1: Download ZIP file from the backend
        const blob = await fetch(backendURL).then(response => response.blob());
        // Step 2: Upload ZIP file to Google Drive
        

        const accessToken = await getTokenForRequest();
        console.log(accessToken)
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${accessToken}`);
        console.log(headers)
        const formData = new FormData();
        const fileNameOnDrive = `${name}.zip`;

        formData.append('metadata', new Blob([JSON.stringify({ name: fileNameOnDrive })], { type: 'application/json' }));
        formData.append('file', blob, fileNameOnDrive);

        try {
            const response = await fetch(OneDriveAPI, {
                method: "PUT",
                headers,
                body: blob,
              });
       
     if (response.ok) {
        const data = await response.json();
        console.log('File uploaded successfully:', data);
    } else {
        console.error('Error uploading file to OneDrive:', response.statusText);
    }
} catch (error) {
    console.error('Error uploading file to OneDrive:', error);
}
}
}


// OneDrive MSAL Documentation -->https://learn.microsoft.com/en-us/javascript/api/@azure/msal-browser/browsercachemanager?view=msal-js-latest
// Clear the cache containing msal cookies and info ?
// Maybe clears saved info, forcing user to login in again.


