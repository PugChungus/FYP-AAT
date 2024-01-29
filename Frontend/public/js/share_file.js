export async function showModal(){ 
    const modal = document.getElementById('shareModal');

    modal.style.display = 'block'; // Show the modal

    const closeModal = document.getElementById('closeModal');

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none'; // Hide the modal when close button is clicked
    });

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}