export async function encryptData(data) {
    try {
        const response = await fetch('http://localhost:3000/encrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data })
        });

        if (!response.ok) {
            throw new Error('Encryption failed');
        }

        const result = await response.json();
        return result.encryptedData;
    } catch (error) {
        console.error('Error encrypting data:', error);
        throw error;
    }
}

export async function decryptData(encryptedData) {
    try {
        const response = await fetch('http://localhost:3000/decrypt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ encryptedData })
        });

        if (!response.ok) {
            throw new Error('Decryption failed');
        }

        const result = await response.json();
        return result.decryptedData;
    } catch (error) {
        console.error('Error decrypting data:', error);
        throw error;
    }
}