function handleDrop(event) {
    event.preventDefault();

    const files = event.dataTransfer.files;

    for (const file of files) {
        // Handle the file (e.g., upload it)
        console.log('File:', file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.target.style.border = '2px dashed #3498db';
}

function handleDragLeave(event) {
    event.target.style.border = '2px dashed #ccc';
}