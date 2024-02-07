import { get_cookie } from "./cookie.js";
import { createKeyDropdown } from "./key.js";
import { sendFileToBackend, selectedFiles, seen } from "./virustotal.js";
import { showModal, showModalMul } from "./share_file.js";
import {getGoogleToken } from './googlepicker.js';
import { getTokenForRequest } from "./onedrivepicker.js";

export const keyDropdown = document.getElementById('key-dropdown');
export let selectedKey = keyDropdown.value;



createKeyDropdown()

document.getElementById('file-input-encrypt').addEventListener('change', handleFileUpload);

let existingFileEntries;

export function handleFileUpload(event) {
    existingFileEntries = new Set();
    const newFiles = event.target.files;
    console.log("NewFiles:", newFiles)
    console.log('ExistingFilesEntries:', existingFileEntries)
    selectedKey = keyDropdown.value;

    // Loop through each dropped file
    for (const file of newFiles) {
        // Check if the file already exists in the set
        if (!existingFileEntries.has(file.name)) {
            // If not, send it to the backend and add to the set
            sendFileToBackend(file);
            existingFileEntries.add(file.name);
        } else {
            // If exists, you may want to handle it (skip or show a message)
            console.log('existingFIles or whatever', existingFileEntries)
            console.log('newfiles or whatever', newFiles)

            alert(`File ${file.name} already exists. Skipping...`);
        }
    }

    existingFileEntries.forEach(entry => {
        if (!Array.from(newFiles).find(file => file.name === entry)) {
            existingFileEntries.delete(entry);
        }
    });
}

export function handleDrop(event) {
    event.preventDefault();

    const files = event.dataTransfer.files;

    // Loop through each dropped file
    for (const file of files) {
           // Check if the file already exists in the set
           if (!existingFileEntries.has(file.name)) {
            // If not, send it to the backend and add to the set
            sendFileToBackend(file);
            existingFileEntries.add(file.name);
        } else {
            // If exists, you may want to handle it (skip or show a message
            console.log('existingFIles or whatever', existingFileEntries)
            console.log('newfiles or whatever', newFiles)
            console.log(`File ${file.name} already exists. Skipping...`);
        }
    }
}

export function handleDragOver(event) {
    event.preventDefault();
}


document.getElementById('encryptButton').addEventListener('click', function() {
   uploadFiles();
});

