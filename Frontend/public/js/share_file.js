import { selectedKey } from "./encrypt.js";
import { importPublicKey, encryptDataWithPublicKey, arrayBufferToString } from "./RSA and IndexedDB/rsa.js";
import { selectedFiles } from "./virustotal.js";
import { get_email_via_id } from "./profile.js";
import { get_cookie } from "./cookie.js";

let selectedUsers = [];
let previouslySelectedUsers = [];

// const selectedUsersContainer = document.getElementById('selectedUsersContainer');

async function executeSQLQuery(userInput) {
    const formData = new FormData();
    formData.append('search', userInput);
    const jwtToken = await get_cookie()

    try {
        const response = await fetch('http://localhost:3000/search_users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer: ${jwtToken}`,
                },
            body: formData,
        });

        if (response.ok) {
            const tables = await response.json();
            const dropdown = document.getElementById('userDropdown');
            const selectedUsersDiv = document.getElementById('selectedUserDiv');

            // Save the previously selected users before regeneration
            previouslySelectedUsers = selectedUsers.slice();

            // Clear existing dropdown items
            dropdown.innerHTML = '';

            // Loop through the result and create dropdown items
            for (const user of tables.result) {
                const username = user.username;
                const pfpBuffer = user.profile_picture;
                const account_id = user.account_id;
                console.log(account_id)

                let objectURL;

                if (pfpBuffer !== null) {
                    const dataArray = pfpBuffer.data;
                    const uint8Array = new Uint8Array(dataArray);
                    const blob = new Blob([uint8Array]);
                    objectURL = URL.createObjectURL(blob);
                } else {
                    objectURL = "../images/account.png";
                }

                // Create image element for user avatar
                const imgElement = document.createElement('img');
                imgElement.src = objectURL;
                imgElement.classList.add('user-avatar');

                imgElement.style.maxHeight = '30px'; // Change the value as needed
                imgElement.style.maxWidth = '30px'; // Change the value as needed

                const usernameElement = document.createElement('span');
                usernameElement.textContent = username;

                // Create dropdown item container
                const dropdownItem = document.createElement('div');
                dropdownItem.classList.add('dropdown-item');

                // Append image and username to dropdown item
                dropdownItem.appendChild(imgElement);
                dropdownItem.appendChild(usernameElement);

                // Create select button
                const selectIcon = document.createElement('i');
                selectIcon.classList.add('bx', 'bxs-user-plus')
                selectIcon.title = 'Select User'
                selectIcon.style.fontSize = '30px'
                selectIcon.style.alignItems = 'right'

                // Add click event listener to select button
                selectIcon.addEventListener('click', () => {
                    if (!selectedUsers.includes(account_id)) {
                        const header = document.createElement('h3');

                        // Check if the array is empty and remove the header
                        if (selectedUsers.length === 0) {
                            selectedUsersDiv.innerHTML = '';
                        }

                        // Append the header only if it's the first selection
                        if (selectedUsers.length === 0) {
                            header.textContent = 'Selected user';
                            selectedUsersDiv.appendChild(header);
                        }

                        selectedUsers.push(account_id);
                        selectedUsersDiv.classList.add('selected-user');
                        const userwrapper = document.createElement('div')
                        userwrapper.classList.add("userWrapper");

                        const selectedUsername = document.createElement('span');
                        selectedUsername.textContent = `${username}`;
                        selectedUsername.classList.add('selectedUsername');

                        const deleteIcon = document.createElement('i');
                        deleteIcon.classList.add('bx', 'bxs-x-circle');
                        deleteIcon.addEventListener('click', () => {
                            selectedUsername.remove();
                            deleteIcon.remove();
                            userwrapper.remove()

                            const index = selectedUsers.indexOf(account_id);
                            if (index !== -1) {
                                selectedUsers.splice(index, 1);
                            }

                            // Check if the array is empty and remove the header
                            if (selectedUsers.length === 0) {
                                selectedUsersDiv.innerHTML = '';
                            }
                        });
                        userwrapper.appendChild(selectedUsername)
                        userwrapper.appendChild(deleteIcon)
                        selectedUsersDiv.appendChild(userwrapper);
                        

                        console.log(`Selected user's account_id: ${account_id}`);
                        console.log(selectedUsers);
                    } else {
                        // Alert the user or handle the duplicate case as needed
                        alert(`User ${username} is already selected.`);
                    }
                });

                // Append select button to dropdown item
                dropdownItem.appendChild(selectIcon);

                // Append dropdown item to dropdown
                dropdown.appendChild(dropdownItem);
            }

            // Save the currently selected users for the next regeneration
            previouslySelectedUsers = selectedUsers.slice();
        } else {
            console.error('Failed to fetch data:', response.statusText);
        }
    } catch (error) {
        console.error('Error during fetch:', error);
    }
}

