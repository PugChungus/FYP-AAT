import { get_cookie } from './cookie.js'
import { createKeyDropdown } from "./key.js";
import { sendFileToBackend, selectedFiles, seen } from "./virustotal.js";
import { getGoogleToken } from './googlepickerdecrypt.js';
import { getTokenForRequest } from './onedrivepickerdecrypt.js';

const keyDropdown = document.getElementById('key-dropdown');
let selectedKey = keyDropdown.value;
let decryptedExtension;
let decryptedExtensionList = [];



createKeyDropdown()

document.getElementById('file-input-decrypt').addEventListener('change', handleFileUpload);

async function handleFileUpload(event) {
    const files = event.target.files;
    selectedKey = keyDropdown.value;

    for (const file of files) {
        const isValidFileExtensionResult = isValidFileExtension(file);

        if (!isValidFileExtensionResult) {
            return "End of function.";
        }

        await sendFileToBackend(file);
    }
}

keyDropdown.addEventListener('change', function () {
    // Update the selected key value
    selectedKey = keyDropdown.value;
});

export async function uploadFilez() {
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
    const googleButton = document.createElement('button');
    const onedriveButton = document.createElement('button');

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
            const zipFolderName = window.prompt('Enter the name for the zip folder (without extension)');
            if (zipFolderName) {
                downloadDecryptedFiles('zip', zipFolderName);
                dropZone.style.display = 'block';
                fileDetails.style.display = 'block';
                decryptButton.style.display = 'block';
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
        
        const individualButton = document.createElement('button');
        individualButton.textContent = 'Download Decrypted Files Individually';
        individualButton.addEventListener('click', async () => {
            downloadDecryptedFiles('individual', decryptedExtension);
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            decryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            zipButton.style.display = 'none';
            individualButton.style.display = 'none';
            cardDiv.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
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
        downloadButton.textContent = 'Download Decrypted File';  // Reuse the existing variable
        
        // Add click event listener to the download button
        downloadButton.addEventListener('click', async () => {
            downloadDecryptedFiles('individual', decryptedExtension);
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            decryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            downloadButton.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
        });
        // If there is only one file, create a simple download button
        googleButton.style.display = 'block';
        googleButton.textContent = 'Upload File To Google';  // Reuse the existing variable
        
        // Add click event listener to the download button
        googleButton.addEventListener('click', async () => {
            uploadtoGoogle('individual', decryptedExtension);
        });

        // If there is only one file, create a simple download button
        onedriveButton.style.display = 'block';
        onedriveButton.textContent = 'Upload File To OneDrive';  // Reuse the existing variable
        
        // Add click event listener to the download button
        onedriveButton.addEventListener('click', async () => {
            uploadtoOneDrive('individual', decryptedExtension);
        });
        
        // Append the download button to the document or display it wherever needed
        document.body.appendChild(downloadButton);
        document.body.appendChild(googleButton);
        document.body.appendChild(onedriveButton);
    }
}

export function isValidFileExtension(file) {
    const allowedExtensions = ["enc", "zip"];
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2);
    console.log(fileExtension)

    if (allowedExtensions.includes(fileExtension)) {
        return true; // Valid extension
    } else {
        alert(`Please upload files with ${allowedExtensions.join(' or ')} extension`);
        return false; // Invalid extension
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

async function decrypt(file, i) {
    const formData = new FormData();

    if (selectedKey.length === 0) {
        console.log(selectedKey)
        alert('  Selected')
        return false; // Return false indicating decryption failure
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
    formData.append('clear', i)

    try {
        const jwtToken = await get_cookie()

        const response = await fetch('http://localhost:5000/decrypt', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer: ${jwtToken}`
            },
            body: formData,
        });

        console.log(response)

        if (response.ok) {
            const responseData = await response.json();
            decryptedExtension = responseData.decrypted_extension;
            decryptedExtensionList.push(decryptedExtension);
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
            formData2.append('type', 'decryption')
            formData2.append('id', id)

            const jwtToken = await get_cookie()

            const response2 = await fetch('http://localhost:5000/add_to_decryption_history', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${jwtToken}`
                },
                body: formData2,
            });

            return true; // Return true indicating decryption success
        } else {
            if (response.status === 400) {
                alert('File size is too large. Maximum allowed size is 1 GB')
            } else {
                alert('Decryption Failed. Are you sure you are using the correct key, you previously used to encrypt the file?')
            }
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
        const i = 0
        const decryptionSuccessful = await decrypt(file, i);

        if (decryptionSuccessful) {
            hideDropZoneAndFileDetails();
        }
    } else {
        for (let i = 0; i < totalFiles; i++) {
            const file = files[i];
            const decryptionSuccessful = await decrypt(file, i);

            if (!decryptionSuccessful) {
                // If decryption fails for any file, stop processing the rest
                return;
            }
        }

        // If all files are successfully decrypted, hide the drop zone
        hideDropZoneAndFileDetails();
    }
}


async function downloadDecryptedFiles(type, name) {
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

            const response = await fetch(`http://localhost:5000/download_single_decrypted_file/${fileNameWithEnc}`);
            const blob = await response.blob();

            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(blob);
            if (filename.startsWith('encrypted_')) {
                console.log("working")
                fileNameWithEnc = 'decrypted_zip.zip';
            }
            downloadLink.download = fileNameWithEnc;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }

        await clearDecryptedFolder();

    } else {
        const filename = 'unencrypted.zip';
        const outfilename = `${name}.zip`;

        const response = await fetch(`http://localhost:5000/download_decrypted_zip/${filename}`);
        const blob = await response.blob();

        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = outfilename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        await clearDecryptedFolder();
    }
}
async function uploadtoGoogle (type,name){
    if (type === 'individual') {
        const files = selectedFiles.files;
        const totalFiles = files.length;
        const accesstoken = await getGoogleToken()
        for (let i = 0; i < totalFiles; i++) {
            const filename = files[i].name;
            console.log(filename)
            let fileNameWithoutExtension;
            console.log(filename)
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
            const backendurl = `http://localhost:5000/download_single_decrypted_file/${fileNameWithEnc}`

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
        const filename = 'unencrypted.zip'
        const filenamee = name
        console.log(filenamee)
        const backendURL = `http://localhost:5000/download_decrypted_zip/${filename}`;
        const googleDriveAPI = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

        // Step 1: Download ZIP file from the backend
        const blob = await fetch(backendURL).then(response => response.blob());
        // Step 2: Upload ZIP file to Google Drive
        
        const accessToken = await getGoogleToken();
        console.log(accessToken)
        const headers = new Headers({
            'Authorization': `Bearer: ${accessToken}`,
            'Content-Type': 'application/octet-stream', // Set content type to binary
        });
        
        const metadata = {
            name: `${name}.zip`, // Set the desired file name
            mimeType: 'application/octet-stream',
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/octet-stream' }));
        formData.append('file', blob, `${name}.zip`);

        try {
            const response = await fetch(googleDriveAPI, {
                method: 'POST',
                headers,
                body: blob,
            });
       
     if (response.ok) {
        const data = await response.json();
        console.log('File uploaded successfully:', data);
        // Step 3: Update the filename (send a PATCH request)
        const fileId = data.id; // Assuming the response contains the file ID
        const updateFilenameAPI = `https://www.googleapis.com/drive/v3/files/${fileId}`;
        const updateFilenameData = {
            name: `${name}.zip`,
        };

        const updateResponse = await fetch(updateFilenameAPI, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer: ${accessToken}`,
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

async function uploadtoOneDrive (type,name){
    if (type === 'individual') {
        const files = selectedFiles.files;
        const totalFiles = files.length;
        const accesstoken = await getTokenForRequest()
        for (let i = 0; i < totalFiles; i++) {
            const filename = files[i].name;
            console.log(filename)
            let fileNameWithoutExtension;
            console.log(filename)
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

             console.log(decryptedExtension)
             console.log(fileNameWithoutExtension)
             console.log(fileNameWithEnc)
            const OneDriveAPI = `https://api.onedrive.com/v1.0/drive/root:/${fileNameWithEnc}:/content`;
            const backendurl = `http://localhost:5000/download_single_decrypted_file/${fileNameWithEnc}`

            const blob = await fetch(backendurl).then(response => response.blob());
        
            const headers = new Headers();
            headers.append('Authorization', 'Bearer: ' + accesstoken);

            // Construct the request body
            console.log(files)
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify({ name: fileNameWithEnc })], { type: 'application/json' }));
            formData.append('file', blob);

            console.log(formData)
            // Make the POST request
            fetch(OneDriveAPI, {
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
        
        const filenamefordrive = `${name}.zip`
        const filename = 'unencrypted.zip'
        const backendURL = `http://localhost:5000/download_decrypted_zip/${filename}`;
        const OneDriveAPI= `https://api.onedrive.com/v1.0/drive/root:/${filenamefordrive}:/content`;

        // Step 1: Download ZIP file from the backend
        const blob = await fetch(backendURL).then(response => response.blob());
        // Step 2: Upload ZIP file to Google Drive
        console.log(blob)
        const accessToken = await getTokenForRequest();
        console.log(accessToken)
        const headers = new Headers({
            'Authorization': `Bearer: ${accessToken}`,
            'Content-Type': 'application/octet-stream', // Set content type to binary
        });
        console.log(headers)
        const formData = new FormData();
        const fileNameOnDrive = `${name}.zip`;

        formData.append('metadata', new Blob([JSON.stringify({ name: fileNameOnDrive })], { type: 'application/json' }));
        formData.append('file', blob, fileNameOnDrive);

        try {
            const response = await fetch(OneDriveAPI, {
                method: 'PUT',
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
document.getElementById('decryptButton').addEventListener('click', uploadFilez);