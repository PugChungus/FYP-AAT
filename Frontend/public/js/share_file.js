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
                    console.log(`Selected user's email: ${email}`);
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