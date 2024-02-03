import { decryptDataWithPrivateKey, importPrivateKeyFromJWK, arrayBufferToString } from "./RSA and IndexedDB/rsa.js";
import { get_private_key } from "./RSA and IndexedDB/IndexedDB.js";
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

async function decryptFile(file_data, user_email) {
  console.log(typeof(file_data))
  const file_data1 = ab2str(file_data.data);
  const delimiter = '|!|';
  const parts = file_data1.split(delimiter);
  const key_part = parts[0];
  console.log(key_part)
  const key = atob(parts[0]);
  const uint8Array = new Uint8Array(key.length);
  for (let i = 0; i < key.length; i++) {
    uint8Array[i] = key.charCodeAt(i);
  }

  // Create a TextDecoder instance for UTF-8
  const decoder = new TextDecoder('utf-8');

  // Decode the UTF-8 bytes to a string
  const decodedString = decoder.decode(uint8Array);
  console.log(decodedString);



  const encrypted_data = atob(parts[1]);
  console.log(key)
  console.log(typeof(key))
  console.log(encrypted_data)

  const key_from_indexed_db = await get_private_key(user_email)
  const private_key = key_from_indexed_db.privateKey
  console.log(private_key)

  const private_key_obj = JSON.parse(private_key)
  console.log(private_key_obj)

  const private_key_obj2 = await importPrivateKeyFromJWK(private_key_obj)
  console.log(private_key_obj2)
     
  try {
    decryptDataWithPrivateKey(decodedString, private_key_obj2).then((result) => {
        const rdata = arrayBufferToString(result);
        console.log(rdata)
        // const outputDiv = document.getElementById('output2');
        // outputDiv.innerHTML = '<p id="fun2">' + rdata + '</p>';
    });
  } catch (error) {
      console.error('Decryption error:', error);
  }

  

  // formData.append('hex', rdata)
  // formData.append('files', decodedResult);

  // const response2 = await fetch('http://localhost:5000/decrypt2', {
  //   method: 'POST',
  //   headers: {
  //       'Authorization': `Bearer: ${jwtToken}`
  //   },
  //   body: formData,
  // });
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
        decryptFile(file_data, user_email);
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