function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

export async function exportPublicKey(key) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
    return pemExported
}

export async function exportPrivateKey(key) {
    const exported = await window.crypto.subtle.exportKey("jwk", key);
    const jwkString = JSON.stringify(exported, null, '  '); // Convert JWK to JSON string
    return jwkString
}

export async function keygen() {
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 4096,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );

        // const privateKey = keyPair.privateKey;
        // const publicKey = keyPair.publicKey;

        // console.log("Private Key:", privateKey);
        // console.log("Public Key:", publicKey);

        // // Export private and public keys
        // await exportPublicKey(keyPair.publicKey);
        // await exportPrivateKey(keyPair.privateKey);
        return keyPair

    } catch (error) {
        console.error("Error generating key pair:", error);
    }
}

// async function exportPublicKey(key) {
//     const exported = await window.crypto.subtle.exportKey("spki", key);
//     const exportedAsString = ab2str(exported);
//     const exportedAsBase64 = window.btoa(exportedAsString);
//     const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
  
//     // Create a Blob from the PEM content
//     const blob = new Blob([pemExported], { type: 'application/x-pem-file' });

//     // Create a link element
//     const link = document.createElement('a');

//     // Set the download attribute with the desired file name
//     link.download = 'public_key.pem';

//     // Create a URL for the Blob and set it as the link's href
//     link.href = URL.createObjectURL(blob);

//     // Append the link to the document
//     document.body.appendChild(link);

//     // Click the link to trigger the download
//     link.click();

//     // Remove the link from the document
//     document.body.removeChild(link);
// }

// async function exportPrivateKey(key) {
//     const exported = await window.crypto.subtle.exportKey("jwk", key);
//     const jwkString = JSON.stringify(exported, null, '  '); // Convert JWK to JSON string
//     const blob = new Blob([jwkString], { type: 'application/json' }); // Create Blob from JSON string

//     // Create a link element
//     const link = document.createElement('a');

//     // Set the download attribute with the desired file name
//     link.download = 'private_key.jwk';

//     // Create a URL for the Blob and set it as the link's href
//     link.href = URL.createObjectURL(blob);

//     // Append the link to the document
//     document.body.appendChild(link);

//     // Click the link to trigger the download
//     link.click();

//     // Remove the link from the document
//     document.body.removeChild(link);
// }