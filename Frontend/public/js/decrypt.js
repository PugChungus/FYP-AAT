import { get_cookie } from './cookie.js'
import { createKeyDropdown } from "./key.js";
import { sendFileToBackend, selectedFiles, seen } from "./virustotal.js";
import { getGoogleToken } from './googlepickerdecrypt.js';
import { getTokenForRequest } from './onedrivepickerdecrypt.js';
import { get_email_via_id } from './profile.js';

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

export function handleFilefromDecryptPickers(file){
    // Ensure `files` is always an array to simplify processing
    
    selectedKey = keyDropdown.value; // Assuming this is desired at this point

            // If not, send it to the backend and add to the set
            sendFileToBackend(file);
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
    const downloadContainer = document.querySelector('.download-container');
    const decryptHeader = document.querySelector('.decryptHeader')

    
    dropZone.style.display = 'none';
    fileDetails.style.display = 'none';
    decryptButton.style.display = 'none';
    dropZoneEncasement.style.display = 'none';
    downloadContainer.style.display = 'block'
    downloadContainer.style.display = 'flex'
    const googlebutton = document.getElementById('uploadgoogleButton')
    const onedrivebutton = document.getElementById('UploadToOneDrive')
    const downloadButton = document.getElementById('downloadButton');
    const downloadType = document.querySelector('.downloadType')
    const placeholderIcon = document.getElementById('placeholderIcon')

    if (selectedFiles.files.length >= 2) {
        placeholderIcon.classList.add('bx', 'bxs-file-archive')
        downloadType.textContent = "Download Zip"
        downloadButton.addEventListener('click', async () => {
            const zipFolderName = window.prompt('Enter the name for the zip folder (without extension)');
            if (zipFolderName) {
                downloadDecryptedFiles('zip', zipFolderName);
                dropZone.style.display = 'block';
                fileDetails.style.display = 'block';
                decryptButton.style.display = 'block';
                dropZoneEncasement.style.display = 'block';
                googlebutton.style.display = 'none';
                onedrivebutton.style.display = 'none';
                downloadButton.style.display = 'none';
                selectedFiles.files = []
                var div = document.getElementById("file-details-container");
                div.innerHTML = "";
                seen.clear();
                decryptHeader.style.display = 'block'
                downloadContainer.style.display = 'none';
            }

        });
         // Create Google Button
         googlebutton.addEventListener('click', async () => {
             const googleFolderName = window.prompt('Enter the name for the zip folder (without extension)');
             if (googleFolderName) {
                 uploadtoGoogle('zip', googleFolderName);
                 dropZone.style.display = 'block';
                fileDetails.style.display = 'block';
                decryptButton.style.display = 'block';
                dropZoneEncasement.style.display = 'block';
                googlebutton.style.display = 'none';
                onedrivebutton.style.display = 'none';
                downloadButton.style.display = 'none';
                selectedFiles.files = []
                var div = document.getElementById("file-details-container");
                div.innerHTML = "";
                seen.clear();
                decryptHeader.style.display = 'block'
                downloadContainer.style.display = 'none';
             }
         })
         //Create One Drive
         onedrivebutton.addEventListener('click', async () => {
             const onedriveFolderName = window.prompt('Enter the name for the zip folder (without extension)');
             if (onedriveFolderName) {
                 uploadtoOneDrive('zip', onedriveFolderName);
                 dropZone.style.display = 'block';
                fileDetails.style.display = 'block';
                decryptButton.style.display = 'block';
                dropZoneEncasement.style.display = 'block';
                googlebutton.style.display = 'none';
                onedrivebutton.style.display = 'none';
                downloadButton.style.display = 'none';
                selectedFiles.files = []
                var div = document.getElementById("file-details-container");
                div.innerHTML = "";
                seen.clear();
                decryptHeader.style.display = 'block'
                downloadContainer.style.display = 'none';
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
            googlebutton.style.display = 'none';
            onedrivebutton.style.display = 'none';
            downloadButton.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
            decryptHeader.style.display = 'block'
            downloadContainer.style.display = 'none';
        });
        const individualGoogle = document.createElement('button');
        individualGoogle.textContent = 'Upload Files To Google Individually';
        individualGoogle.addEventListener('click', async () => {
            uploadtoGoogle('individual');
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            decryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            googlebutton.style.display = 'none';
            onedrivebutton.style.display = 'none';
            downloadButton.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
            downloadContainer.style.display = 'none'
            decryptHeader.style.display = 'block'
            downloadContainer.style.display = 'none';
        });

        const individualOnedrive = document.createElement('button');
        individualOnedrive.textContent = 'Upload Files To OneDrive Individually';
        individualOnedrive.addEventListener('click', async () => {
            uploadtoOneDrive('individual');
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            decryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            googlebutton.style.display = 'none';
            onedrivebutton.style.display = 'none';
            downloadButton.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
            downloadContainer.style.display = 'none'
            decryptHeader.style.display = 'block'
        });


    } else {
        // If there is only one file, create a simple download button
        downloadButton.style.display = 'block';
        placeholderIcon.classList.add('bx', 'bx-file-blank')
        downloadType.textContent = 'Download Encrypted File';  // Reuse the existing variable

        // Add click event listener to the download button
        downloadButton.addEventListener('click', async () => {
            downloadDecryptedFiles('individual', decryptedExtension);
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            decryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            googlebutton.style.display = 'none';
            onedrivebutton.style.display = 'none';
            downloadButton.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
            downloadContainer.style.display = 'none'
            decryptHeader.style.display = 'block'
            downloadContainer.style.display = 'none';
        });
        // If there is only one file, create a simple download button
        googlebutton.style.display = 'block';
        
        // Add click event listener to the download button
        googlebutton.addEventListener('click', async () => {
            uploadtoGoogle('individual', decryptedExtension);
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            decryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            googlebutton.style.display = 'none';
            onedrivebutton.style.display = 'none';
            downloadButton.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
            downloadContainer.style.display = 'none'
            decryptHeader.style.display = 'block'
            downloadContainer.style.display = 'none';
        });

        // If there is only one file, create a simple download button
        onedrivebutton.style.display = 'block';
        
        // Add click event listener to the download button
        onedrivebutton.addEventListener('click', async () => {
            uploadtoOneDrive('individual', decryptedExtension);
            dropZone.style.display = 'block';
            fileDetails.style.display = 'block';
            decryptButton.style.display = 'block';
            dropZoneEncasement.style.display = 'block';
            googlebutton.style.display = 'none';
            onedrivebutton.style.display = 'none';
            downloadButton.style.display = 'none';
            selectedFiles.files = []
            var div = document.getElementById("file-details-container");
            div.innerHTML = "";
            seen.clear();
            downloadContainer.style.display = 'none'
            decryptHeader.style.display = 'block'
            downloadContainer.style.display = 'none';
        });
        
        // Append the download button to the document or display it wherever needed

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
        const email =  await get_email_via_id()
        const jwtToken = await get_cookie()
        const clearResponse = await fetch(`http://localhost:5000/clear_decrypted_folder/${email}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer: ${jwtToken}`
            },

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
    const email = await get_email_via_id()  
    formData.append('emailuser', email)
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
            formData2.append('type', 'Decryption')
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
            const jwtToken = await get_cookie()
            let fileNameWithEnc = `${fileNameWithoutExtension}.${decryptedExtension}`;
            const email = await get_email_via_id()
            const response = await fetch(`http://localhost:5000/download_single_decrypted_file/${fileNameWithEnc}/${email}`,{
                method : 'GET',
                headers: {
                    'Authorization': `Bearer: ${jwtToken}`
                },

            });
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
        const email = await get_email_via_id()
        const jwtToken = await get_cookie()
        const response = await fetch(`http://localhost:5000/download_decrypted_zip/${filename}/${email}`,{
            method : 'GET',
            headers : {
                'Authorization': `Bearer: ${jwtToken}`
            },
        });
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
            const email = await get_email_via_id()
            const jwtToken = await get_cookie()
            
            const backendurl = `http://localhost:5000/download_single_decrypted_file/${fileNameWithEnc}/${email}`

            const response = await fetch(`http://localhost:5000/download_single_decrypted_file/${fileNameWithEnc}/${email}`,{
                method : 'GET',
                headers: {
                    'Authorization': `Bearer: ${jwtToken}`
                },

            });
            const blob = response.blob()
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
        
        const jwtToken = await get_cookie()
        const email = await get_email_via_id()

        // Step 1: Download ZIP file from the backend
        const response = await fetch(`http://localhost:5000/download_decrypted_zip/${filename}/${email}`,{
            method : 'GET',
            headers : {
                'Authorization': `Bearer: ${jwtToken}`
            },
        });
        const blob = await response.blob();
        
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

            const jwtToken = await get_cookie()
            const email = await get_email_via_id()
            const OneDriveAPI = `https://api.onedrive.com/v1.0/drive/root:/${fileNameWithEnc}:/content`;
            const backendurl = `http://localhost:5000/download_single_decrypted_file/${fileNameWithEnc}/${email}`

            const response = await fetch(`http://localhost:5000/download_single_decrypted_file/${fileNameWithEnc}/${email}`,{
                method : 'GET',
                headers: {
                    'Authorization': `Bearer: ${jwtToken}`
                },

            });
            const blobe = response.blob()
            const headers = new Headers();
            headers.append('Authorization', 'Bearer: ' + accesstoken);

            // Step 1: Create Upload Session
            const uploadUrl = await createUploadSession(accesstoken, fileNameWithEnc);
            console.log(uploadUrl)
            // Step 2: Upload File to Session
            const uploadResult = await uploadFileInChunks(uploadUrl, blobe);

            console.log('Upload result:', uploadResult);
        }
    } else {
        
        const filenamefordrive = `${name}.zip`
        const filename = 'unencrypted.zip'
        const email = await get_email_via_id()
        const jwtToken = await get_cookie()
        const OneDriveAPI= `https://api.onedrive.com/v1.0/drive/root:/${filenamefordrive}:/content`;

        // Step 1: Download ZIP file from the backend
        const response = await fetch(`http://localhost:5000/download_decrypted_zip/${filename}/${email}`,{
            method : 'GET',
            headers : {
                'Authorization': `Bearer: ${jwtToken}`
            },
        });
        const blob = await response.blob();
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




async function uploadFileInChunks(uploadUrl, fileBlob) {
const CHUNK_SIZE = 25 * 1024 * 1024; // 320 KiB in bytes
const fileSize = fileBlob.size;
let start = 0;

while (start < fileSize) {
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    const chunk = fileBlob.slice(start, end); // Create a slice of the file for this chunk
    const contentRange = `bytes ${start}-${end - 1}/${fileSize}`;

    const headers = {
        'Content-Length': `${chunk.size}`,
        'Content-Range': contentRange
    };

    // Attempt to upload the chunk
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: headers,
        body: chunk
    });

    if (!response.ok) {
        // Handle errors or retry as necessary
        throw new Error('Failed to upload chunk');
    }

    // Prepare for the next chunk
    start = end;
}

// Optionally, handle the final response or confirmation as needed
return { success: true, message: 'File uploaded in chunks successfully' };
}

}
document.getElementById('decryptButton').addEventListener('click', uploadFilez);