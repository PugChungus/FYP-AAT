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


window.crypto.subtle.generateKey(
    {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: {name: "SHA-256"}
    },
    true,
    ["encrypt", "decrypt"]
).then(function(keyPair) {

    var data = "example";
    encryptDataWithPublicKey(data, keyPair.publicKey).then((result) => {
        var rdata = arrayBufferToString(result);
        return decryptDataWithPrivateKey(rdata, keyPair.privateKey).then((result) => {
            var result = arrayBufferToString(result);
            console.log(result);
        });
    });
}).catch (function (err){
    console.log(err);
});