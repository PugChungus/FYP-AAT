function openKeyCard() {
    document.getElementById('keyCard').style.display = 'block';
}

function closeKeyCard() {
    document.getElementById('keyCard').style.display = 'none';
}

function generateKey() {

    var keyName = document.getElementById('keyName').value;

    if (keyName.trim() !== '') {

        var keyEntriesContainer = document.querySelector('.responsive-table');

        var latestId = 1; 
        var lastKeyEntry = keyEntriesContainer.querySelector('.table-row:last-child');
        if (lastKeyEntry) {
            latestId = parseInt(lastKeyEntry.querySelector('.col-1').textContent) + 1;
        }

        var newKeyEntry = document.createElement('li');
        newKeyEntry.className = 'table-row';

        var col1 = document.createElement('div');
        col1.className = 'col col-1';
        col1.textContent = latestId;

        var col2 = document.createElement('div');
        col2.className = 'col col-2';
        col2.textContent = keyName;

        var col3 = document.createElement('div');
        col3.className = 'col col-3';
        col3.textContent = getCurrentDateTime();

        var col4 = document.createElement('div');
        col4.className = 'col col-4 col-right';

        // Create the download icon
        var downloadLink = document.createElement('i');
        downloadLink.href = '#';
        downloadLink.addEventListener('click', function (event) {

            event.preventDefault();
            fetch('http://localhost:5000/aes_keygen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ keyName: keyName }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.key) {
                    const binaryString = atob(data.key);
                
                    // Convert the binary string to a Uint8Array
                    const uint8Array = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; ++i) {
                        uint8Array[i] = binaryString.charCodeAt(i);
                    }

                    sessionStorage.setItem(`key_${keyName}`, uint8Array);
                
                    // Trigger the download with the Uint8Array
                    downloadKey(uint8Array, keyName);
                } else {
                    console.error('Key not found in the response: ', data);
                }
            })
            .catch(error => {
                console.error('Error generating key: ', error);
            });
        });
            
        var downloadIcon = document.createElement('i');
        downloadIcon.className = 'bx bxs-download';
        downloadLink.appendChild(downloadIcon);
        col4.appendChild(downloadLink);

        var spacer = document.createElement('span');
        spacer.className = 'icon-spacer';
        col4.appendChild(spacer);

        // Create the delete icon
        var deleteIcon = document.createElement('i');
        deleteIcon.className = "bx bxs-x-circle"; 
        deleteIcon.href = '#'; 
        deleteIcon.addEventListener('click', function (event) {

            event.preventDefault();

            newKeyEntry.remove();
        });
        col4.appendChild(deleteIcon);

        newKeyEntry.appendChild(col1);
        newKeyEntry.appendChild(col2);
        newKeyEntry.appendChild(col3);
        newKeyEntry.appendChild(col4);

        keyEntriesContainer.appendChild(newKeyEntry);

        fetch('http://localhost:5000/aes_keygen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ keyName: keyName}),
        })
        .then(response => response.json())
        .then(data => {
            if(data.key) {
                alert('Key generated successfully: ', data.key);
            }else{
                console.error('Key not found in the response: ', data)
            }
        })
        .catch(error => {
            console.error('Error generating key: ', error)
        });

        closeKeyCard();
    } else {
        alert('Please enter a Key Name.');
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

document.getElementById('uploadButton').addEventListener('click', importKey);

async function importKey() {
    const fileInput = document.getElementById('fileInput');
    
    if (fileInput.files.length == 1) {
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:5000/check_key', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const responseData = await response.json();
            const decodedKeyContent = atob(responseData.keyContent);

            // Now, `decodedKeyContent` is a string of characters. Convert it to a Uint8Array.
            const uint8Array = new Uint8Array(decodedKeyContent.length);
            for (let i = 0; i < decodedKeyContent.length; ++i) {
                uint8Array[i] = decodedKeyContent.charCodeAt(i);
            }

            const fileNameWithoutExtension = responseData.fileName.split('.')[0];

            sessionStorage.setItem(`key_${fileNameWithoutExtension}`, uint8Array);

            createKeyEntry(fileNameWithoutExtension, getCurrentDateTime(), uint8Array);

        } else {
            alert("Invalid Key");
        }
    } else {
        alert("Please upload 1 key at a time.");
    }
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
        newKeyEntry.remove();
    });
    col4.appendChild(deleteIcon);

    newKeyEntry.appendChild(col1);
    newKeyEntry.appendChild(col2);
    newKeyEntry.appendChild(col3);
    newKeyEntry.appendChild(col4);

    keyEntriesContainer.appendChild(newKeyEntry);
}

function getCurrentDateTime() {
    var now = new Date();
    var year = now.getFullYear();
    var month = String(now.getMonth() + 1).padStart(2, '0');
    var day = String(now.getDate()).padStart(2, '0');
    var hours = String(now.getHours()).padStart(2, '0');
    var minutes = String(now.getMinutes()).padStart(2, '0');

    var formattedDateTime = `${year}-${day}-${month}-T${hours}${minutes}`;
    return formattedDateTime;
}

document.getElementById('generateKeyButton').addEventListener('click', function (event) {
    event.preventDefault();
    openKeyCard();
});
