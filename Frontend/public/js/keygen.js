import { get_cookie } from "./cookie.js";

function openKeyCard() {
    document.getElementById('keyCard').style.display = 'block';
}

export function closeKeyCard() {
    document.getElementById('keyCard').style.display = 'none';
}

function isValidKeyName(keyName) {
    // Use a regex pattern to match only alphanumeric characters and underscores
    const pattern = /^[a-zA-Z0-9_]+$/;
    return pattern.test(keyName);
}

export function generateKey() {
    var keyName = document.getElementById('keyName').value;

    if (isValidKeyName(keyName)) {
        fetch('http://localhost:5000/aes_keygen', {
            method: 'GET',
        })
        .then(response => response.json())
        .then(data => {
            if (data.key) {
                const hexKey = data.key;  

                const existingKeyData = sessionStorage.getItem(`key_${keyName}`);
                if (existingKeyData) {
                    // Key with the same name already exists, handle the duplicate keyName
                    alert('Duplicate key name. Please choose a different name.');
                } else {
                    // KeyName doesn't exist, proceed to add the new key
                    sessionStorage.setItem(`key_${keyName}`, JSON.stringify({
                        keyName: keyName,
                        uploadTime: getCurrentDateTime(),
                        keyValue: hexKey,
                    }));

                    // Create the key entry using the new function
                    createKeyEntry(keyName, getCurrentDateTime(), hexKey);
                }

                alert('Key generated successfully: ', data.key);
            } else {
                console.error('Key not found in the response: ', data);
            }
        })
        .catch(error => {
            console.error('Error generating key: ', error);
        });

        closeKeyCard();
    } else {
        alert('Invalid key name. Please use only alphanumeric characters and underscores.');
    }
}

function downloadKey(key, keyName) {
    // Create a Blob with the key
    const blob = new Blob([key], { type: 'application/octet-stream' });

    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = keyName + '.pkl';  // Change the file extension or name as needed

    // Append the download link to the document body
    document.body.appendChild(downloadLink);

    // Trigger a click on the download link
    downloadLink.click();

    // Remove the download link from the document body
    document.body.removeChild(downloadLink);
}

function triggerFileInputClick() {
    document.getElementById('fileInput').click()
}

async function importKey() {
    const fileInput = document.getElementById('fileInput');
    
    if (fileInput.files.length == 1) {
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        const jwtToken = await get_cookie()

        const response = await fetch('http://localhost:5000/check_key', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer: ${jwtToken}`
            },
            body: formData,
        });

        if (response.ok) {
            const responseData = await response.json();
            const decodedKeyContentHex = atob(responseData.keyContent);

            const fileNameWithoutExtension = responseData.fileName.split('.')[0];

            const existingKeyData = sessionStorage.getItem(`key_${fileNameWithoutExtension}`);

            if (existingKeyData) {
                // Key with the same name already exists, handle the duplicate keyName
                alert('Duplicate key name. Please choose a different name.');
            } else {
                sessionStorage.setItem(`key_${fileNameWithoutExtension}`, JSON.stringify({
                    keyName: fileNameWithoutExtension,
                    uploadTime: getCurrentDateTime(),
                    keyValue: decodedKeyContentHex,
                }));

                createKeyEntry(fileNameWithoutExtension, getCurrentDateTime(), decodedKeyContentHex );
            }

        } else {
            alert("Invalid Key");
        }
    } else {
        alert("Please upload 1 key at a time.");
    }
}

document.getElementById('importKey').addEventListener('click', function (event) {
    event.preventDefault();
    triggerFileInputClick();
});

// Update the event listener for the file input to call importKey
document.getElementById('fileInput').addEventListener('change', importKey);

function getAllKeyNames() {
    const keyNames = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        // Check if the key starts with 'key_' to identify your keys
        if (key.startsWith('key_')) {
            keyNames.push(key.substring(4)); // Extract the fileNameWithoutExtension part
        }
    }
    return keyNames;
}

function createKeyDropdown() {
    // Get all key names from sessionStorage
    const keyNames = getAllKeyNames();

    // Sort keys by upload time
    keyNames.sort((keyNameA, keyNameB) => {
        const keyDataA = JSON.parse(sessionStorage.getItem(`key_${keyNameA}`));
        const keyDataB = JSON.parse(sessionStorage.getItem(`key_${keyNameB}`));
        
        // Convert timestamp strings to Date objects for comparison
        const timeA = new Date(keyDataA.uploadTime);
        const timeB = new Date(keyDataB.uploadTime);

        // Compare upload times for sorting
        return timeA - timeB;
    });

    // Add each key name as an option in the dropdown
    keyNames.forEach((keyName, index) => {
        const keyData = JSON.parse(sessionStorage.getItem(`key_${keyName}`));
        createKeyEntry(keyData.keyName, keyData.uploadTime, keyData.keyValue);
    });
}

function createKeyEntry(keyName, dateTime, keyContent) {
    const keyEntriesContainer = document.querySelector('.responsive-table');
    const latestId = keyEntriesContainer.querySelectorAll('.table-row').length + 1;

    const newKeyEntry = document.createElement('li');
    newKeyEntry.className = 'table-row';

    const col1 = document.createElement('div');
    col1.className = 'col col-1';
    col1.textContent = latestId;

    const col2 = document.createElement('div');
    col2.className = 'col col-2';
    col2.textContent = keyName;

    const col3 = document.createElement('div');
    col3.className = 'col col-3';
    col3.textContent = dateTime;

    const col4 = document.createElement('div');
    col4.className = 'col col-4 col-right';

    // Create the download icon
    const downloadLink = document.createElement('a');
    downloadLink.href = '#';
    downloadLink.addEventListener('click', function (event) {
        event.preventDefault();
        downloadKey(keyContent, keyName);
    });

    const downloadIcon = document.createElement('i');
    downloadIcon.className = 'bx bxs-download';
    downloadLink.appendChild(downloadIcon);
    col4.appendChild(downloadLink);

    const spacer = document.createElement('span');
    spacer.className = 'icon-spacer';
    col4.appendChild(spacer);

    // Create the delete icon
    const deleteIcon = document.createElement('i');
    deleteIcon.className = "bx bxs-x-circle";
    deleteIcon.href = '#';
    deleteIcon.addEventListener('click', function (event) {
        event.preventDefault();

        // Remove the key from sessionStorage
        sessionStorage.removeItem(`key_${keyName}`);

        // Remove the key entry from the UI
        newKeyEntry.remove();

        updateKeyEntryIds();
    });
    col4.appendChild(deleteIcon);

    newKeyEntry.appendChild(col1);
    newKeyEntry.appendChild(col2);
    newKeyEntry.appendChild(col3);
    newKeyEntry.appendChild(col4);

    keyEntriesContainer.appendChild(newKeyEntry);
}

function updateKeyEntryIds() {
    const keyEntries = document.querySelectorAll('.table-row');
    keyEntries.forEach((entry, index) => {
        entry.querySelector('.col-1').textContent = index + 1;
    });
}

function getCurrentDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');
    var seconds = String(now.getSeconds()).padStart(2, '0');

    var formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    return formattedDateTime;
}


document.getElementById('generateKeyButton').addEventListener('click', function (event) {
    event.preventDefault();
    openKeyCard();
});
