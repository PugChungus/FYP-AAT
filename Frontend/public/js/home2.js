// home2.js

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
    counterElement.innerHTML = `Keys ${keyData.length}<i class='bx bx-chevron-right'></i>`;

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
}

// Call the function to initially display keys
document.addEventListener('DOMContentLoaded', updateKeyDisplay);

// Add an event listener to keyDropdown to update display on change
if (keyDropdown) {
    keyDropdown.addEventListener('change', updateKeyDisplay);
}

// Add an event listener to update display when the page is loaded
window.addEventListener('load', updateKeyDisplay);