// function padString(data, blockSize) {
//     const padLength = blockSize - (data.length % blockSize);
//     const padding = String.fromCharCode(padLength).repeat(padLength);
//     return data + padding;
// }

// function unpadString(paddedData) {
//     const padLength = paddedData.charCodeAt(paddedData.length - 1);
//     return paddedData.slice(0, -padLength);
// }

export async function shareFile(type) {
    console.log(type)
    // encrypt the key using frontend rsa after that we will get the encrypted key using rsa
    // make a post request to a new python route that will have the encrypted key formdata
    // it will append the encrypted key from the formdata to the start of the file
    // on success it will send the file to the user account through the file shared table via an insert statement
    // share if success the modal will be cleared and the file will be shared there will be loading circle
    const keyItem = sessionStorage.getItem(selectedKey)

    const files = selectedFiles.files;
    const totalFiles = files.length;

    let zipFolderName;
    if (type === 'zip') {
        zipFolderName = window.prompt('Enter the name for the zip folder (without extension)');
        if (!zipFolderName) {
            alert('Please name the zip file for sharing.');
            return; // Abort sharing process if zip folder name is not provided
        }
    }

    for (let selectedUserIndex = 0; selectedUserIndex < selectedUsers.length; selectedUserIndex++) {
        if (keyItem === null) {  
            if (selectedKey.startsWith("key_")) {
                const selectedKeyDisplay = selectedKey.replace('key_', '');
                alert(`Encryption key ${selectedKeyDisplay} used to previously encrypt the file was removed.`);
            }
        } else {
            const jsonString = sessionStorage.getItem(selectedKey);
            const keyData = JSON.parse(jsonString);
            const keyValue = keyData.keyValue; //DEK AES KEY
            console.log(keyValue, typeof(keyValue))
            const share_target_id = selectedUsers[selectedUserIndex]
            console.log(keyValue)
            console.log(share_target_id);

            const formData = new FormData();
            formData.append('account_id', share_target_id)

            const jwtToken = await get_cookie()
 
            const usernameResponse = await fetch('http://localhost:3000/get_username_from_id', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${jwtToken}`,
                    },
                body: formData,
            });

            let username

            if (usernameResponse.ok) {
                const responseData = await usernameResponse.json();
                username = responseData.username;
            }

            formData.append('target_id', share_target_id);
            
            const response = await fetch('http://localhost:3000/get_pubkey', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer: ${jwtToken}`,
                    },
                body: formData,
            });

            let fileNameWithoutExtension;
            
            if (response.ok) {
                const responseData = await response.json();
                console.log(responseData)
                const public_key = responseData.result[0][0]['public_key'];
                console.log(public_key)
                const public_key_obj = await importPublicKey(public_key);
                console.log(public_key_obj)
                const result = await encryptDataWithPublicKey(keyValue, public_key_obj);
                console.log(result)
                const rdata = arrayBufferToString(result);
                console.log(rdata)
                console.log(typeof(rdata))
                const rdata_base64 = btoa(rdata)
                console.log(rdata_base64)
                const rdata_original = atob(rdata_base64)
                console.log(rdata_original)

                formData.append('key', rdata_base64)

                const share_by_email = await get_email_via_id()
                formData.append('email', share_by_email)

                if (type == 'individual') {
                    for (let fileIndex = 0; fileIndex < totalFiles; fileIndex++) {
                        const filename = files[fileIndex].name;
            
                        const numberOfDots = (filename.match(/\./g) || []).length;
            
                        if (numberOfDots === 1 || numberOfDots > 1) {
                            fileNameWithoutExtension = filename.split('.').slice(0, -1).join('.');
                        } else {
                            fileNameWithoutExtension = filename;
                        }
            
                        const fileNameWithEnc = `${fileNameWithoutExtension}.enc`;
                            
                        const response2 = await fetch(`http://localhost:5000/send_file/${fileNameWithEnc}`, {
                            method: 'POST',
                            headers : {
                                'Authorization' : `Bearer: ${jwtToken}`
                            },
                            body: formData,
                        });

                        if (response2.ok) {
                            alert(`File ${fileNameWithEnc} successfully shared with ${username}.`)
                        }
                    }
                } else if (type == 'zip') {
                    const filename = 'encrypted.zip';
                    // const zipFolderName = window.prompt('Enter the name for the zip folder (without extension)');
                    if (zipFolderName) {
                        const email = await get_email_via_id()
                        formData.append('zip_name', `${zipFolderName}.zip`);
                        formData.append('useremail', email)
                        const response2 = await fetch(`http://localhost:5000/send_zip/${filename}`, {
                            method: 'POST',
                            headers : {
                                'Authorization' : `Bearer: ${jwtToken}`
                            },
                            body: formData,
                        });

                        if (response2.ok) {
                            alert(`File ${zipFolderName}.zip successfully shared with ${username}.`)
                        }

                    } else {
                        alert('Please name the zip file for sharing.')
                    }

                } else {
                    alert('Selection not in range.')
                }
            } else {
                alert(`User ${username} public key does not exist.`)
            }
        }
    }
}
  
