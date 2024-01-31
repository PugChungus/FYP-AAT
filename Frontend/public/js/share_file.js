import { selectedKey } from "./encrypt.js";
import { importPublicKey, encryptDataWithPublicKey, arrayBufferToString } from "./RSA and IndexedDB/rsa.js";
import { selectedFiles } from "./virustotal.js";
import { get_email_via_id } from "./profile.js";

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
                        header.textContent = 'Selected users';
    
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

function padBytes(data, blockSize) {
    const padLength = blockSize - (data.length % blockSize);
    const padding = Buffer.alloc(padLength, padLength); // Pad with the length of padding
    return Buffer.concat([data, padding]);
}

export async function shareFile() {

    // encrypt the key using frontend rsa after that we will get the encrypted key using rsa
    // make a post request to a new python route that will have the encrypted key formdata
    // it will append the encrypted key from the formdata to the start of the file
    // on success it will send the file to the user account through the file shared table via an insert statement
    // share if success the modal will be cleared and the file will be shared there will be loading circle
    const keyItem = sessionStorage.getItem(selectedKey)

    const files = selectedFiles.files;
    const totalFiles = files.length;

    for (let selectedUserIndex = 0; selectedUserIndex < selectedUsers.length; selectedUserIndex++) {
        for (let fileIndex = 0; fileIndex < totalFiles; fileIndex++) {
            if (keyItem === null) {  
                if (selectedKey.startsWith("key_")){
                    const selectedKeyDisplay = selectedKey.replace('key_', '');
                    alert(`Encryption key ${selectedKeyDisplay} used to previously encrypt the file was removed.`);
                }
            } else {
                const jsonString = sessionStorage.getItem(selectedKey);
                const keyData = JSON.parse(jsonString);
                const keyValue = keyData.keyValue; //DEK AES KEY
                const share_target_email = selectedUsers[selectedUserIndex]
                console.log(keyValue)
                console.log(share_target_email);

                const formData = new FormData();
                formData.append('email', share_target_email);
                
                const response = await fetch('http://localhost:3000/get_pubkey', {
                method: 'POST',
                body: formData,
                });

                const responseData = await response.json();
                const public_key = responseData.result[0][0]['public_key']
                const public_key_obj = await importPublicKey(public_key);
                const result = await encryptDataWithPublicKey(keyValue, public_key_obj);
                const rdata = arrayBufferToString(result);
                const rdata_padded = padBytes(rdata, 1024);
                formData.append('key', rdata_padded)

                const share_by_email = await get_email_via_id()
                formData.append('email2', share_by_email)
    
                const filename = files[fileIndex].name;
                let fileNameWithoutExtension;
    
                const numberOfDots = (filename.match(/\./g) || []).length;
    
                if (numberOfDots === 1 || numberOfDots > 1) {
                    fileNameWithoutExtension = filename.split('.').slice(0, -1).join('.');
                } else {
                    fileNameWithoutExtension = filename;
                }
    
                const fileNameWithEnc = `${fileNameWithoutExtension}.enc`;

                const response2 = await fetch(`http://localhost:5000/send_file/${fileNameWithEnc}`, {
                    method: 'POST',
                    body: formData,
                });

                if (response2.ok) {
                    alert(`File ${fileNameWithEnc} successfully shared with ${share_target_email}.`)
                }
    
            }
        }
    }
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