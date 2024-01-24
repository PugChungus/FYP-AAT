export const keyDropdown = document.getElementById('key-dropdown');

export function getAllKeyData() {
    const keyData = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        // Check if the key starts with 'key_' to identify your keys
        if (key.startsWith('key_')) {
            const keyName = key.substring(4); // Extract the fileNameWithoutExtension part
            const data = JSON.parse(sessionStorage.getItem(key));
            keyData.push({ keyName, uploadTime: data.uploadTime });
        }
    }
    return keyData;
}

export function createKeyDropdown() {
    // Clear existing options
    keyDropdown.innerHTML = '';

    // Get all key data from sessionStorage
    const keyData = getAllKeyData();

    // Sort key data based on upload time (assuming uploadTime is in ISO format)
    keyData.sort((a, b) => new Date(a.uploadTime) - new Date(b.uploadTime));

    // Add each key name as an option in the dropdown
    keyData.forEach((data, index) => {
        const option = document.createElement('option');
        option.value = `key_${data.keyName}`;
        option.textContent = data.keyName;
        keyDropdown.appendChild(option);
    });

    // Set the selected key to the value of the first option
    let selectedKey = keyDropdown.value;

    // Trigger the change event manually
    keyDropdown.dispatchEvent(new Event('change'));
}