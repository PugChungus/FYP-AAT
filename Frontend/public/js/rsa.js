async function exportCryptoKey(key) {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    const exportedKeyBuffer = new Uint8Array(exported);
    
    console.log(exportedKeyBuffer);
}

async function keygen() {
    let keyPair = await window.crypto.subtle.generateKey(
        {
        name: "RSA-OAEP",
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"],
    );
    
    const privateKey = keyPair.privateKey;
    const publicKey = keyPair.publicKey;

    // Export private and public keys
    await exportCryptoKey(privateKey);
    await exportCryptoKey(publicKey);

    console.log("Private Key:", privateKey);
    console.log("Public Key:", publicKey);
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
  