export async function uploadFiles() {
    // Check if there are files to upload
    if (selectedFiles.files.length > 0) {
        await clearEncryptedFolder();
        await sendFilesToBackend();
    } else {
        alert("You have not selected any files")
        return;
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
    console.log("ASDKAMSKDAD", formData)

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
    const jwtToken = await get_cookie()

    try {
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

            console.log("Checking for this bs:", jwtToken)

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
            if (response.status === 400) {
                alert('File size is too large. Maximum allowed size is 1 GB')
            } 

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
            existingFileEntries.clear();
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
        existingFileEntries.clear();
        // If all files are successfully decrypted, hide the drop zone
        hideDropZoneAndFileDetails();
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
}


keyDropdown.addEventListener('change', function () {
    // Update the selected key value
    selectedKey = keyDropdown.value;
});



async function hideDropZoneAndFileDetails() {
    const dropZone = document.querySelector('.drag-zone-container');
    const fileDetails = document.querySelector('.file-details-container');
    const dropZoneEncasement = document.querySelector('.encasement-container');
    const encryptButton = document.getElementById('encryptButton');
    const downloadButton = document.createElement('button');
    const shareButton = document.createElement('button');
    const googleupload = document.createElement('button');
    const onedriveupload = document.createElement('button');

    shareButton.id = 'shareButton';
    shareButton.textContent = 'Share File';

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
                dropZone.style.display = 'block';
                fileDetails.style.display = 'block';
                encryptButton.style.display = 'block';
                dropZoneEncasement.style.display = 'block';
                googleupload.style.display = 'none';
                onedriveupload.style.display = 'none';
                downloadButton.style.display = 'none';
                selectedFiles.files = []
                var div = document.getElementById("file-details-container");
                div.innerHTML = "";
                seen.clear();
            }
        });

        const individualButton = document.createElement('button');
        individualButton.textContent = 'Download Encrypted Files Individually';
        individualButton.addEventListener('click', async () => {
            downloadEncryptedFiles('individual');
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            encryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            googleupload.style.display = 'none';
            onedriveupload.style.display = 'none';
            downloadButton.style.display = 'none';
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

        const shareFiles = document.createElement('button');
        shareFiles.textContent = 'Share Files';
        shareFiles.addEventListener('click', async() => {
            showModalMul();
        })


        // Append buttons to the card div
        cardDiv.appendChild(googlebutton)
        cardDiv.appendChild(onedrivebutton)
        cardDiv.appendChild(zipButton);
        cardDiv.appendChild(individualButton);
        cardDiv.appendChild(individualGoogle);
        cardDiv.appendChild(individualOnedrive);
        cardDiv.appendChild(shareFiles);



        // Append the card div to the document or display it wherever needed
        document.body.appendChild(cardDiv);
    } else {
        // If there is only one file, create a simple download button
        downloadButton.style.display = 'block';
        downloadButton.textContent = 'Download Encrypted File';  // Reuse the existing variable

        shareButton.style.display = 'block';
        shareButton.textContent = 'Share File'; 
        shareButton.onclick = () => showModal();
        
        // Add click event listener to the download button
        downloadButton.addEventListener('click', async () => {
            downloadEncryptedFiles('individual');
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            encryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            googleupload.style.display = 'none';
            onedriveupload.style.display = 'none';
            downloadButton.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
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
        document.body.appendChild(shareButton);
        document.body.appendChild(googleupload);
        document.body.appendChild(onedriveupload);
    }
}


//send files to backend to perform a virus check

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
            headers.append('Authorization', 'Bearer: ' + accesstoken);

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
        headers.append('Authorization', `Bearer: ${accessToken}`);
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

            const blobe = await fetch(backendurl).then(response => response.blob());
            const headers = new Headers();

            
            headers.append('Authorization', 'Bearer: ' + accesstoken);

            // Step 1: Create Upload Session
            const uploadUrl = await createUploadSession(accesstoken, fileNameWithEnc);
            console.log(uploadUrl)
            // Step 2: Upload File to Session
            const uploadResult = await uploadFileToSession(uploadUrl, blobe);

            console.log('Upload result:', uploadResult);

        }



            // Construct the request body
        //     const formData = new FormData();
        //     formData.append('metadata', new Blob([JSON.stringify({ name: fileNameWithEnc })], { type: 'application/json' }));
        //     formData.append('file', blob, fileNameWithEnc);
        //         console.log(accesstoken)
        //     // Make the POST request
        //     fetch(OneDriveAPI, {
        //         method: 'POST',
        //         headers,
        //         body: formData
        //     })
        //     .then(response => response.json())
        //     .then(data => {
        //         console.log('File uploaded successfully:', data);
        //     })
        //     .catch(error => {
        //         console.error('Error uploading file:', error);
        //     });
        // }
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
        headers.append('Authorization', `Bearer: ${accessToken}`);
        console.log(headers)
        const formData = new FormData();
        const fileNameOnDrive = `${name}.zip`;

        formData.append('metadata', new Blob([JSON.stringify({ name: fileNameOnDrive })], { type: 'application/json' }));
        formData.append('file', blob, fileNameOnDrive);

        try {
            const response = await fetch(OneDriveAPI, {
                method: "POST",
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


async function createUploadSession(accesstoken, fileNameWithEnc) {
    
        const url = `https://graph.microsoft.com/v1.0/me/drive/root:/${fileNameWithEnc}:/createUploadSession`;
        const options = {
          method: 'POST',
          headers: {
            'Authorization': accesstoken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            "item": {
              "@microsoft.graph.conflictBehavior": "rename", // or "replace" or "fail"
              "name": fileNameWithEnc
            },
            // Add additional options here if necessary
          })
        };
      
        try {
          const response = await fetch(url, options);
          const data = await response.json();
          return data.uploadUrl;
        } catch (error) {
          console.error('Error creating upload session:', error);
          throw error;
        }
      };



async function uploadFileToSession(uploadUrl, fileBlob) {
    const headers = {
        'Content-Length': `${fileBlob.size}`, // Set the size of the file
        'Content-Range': `bytes 0-${fileBlob.size - 1}/${fileBlob.size}` // The range of bytes you're uploading
    };

    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: headers,
        body: fileBlob // The actual file blob
    });
    return response.json(); // Response from the upload session
}



// OneDrive MSAL Documentation -->https://learn.microsoft.com/en-us/javascript/api/@azure/msal-browser/browsercachemanager?view=msal-js-latest
// Clear the cache containing msal cookies and info ?
// Maybe clears saved info, forcing user to login in again.