export async function showModal() {
    const modal = document.getElementById('shareModal');

    modal.style.display = 'block'; // Show the modal

    const closeModal = document.getElementById('closeModal');
    const userNameInput = document.getElementById('userNameInput');
    const standaloneRadio = document.getElementById('standaloneRadio');
    const zipRadio = document.getElementById('zipRadio');
    const standaloneText = document.getElementById('standaloneText');
    const zipText = document.getElementById('zipText');
    const dropdownitem = document.querySelector('.dropdown-item')

    standaloneRadio.style.display = 'none'
    zipRadio.style.display = 'none'
    standaloneText.style.display = 'none'
    zipText.style.display = 'none'

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none'; // Hide the modal when the close button is clicked
        userNameInput.value = ''
       

    // Clear existing selected users
        selectedUsers = [];
        const selectedUsersDiv = document.getElementById('selectedUserDiv');
        selectedUsersDiv.innerHTML = ''; // Clear selected users container

        // Remove dynamically created dropdown items
        const dropdown = document.getElementById('userDropdown');
        dropdown.innerHTML = ''; // Clear dropdown items
    });

    userNameInput.addEventListener('input', function () {
        const userInput = userNameInput.value.toLowerCase();
        if (userInput.length >= 1) {
            executeSQLQuery(userInput)
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    document.getElementById('confirmShare').addEventListener('click', async function() {
        await shareFile('individual');
        userNameInput.value = ''
        window.location.href = "http://localhost:3000/encrypt"
    });
    
    // Append the selectedUsersContainer to the body
    // document.body.appendChild(selectedUsersContainer);
}

export async function showModalMul() {
    const modal = document.getElementById('shareModal');

    modal.style.display = 'block'; // Show the modal

    const confirmShareButton = document.getElementById('confirmShare');
    const closeModal = document.getElementById('closeModal');
    const userNameInput = document.getElementById('userNameInput');
    const standaloneRadio = document.getElementById('standaloneRadio');
    const zipRadio = document.getElementById('zipRadio');

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none'; // Hide the modal when the close button is clicked
        userNameInput.value = ''
       

    // Clear existing selected users
        selectedUsers = [];
        const selectedUsersDiv = document.getElementById('selectedUserDiv');
        selectedUsersDiv.innerHTML = ''; // Clear selected users container

        // Remove dynamically created dropdown items
        const dropdown = document.getElementById('userDropdown');
        dropdown.innerHTML = ''; // Clear dr
    });

    userNameInput.addEventListener('input', function () {
        const userInput = userNameInput.value.toLowerCase();
        if (userInput.length >= 1) {
            executeSQLQuery(userInput)
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Handle radio button selection
    standaloneRadio.addEventListener('change', () => {
        // Handle standalone option selected
        console.log('Standalone selected');
    });

    zipRadio.addEventListener('change', () => {
        // Handle zip option selected
        console.log('Zip selected');
    });

    confirmShareButton.addEventListener('click', async function() {
        // Check which radio button is selected
        if (standaloneRadio.checked) {
            console.log('Standalone option selected');
            await shareFile('individual');
            userNameInput.value = ''
            window.location.href = "http://localhost:3000/encrypt"
            // Add your logic for standalone option
        } else if (zipRadio.checked) {
            console.log('Zip option selected');
            await shareFile('zip');
            userNameInput.value = ''
            window.location.href = "http://localhost:3000/encrypt"
            // Add your logic for zip option
        } else {
            alert('No option selected.')
        }

        // Continue with the rest of your logic or form submission
    });

    // Append the selectedUsersContainer to the body
    // document.body.appendChild(selectedUsersContainer);
}
