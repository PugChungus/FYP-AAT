import { encryptDataWithPublicKey, decryptDataWithPrivateKey, importPrivateKeyFromJWK, importPublicKey, arrayBufferToString } from "./RSA and IndexedDB/rsa.js";
import { get_private_key } from "./RSA and IndexedDB/IndexedDB.js";
import { ab2str } from "./RSA and IndexedDB/rsa_keygen.js";

let shared_data = 'miner poison control'
let shared_data2
const inputDiv = document.getElementById('input');
inputDiv.innerHTML = '<p id="fun">' + shared_data + '</p>';

function stringToArrayBuffer(str) {
    const encoder = new TextEncoder('utf-8');
    return encoder.encode(str).buffer;
}

async function get_email_via_id() {
    const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
      method: 'POST'
    });
  
    const data = await newResponse.json(); // await here
    const id = data['id_username']['id'];
  
    const formData = new FormData();
    formData.append('id', id);
  
    const response = await fetch('http://localhost:3000/get_account', {
      method: 'POST',
      body: formData,
    });
  
    const data2 = await response.json();
    var email_addr = data2["tables"][0]["email_address"];
  
    return email_addr
}

function checkKeyExistence(dbName, objectStoreName, keyToCheck) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName);
  
        request.onsuccess = function (event) {
            const db = event.target.result;
  
            if (db.objectStoreNames.contains(objectStoreName)) {
                const transaction = db.transaction(objectStoreName, 'readonly');
                const objectStore = transaction.objectStore(objectStoreName);
  
                const getRequest = objectStore.get(keyToCheck);
  
                getRequest.onsuccess = function () {
                    const result = getRequest.result;
                    resolve(result !== undefined && result !== null);
                };
  
                getRequest.onerror = function () {
                    reject(new Error(`Error checking key '${keyToCheck}' existence.`));
                };
            } else {
                resolve(false);
            }
        };
  
        request.onerror = function (event) {
            reject(new Error(`Error opening database: ${event.target.error}`));
        };
    });
  }

async function encrypt() {
    const formData = new FormData();
    formData.append('email', 'trevortanwc04@outlook.com');
    
    const response = await fetch('http://localhost:3000/get_pubkey', {
        method: 'POST',
        body: formData,
    });

    const responseData = await response.json();
    const public_key = responseData.result[0][0]['public_key']
    console.log(public_key)
    const public_key_obj = await importPublicKey(public_key);
    console.log(public_key_obj)
    const result = await encryptDataWithPublicKey(shared_data, public_key_obj);
    console.log(result)
    const rdata = arrayBufferToString(result);
    const outputDiv = document.getElementById('output');
    outputDiv.innerHTML = '<p id="fun">' + rdata + '</p>';
    shared_data2 = rdata
}

encrypt()

async function decrypt() {
    const user_email = await get_email_via_id();
    const key_from_indexed_db = await get_private_key(user_email)

    const private_key = key_from_indexed_db.privateKey
    console.log(private_key)
  
    const private_key_obj = JSON.parse(private_key)
    console.log(private_key_obj)
  
    // const dataArrayBuffer = stringToArrayBuffer(shared_data)
    const private_key_obj2 = await importPrivateKeyFromJWK(private_key_obj)
    // console.log(dataArrayBuffer)
    console.log(private_key_obj2)
    console.log(typeof(shared_data2))
    
    decryptDataWithPrivateKey(shared_data2, private_key_obj2).then((result) => {
      const rdata = arrayBufferToString(result);
      const outputDiv = document.getElementById('output2');
      outputDiv.innerHTML = '<p id="fun2">' + rdata + '</p>';
    });
}

decrypt()