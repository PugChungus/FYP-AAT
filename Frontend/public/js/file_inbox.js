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
        decryptFile(file_name);
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