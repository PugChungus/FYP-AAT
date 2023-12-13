// keymanagement.js

// Function to open the key card
function openKeyCard() {
    document.getElementById('keyCard').style.display = 'block';
}

// Function to close the key card
function closeKeyCard() {
    document.getElementById('keyCard').style.display = 'none';
}

// Function to generate a new key entry
function generateKey() {
    // Get the input value for Key Name
    var keyName = document.getElementById('keyName').value;

    // Check if the Key Name is not empty
    if (keyName.trim() !== '') {
        // Get the container for the key entries
        var keyEntriesContainer = document.querySelector('.responsive-table');

        // Get the latest ID in the table
        var latestId = 1; // Default to 1 if no entries are present
        var lastKeyEntry = keyEntriesContainer.querySelector('.table-row:last-child');
        if (lastKeyEntry) {
            latestId = parseInt(lastKeyEntry.querySelector('.col-1').textContent) + 1;
        }

        // Create a new list item for the key entry
        var newKeyEntry = document.createElement('li');
        newKeyEntry.className = 'table-row';

        // Create div elements for Id, Key Name, Date Created, Download, and Delete
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
        col4.className = 'col col-4';
        var downloadLink = document.createElement('a');
        downloadLink.href = '#'; // Placeholder link
        downloadLink.addEventListener('click', function (event) {
            // Prevent the default behavior of the link
            event.preventDefault();
            // Implement download functionality here
            alert('Download functionality will be implemented here.');
        });
        var downloadIcon = document.createElement('i');
        downloadIcon.className = 'bx bxs-download';
        downloadLink.appendChild(downloadIcon);
        col4.appendChild(downloadLink);

        var col5 = document.createElement('div');
        col5.className = 'col col-5';
        var deleteIcon = document.createElement('i');
        deleteIcon.className = "bx bxs-x-circle"; // Corrected variable name
        deleteIcon.href = '#'; // Placeholder link
        deleteIcon.addEventListener('click', function (event) {
            // Prevent the default behavior of the link
            event.preventDefault();
            // Implement delete functionality here
            newKeyEntry.remove();
        });
        col5.appendChild(deleteIcon);

        // Append the div elements to the new key entry
        newKeyEntry.appendChild(col1);
        newKeyEntry.appendChild(col2);
        newKeyEntry.appendChild(col3);
        newKeyEntry.appendChild(col4);
        newKeyEntry.appendChild(col5);

        // Append the new key entry to the container
        keyEntriesContainer.appendChild(newKeyEntry);

        // Close the key card after generating the key
        closeKeyCard();
    } else {
        alert('Please enter a Key Name.');
    }
}

// Function to get the current date and time in the required format
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

// Add an event listener to the "Generate Key" link
document.getElementById('generateKeyButton').addEventListener('click', function (event) {
    // Prevent the default behavior of the link
    event.preventDefault();
    // Open the key card when the link is clicked
    openKeyCard();
});
