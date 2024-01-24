//data needs to be in array buffer before it can encrypt or decrypt
//after encrypting convert back from array buffer to string

function stringToArrayBuffer(str){
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i<strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function arrayBufferToString(str){
    var byteArray = new Uint8Array(str);
    var byteString = '';
    for(var i=0; i < byteArray.byteLength; i++) {
        byteString += String.fromCodePoint(byteArray[i]);
    }
    return byteString;
}

function encryptDataWithPublicKey(data, key) {
    data = stringToArrayBuffer(data);
    return window.crypto.subtle.encrypt(
    {
        name: "RSA-OAEP",
        //label: Uint8Array([...]) //optional
    },
    key, //from generateKey or importKey above
    data //ArrayBuffer of data you want to encrypt
);
}

function decryptDataWithPrivateKey(data, key) {
    data = stringToArrayBuffer(data);
    return window.crypto.subtle.decrypt(
        {
            name: "RSA-OAEP",
            //label: Uint8Array([...]) //optional
        },
        key, //from generateKey or importKey above
        data //ArrayBuffer of data you want to encrypt
    );
}

let sharedData

function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = async function (e) {
            const outputDiv = document.getElementById('output');
            const data = "example";
            const public_key = e.target.result;

            try {
                const public_key_obj = await importPublicKey(public_key);
                console.log(public_key_obj);
                
                encryptDataWithPublicKey(data, public_key_obj).then((result) => {
                    const rdata = arrayBufferToString(result);
                    outputDiv.innerHTML = '<p id="fun">' + rdata + '</p>';

                    sharedData = rdata
                });
            } catch (error) {
                console.error("Error importing public key:", error);
            }
        };

        reader.readAsText(file);
    } else {
        console.error('Please select a file.');
    }
}

function uploadFile2() {
    const fileInput = document.getElementById('fileInput2');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = async function (e) {
            const outputDiv = document.getElementById('output2');
            const data = sharedData
            const private_key = e.target.result;
            const private_key_obj = JSON.parse(private_key)

            try {
                const private_key_obj2 = await importPrivateKeyFromJWK(private_key_obj);
                console.log(private_key_obj2);
                
                decryptDataWithPrivateKey(data, private_key_obj2).then((result) => {
                    const rdata = arrayBufferToString(result);
                    outputDiv.innerHTML = '<p id="fun2">' + rdata + '</p>';
                });
            } catch (error) {
                console.error("Error importing Private key:", error);
            }
        };

        reader.readAsText(file);
    } else {
        console.error('Please select a file.');
    }
}

async function importPublicKey(pem) {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pem.substring(
      pemHeader.length,
      pem.length - pemFooter.length - 1,
    );
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = stringToArrayBuffer(binaryDerString);
  
    return window.crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"],
    );
}

async function importPrivateKeyFromJWK(jwk) {
    const privateKey = await window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'RSA-OAEP',
        hash: { name: 'SHA-256' },
      },
      true,
      ['decrypt']
    );
  
    return privateKey;
}