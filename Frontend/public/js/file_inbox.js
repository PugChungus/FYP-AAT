import { decryptDataWithPrivateKey, importPrivateKeyFromJWK, arrayBufferToString } from "./RSA and IndexedDB/rsa.js";
import { get_private_key } from "./RSA and IndexedDB/IndexedDB.js";
import { get_cookie } from "./cookie.js";

function ab2str(buf) {
  const decoder = new TextDecoder('utf-8'); // Assuming UTF-8 encoding, adjust if needed
  return decoder.decode(new Uint8Array(buf));
}

async function get_email_via_id() {
  const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
    method: 'POST'
  });

  const data = await newResponse.json(); // await here
  const id = data['id_username']['id'];

  const formData = new FormData();
  formData.append('id', id);
  const jwtToken = await get_cookie()

  const response = await fetch('http://localhost:3000/get_account', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer: ${jwtToken}`
    },
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

async function decryptFile(file_data, file_name, user_email, share_id) {
  const file_data1 = ab2str(file_data.data);
  const delimiter = '|!|';
  const parts = file_data1.split(delimiter);
  const part1 = parts[0];
  console.log(part1)
  const key_decoded = atob(parts[0]);
  console.log(key_decoded)
  console.log(typeof(key_decoded))
  
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
    const result = await decryptDataWithPrivateKey(key_decoded, private_key_obj2);
    const rdata = arrayBufferToString(result);

    formData.append('hex', rdata)
    formData.append('files', encryptedFile);
    const email = await get_email_via_id()
    formData.append('email',email)
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
  } catch (error) {
    console.error('Decryption error:', error);
  }
  
  const formData2 = new FormData();
  formData2.append('share_id', share_id)
  console.log(share_id)

  const jwtToken = await get_cookie();

  const response = await fetch('http://localhost:3000/delete_shared_files', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer: ${jwtToken}`
    },
    body: formData2,
  });

  if (response.ok) {
    alert(`File ${file_name} has been removed.`)
    window.location.href='http://localhost:3000/fileInbox'
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
  const jwtToken = await get_cookie();

  const response = await fetch('http://localhost:3000/get_shared_files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer: ${jwtToken}`,
     },
    body: formData,
  });

  const data = await response.json();

  var tables = data['file_rows'][0];

  for (let i = 0; i < tables.length; i++) {
    var file_data = tables[i]['file'];
    console.log(file_data)
    var shared_email = tables[i]['shared_by_email'];
    var share_id = tables[i]['share_id'];
    console.log(share_id)
    var file_name = tables[i]['file_name'];
    var date = new Date(tables[i]['date_shared']).toLocaleString();

    // console.log(file_data)
    // const rdata_unpadded = unpadString(rdata_padded);

    // Create a new row


    const user_email = await get_email_via_id();

    const checkKey = await checkKeyExistence(`${user_email}_db`, `${user_email}__Object_Store`, 'Private Key');

    if (checkKey == true) {
      var decryptIcon = document.createElement('i');
      decryptIcon.className = 'bx bx-lock-open-alt';
      decryptIcon.style.color = '#0a0a0a';
      decryptIcon.style.fontSize = '25px'
      decryptIcon.title = 'Decrypt File(s)';
      
      // Function to handle icon change on hover
      function handleIconChange() {
        decryptIcon.className = 'bx bx-lock-open-alt bx-tada';
        decryptIcon.style.fontSize = '25px'
        decryptIcon.title = 'Decrypt File(s)';
      }
      
      // Function to handle icon revert when not hovered
      function handleIconRevert() {
        decryptIcon.className = 'bx bx-lock-open-alt';
        decryptIcon.style.fontSize = '25px'
        decryptIcon.title = 'Decrypt File(s)';
      }
      
      // Event listeners for hover effects
      decryptIcon.addEventListener('mouseenter', handleIconChange);
      decryptIcon.addEventListener('mouseleave', handleIconRevert);
      

      (function (currentFileData, currentFileName, currentUserEmail, currentSharedId) {
        decryptIcon.addEventListener('click', function () {
          decryptFile(currentFileData, currentFileName, currentUserEmail, currentSharedId);
        });
      })(file_data, file_name, user_email, share_id);

      creatEntry(file_name, shared_email, date, decryptIcon)

      // Append cells to the row

      // Append the new row to the table body
    } else {
      
      var decryptIcon = document.createElement('i');
      decryptIcon.className = 'bx bxs-user-x';
      decryptIcon.style.color = '#0a0a0a';
      decryptIcon.style.fontSize = '25px'
      decryptIcon.title = 'Private Key Of This User Does Not Exist';
      creatEntry(file_name, shared_email, date, decryptIcon)

      // Append the new row to the table body
    }
  }
}

function creatEntry(fileName, sender , dateTime, decryptor) {
  const EntriesContainer = document.querySelector('.responsive-table');

  const newEntry = document.createElement('li');
  newEntry.className = 'table-row';

  const col1 = document.createElement('div');
  col1.className = 'col col-3';
  col1.textContent = fileName;

  const col2 = document.createElement('div');
  col2.className = 'col col-2';
  col2.textContent = sender;

  const col3 = document.createElement('div');
  col3.className = 'col col-3';
  col3.textContent = dateTime;

  const col4 = document.createElement('div');
  col4.className = 'col col-1 col-right';
  col4.append(decryptor)

  // Create the download icon
  const downloadLink = document.createElement('a');
  downloadLink.href = '#';
  downloadLink.addEventListener('click', function (event) {
      event.preventDefault();
      downloadKey(keyContent, keyName);
  });

  
  const spacer = document.createElement('span');
  spacer.className = 'icon-spacer';
  col4.appendChild(spacer);

  // Create the delete icon

  newEntry.appendChild(col1);
  newEntry.appendChild(col2);
  newEntry.appendChild(col3);
  newEntry.appendChild(col4);

  EntriesContainer.appendChild(newEntry);
}

displayFiles()