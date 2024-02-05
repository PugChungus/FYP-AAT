import { decryptDataWithPrivateKey, importPrivateKeyFromJWK, arrayBufferToString } from "./RSA and IndexedDB/rsa.js";
import { get_private_key } from "./RSA and IndexedDB/IndexedDB.js";
import { get_cookie } from "./cookie.js";
import { ab2str } from "./RSA and IndexedDB/rsa_keygen.js";

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

async function decryptFile(file_data, file_name, user_email) {
  const file_data1 = ab2str(file_data.data);
  const delimiter = '|!|';
  const parts = file_data1.split(delimiter);
  const part1 = parts[0];
  console.log(part1)
  const key_decoded = atob(parts[0]);
  console.log(key_decoded)
  console.log(typeof(key_decoded))
  // const keyUint8Array = new Uint8Array(keyBase64.length);
  // for (let i = 0; i < keyBase64.length; i++) {
  //   keyUint8Array[i] = keyBase64.charCodeAt(i);
  // }
  // const keyDecoder = new TextDecoder('utf-8');
  // const decodedKeyString = keyDecoder.decode(keyUint8Array);
  // console.log(decodedKeyString);
  // console.log(typeof(decodedKeyString));
  
  const encryptedDataBase64 = atob(parts[1]);
  const encryptedDataUint8Array = new Uint8Array(encryptedDataBase64.length);
  for (let i = 0; i < encryptedDataBase64.length; i++) {
    encryptedDataUint8Array[i] = encryptedDataBase64.charCodeAt(i);
  }
  const encryptedBlob = new Blob([encryptedDataUint8Array], { type: "application/octet-stream" });
  const encryptedFile = new File([encryptedBlob], file_name, { type: "application/octet-stream" });
  console.log(encryptedFile)

  const key_from_indexed_db = await get_private_key(user_email)
  const private_key = key_from_indexed_db.privateKey
  console.log(private_key)

  const private_key_obj = JSON.parse(private_key)
  console.log(private_key_obj)

  const private_key_obj2 = await importPrivateKeyFromJWK(private_key_obj)
  console.log(private_key_obj2)
  
  const formData = new FormData();

  try {     
    decryptDataWithPrivateKey(key_decoded, private_key_obj2).then((result) => {
      const rdata = arrayBufferToString(result);
      console.log(rdata)
    });
        // const outputDiv = document.getElementById('output2');
        // outputDiv.innerHTML = '<p id="fun2">' + rdata + '</p>';
  } catch (error) {
    console.error('Decryption error:', error);
  }

  formData.append('files', encryptedFile);
  
  const jwtToken = await get_cookie()

  const response2 = await fetch('http://localhost:5000/decrypt2', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer: ${jwtToken}`
    },
    body: formData,
  });

  if (response2.ok) {
    const blob = await response2.blob();

    var filename = "";
    var disposition = response2.headers.get('Content-Disposition')
    console.log(disposition)

    if (disposition && disposition.indexOf('attachment') !== -1) {
        var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        var matches = filenameRegex.exec(disposition);

        if (matches && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
        }
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = objectUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } else {
    alert('Decryption Failed')
  }
}

async function displayFiles() {
  const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
    method: 'POST',
  });

  const data1 = await newResponse.json(); // await here
  const id = data1['id_username']['id'];

  const formData = new FormData();
  formData.append('id', id);

  const response = await fetch('http://localhost:3000/get_shared_files', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  var tables = data['file_rows'][0];

  for (let i = 0; i < tables.length; i++) {
    var file_data = tables[i]['file'];
    console.log(file_data)
    var shared_email = tables[i]['shared_by_email'];
    var file_name = tables[i]['file_name'];
    var date = new Date(tables[i]['date_shared']).toLocaleString();

    // console.log(file_data)
    // const rdata_unpadded = unpadString(rdata_padded);

    // Create a new row
    var newRow = document.createElement('tr');

    // Add cells to the row
    var cellFileName = document.createElement('td');
    cellFileName.textContent = file_name;

    var cellSharedEmail = document.createElement('td');
    cellSharedEmail.textContent = shared_email;

    var cellDate = document.createElement('td');
    cellDate.textContent = date;

    const user_email = await get_email_via_id();

    const checkKey = await checkKeyExistence(`${user_email}_db`, `${user_email}__Object_Store`, 'Private Key');

    if (checkKey == true) {
      var cellDecryptButton = document.createElement('td');
      var decryptButton = document.createElement('button');
      decryptButton.textContent = 'Decrypt File';
      decryptButton.addEventListener('click', function () {
        // Call your decryption function here
        decryptFile(file_data, file_name, user_email);
      });
      cellDecryptButton.appendChild(decryptButton);

      // Append cells to the row
      newRow.appendChild(cellFileName);
      newRow.appendChild(cellSharedEmail);
      newRow.appendChild(cellDate);
      newRow.appendChild(cellDecryptButton);

      // Append the new row to the table body
      document.querySelector('.file-table tbody').appendChild(newRow);
    } else {
      var cellDecryptButton = document.createElement('td');
      var decryptButton = document.createElement('p');
      decryptButton.textContent = 'Private key does not exist.';
      decryptButton.style.color = 'red';
      cellDecryptButton.appendChild(decryptButton);

      // Append cells to the row
      newRow.appendChild(cellFileName);
      newRow.appendChild(cellSharedEmail);
      newRow.appendChild(cellDate);
      newRow.appendChild(cellDecryptButton);

      // Append the new row to the table body
      document.querySelector('.file-table tbody').appendChild(newRow);
    }
  }
}

displayFiles()