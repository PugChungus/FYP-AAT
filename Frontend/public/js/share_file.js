const selectedUsers = [];

async function executeSQLQuery(userInput) {
    const formData = new FormData();
    formData.append('search', userInput);

    try {
        const response = await fetch('http://localhost:3000/search_users', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const tables = await response.json();
            const dropdown = document.getElementById('userDropdown');

            dropdown.innerHTML = '';

            for (const user of tables.result) {
                const username = user.username;
                const pfpBuffer = user.profile_picture;
                const email = user.email_address;

                let objectURL;

                if (pfpBuffer !== null) {
                    const dataArray = pfpBuffer.data;
                    const uint8Array = new Uint8Array(dataArray);
                    const blob = new Blob([uint8Array]);
                    objectURL = URL.createObjectURL(blob);
                } else {
                    objectURL = "../images/account_circle_FILL0_wght200_GRAD200_opsz24.png";
                }

                const imgElement = document.createElement('img');
                imgElement.src = objectURL;
                imgElement.classList.add('user-avatar'); // Add a class for styling if needed

                const usernameElement = document.createElement('span');
                usernameElement.textContent = username;

                const dropdownItem = document.createElement('div');
                dropdownItem.classList.add('dropdown-item');
                dropdownItem.appendChild(imgElement);
                dropdownItem.appendChild(usernameElement);

                const selectButton = document.createElement('button');
                selectButton.textContent = 'Select';
                selectButton.addEventListener('click', () => {
                    // Create a new div for the selected user
                    if (selectedUsers.includes(email)) {
                        alert('This user is already selected.');
                    }
                    else {
                        selectedUsers.push(email);

                        const selectedUserDiv = document.createElement('div');
                        selectedUserDiv.classList.add('selected-user');
    
                        // Add an h3 header
                        const header = document.createElement('h3');
                        header.textContent = 'Selected user';
    
                        // Add the selected username
                        const selectedUsername = document.createElement('span');
                        selectedUsername.textContent = username;
    
                        // Add a close button
                        const closeButton = document.createElement('button');
                        closeButton.textContent = 'X';
                        closeButton.addEventListener('click', () => {
                            // Remove the selected user when the close button is clicked
                            selectedUserDiv.remove();
                            
                            const index = selectedUsers.indexOf(email);
                            if (index !== -1) {
                                selectedUsers.splice(index, 1);
                            }
                        });
    
                        // Append elements to the selectedUserDiv
                        selectedUserDiv.appendChild(header);
                        selectedUserDiv.appendChild(selectedUsername);
                        selectedUserDiv.appendChild(closeButton);
    
                        // Append the selectedUserDiv to the modal
                        document.getElementById('userDropdown').appendChild(selectedUserDiv);
    
                        console.log(`Selected user's email: ${email}`);
                        console.log(selectedUsers)
                    }
                });

                dropdownItem.appendChild(selectButton);
                dropdown.appendChild(dropdownItem);
            }

        } else {
            console.error('Failed to fetch data:', response.statusText);
        }
    } catch (error) {
        console.error('Error during fetch:', error);
    }
}

async function shareFile() {

    const response = await fetch(`http://localhost:5000/download_single_encrypted_file/${fileNameWithEnc}`);
    const blob = await response.blob();

    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
}
  
export async function showModal(){ 
    const modal = document.getElementById('shareModal');

    modal.style.display = 'block'; // Show the modal

    const closeModal = document.getElementById('closeModal');

    const userNameInput = document.getElementById('userNameInput');

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none'; // Hide the modal when close button is clicked
    });

    userNameInput.addEventListener('input', function () {
        const userInput = userNameInput.value.toLowerCase();
        executeSQLQuery(userInput);
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}