import { get_cookie } from './cookie.js'
import { createKeyDropdown } from "./key.js";
import { sendFileToBackend, selectedFiles } from "./virustotal.js";


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
        
        // Append the download button to the document or display it wherever needed
        document.body.appendChild(downloadButton);
    }
}

function isValidFileExtension(file) {
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
            alert('Decryption Failed. Are you sure you are using the correct key, you previously used to encrypt the file?')
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