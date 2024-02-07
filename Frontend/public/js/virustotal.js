import { get_cookie } from "./cookie.js";

export const selectedFiles = {
    files: []
};

export const seen = new Set();
let totalUploadedSizeBytes = 0;

export async function sendFileToBackend(file) {
    const maxFileSizeBytes = 1 * 1024 * 1024 * 1024; // 1 GB in bytes

    if (file.size > maxFileSizeBytes) {
        alert('File size is too large. Maximum allowed size is 1 GB.');
        return;
    }

    if (totalUploadedSizeBytes + file.size > maxFileSizeBytes) {
        alert('Total file size exceeds the limit. Maximum allowed size is 1 GB.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const fileNameParts = file.name.split('.');
    const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : '';
    const fileNameWithoutExtension = fileNameParts.join('');
    console.log(fileNameWithoutExtension);
    console.log("Selected files:", selectedFiles)

    const scanLoader = document.getElementById('scan-loader');
    scanLoader.style.display = 'block';

    try {
        const scanResult = await performScan(formData);

        if (scanResult.isValid) {
            console.log('Selected Files:', selectedFiles.files)
            selectedFiles.files.push(file);
            if (seen.has(fileNameWithoutExtension)) {
                alert('Duplicate file name');
                return;
            }

            seen.add(fileNameWithoutExtension);
            console.log(`Scan result for ${file.name}: Non-malicious. Proceeding with upload`);
            displayFileDetails(file, formData);

            // Update the totalUploadedSizeBytes counter
            totalUploadedSizeBytes += file.size;
        } else {
            console.warn(`Scan result for ${file.name}: Malicious. Upload denied`);

            setTimeout(() => {
                alert(`File ${file.name} is malicious. Upload denied.`);
            }, 500);
        }
    } catch (error) {
        console.error(`Error during scan for ${file.name}:`, error);
    } finally {
        scanLoader.style.display = 'none';
    }
}


async function performScan(formData) {
    const jwtToken =  await get_cookie()
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

function displayFileDetails(file, formData, index) {
    const fileDetailsContainer = document.getElementById('file-details-container');

    // Create a div element for each file
    const fileContainer = document.createElement('div');
    fileContainer.classList.add('file-entry-container'); // Add a container class
    fileDetailsContainer.appendChild(fileContainer);

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
        // Use the index or unique identifier to remove the file from the array
        const fileNameParts = file.name.split('.');
        const fileExtension = fileNameParts.length > 1 ? fileNameParts.pop() : '';
        const fileNameWithoutExtension = fileNameParts.join('');

        console.log(fileNameWithoutExtension)

        // Find the index of the file to be removed
        const indexToRemove = selectedFiles.files.findIndex(f => f === file);
        if (indexToRemove !== -1) {
            // Splice the file from the array
            let toremove =selectedFiles.files.splice(indexToRemove, 1);
            console.log("Seen?:", seen)
            
            seen.delete(fileNameWithoutExtension)
            console.log("Seen?:", seen)
            // Remove the file container from the details container
            fileDetailsContainer.removeChild(fileContainer);
        }
        // You can also perform additional logic or updates here
    });
    fileContainer.appendChild(removeButton);

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
