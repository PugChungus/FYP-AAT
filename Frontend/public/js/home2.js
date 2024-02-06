// home2.js
import { get_cookie } from "./cookie.js"; 
import { keyDropdown, getAllKeyData, createKeyDropdown } from "./key.js";

function updateKeyDisplay() {
    const keydiv = document.querySelector('.keydiv');

    // Check if keydiv exists
    if (!keydiv) {
        console.error("Element with class 'keydiv' not found.");
        return;
    }

    const counterElement = keydiv.querySelector('.keyheader');

    // Get all key data
    const keyData = getAllKeyData();

    // Update the counter
    counterElement.innerHTML = `Keys (${keyData.length})<i class='bx bx-chevron-right'></i>`;

    // Check if there are keys available
    if (keyData.length > 0) {
        // Create a button to toggle the display of keys
        const expandButton = document.createElement('button');
        expandButton.textContent = 'Expand to view all keys';
        let expanded = false;

        expandButton.addEventListener('click', () => {
            expanded = !expanded;

            // Toggle between showing and hiding all keys
            if (expanded) {
                // Display all keys
                const keyList = document.createElement('div');
                keyList.classList.add('listkeys');
                keyData.forEach((data) => {
                    const listItem = document.createElement('div');
                    listItem.textContent = data.keyName;
                    keyList.appendChild(listItem);
                });

                // Replace the content of keydiv with the updated list
                keydiv.innerHTML = '';
                keydiv.appendChild(counterElement);
                keydiv.appendChild(keyList);
            } else {
                // Display only the header and the button
                keydiv.innerHTML = '';
                keydiv.appendChild(counterElement);
                keydiv.appendChild(expandButton);
            }

            // Update the button text
            expandButton.textContent = expanded ? 'Collapse keys' : 'View all Keys';
        });

        // Replace the content of keydiv with the initial state (header and button)
        keydiv.innerHTML = '';
        keydiv.appendChild(counterElement);
        keydiv.appendChild(expandButton);
    } else {
        // No keys available, only display the counter
        keydiv.innerHTML = '';
        keydiv.appendChild(counterElement);
    }
}

let id;

async function updateHistory() {
    const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
        method: 'POST'
    });

    const data = await newResponse.json(); // await here
    id = data['id_username']['id'];
      
    const formData = new FormData();
    formData.append('id', id);
  
    try {
      const jwtToken = await get_cookie()

      const response = await fetch('http://localhost:5000/display_history', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer: ${jwtToken}`
        },
        body: formData,
      });
  
      if (response.ok) {
        const historyData = await response.json();
        const historyheader = document.querySelector('.historyheader');
        const recentHistoryContainer = document.getElementById('recentHistory');
        const historyCounter = document.getElementById('historyCounter');
        historyCounter.textContent = historyData.length
       
        for (let i = 0; i < historyData.length; i++) {
          const row = historyData[i];
          console.log(`Row ${i + 1}:`, row);
          console.log("Deez nuts", row['type'])
          const historyElement = document.createElement('div');
            historyElement.classList.add('recent-history');
            historyElement.textContent = row['type'];
            recentHistoryContainer.appendChild(historyElement);
        }

        if (recentHistoryContainer.children.length >= 5) {
            // Apply a specific style to make the sharedEmailContainer scrollable
            recentHistoryContainer.style.overflowY = 'auto';
            recentHistoryContainer.style.maxHeight = '190px'; // Adjust the max height as needed
        }
    }
} catch (error) {
    console.error(error)

}
}

async function updateFileInbox() {
    const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
      method: 'POST',
    });
  
    const data1 = await newResponse.json(); // await here
    const id = data1['id_username']['id'];
  
    const formData = new FormData();
    formData.append('id', id);
    const jwtToken = await get_cookie();
  
    const response = await fetch('http://localhost:3000/get_shared_files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer: ${jwtToken}`,
       },
      body: formData,
    });
  
    const data = await response.json();
  
    var tables = data['file_rows'][0];
    const fileinboxheader = document.querySelector('.fileinboxheader');
    const sharedEmailContainer = document.getElementById('recentSenders');
    const fileInboxCounter = document.getElementById('fileInboxCounter');

    // Update the fileInboxCounter with the length of tables
    fileInboxCounter.textContent = tables.length;

    const uniqueSenders = new Set()

    for (let i = 0; i < tables.length; i++) {
        var shared_email = tables[i]['shared_by_email'];

        // Append shared_email with a line break to the sharedEmailContainer
        if (!uniqueSenders.has(shared_email)) {
            // Append shared_email with a line break to the sharedEmailContainer
            const sharedEmailElement = document.createElement('div');
            sharedEmailElement.classList.add('shared-email');
            sharedEmailElement.textContent = shared_email;
            sharedEmailContainer.appendChild(sharedEmailElement);

            // Add the sender to the Set
            uniqueSenders.add(shared_email);
        }
    }

    // Check if the number of shared-email elements is greater than or equal to 5
    if (sharedEmailContainer.children.length >= 5) {
        // Apply a specific style to make the sharedEmailContainer scrollable
        sharedEmailContainer.style.overflowY = 'auto';
        sharedEmailContainer.style.maxHeight = '100px'; // Adjust the max height as needed
    }
}



// Call the function to initially display keys
document.addEventListener('DOMContentLoaded', updateKeyDisplay);
document.addEventListener('DOMContentLoaded', updateHistory)
document.addEventListener('DOMContentLoaded', updateFileInbox);


// Add an event listener to keyDropdown to update display on change
if (keyDropdown) {
    keyDropdown.addEventListener('change', updateKeyDisplay);
}

// Add an event listener to update display when the page is loaded
window.addEventListener('load', updateKeyDisplay);

document.querySelector('.keyheader').addEventListener('click', function() {
    window.location.href = '/keymanagement'
})

document.querySelector('.historyheader').addEventListener('click', function() {
    window.location.href = '/history'
})

document.querySelector('.fileinboxheader').addEventListener('click', function() {
    window.location.href = '/fileInbox'
})


