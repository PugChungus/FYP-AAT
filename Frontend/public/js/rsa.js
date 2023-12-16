function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

async function exportCryptoKey(key) {
    const exported = await window.crypto.subtle.exportKey("spki", key);
    const exportedAsString = ab2str(exported);
    const exportedAsBase64 = window.btoa(exportedAsString);
    const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
  
    const exportKeyOutput = document.querySelector(".exported-key");
    exportKeyOutput.textContent = pemExported;
}

async function keygen() {
    try {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );

        const privateKey = keyPair.privateKey;
        const publicKey = keyPair.publicKey;

        console.log("Private Key:", privateKey);
        console.log("Public Key:", publicKey);

        // Export private and public keys
        await exportCryptoKey(keyPair.publicKey);

    } catch (error) {
        console.error("Error generating key pair:", error);
    }
}

// function getMessageEncoding() {
//     const messageBox = document.querySelector(".rsa-oaep #message");
//     let message = messageBox.value;
//     let enc = new TextEncoder();
//     return enc.encode(message);
// }
  
// function encryptMessage(publicKey) {
//     let encoded = getMessageEncoding();
//     return window.crypto.subtle.encrypt(
//         {
//         name: "RSA-OAEP",
//         },
//         publicKey,
//         encoded,
//     );
// }

// function decryptMessage(privateKey, ciphertext) {
//     return window.crypto.subtle.decrypt(
//       { name: "RSA-OAEP" },
//       privateKey,
//       ciphertext,
//     );
//   }
  