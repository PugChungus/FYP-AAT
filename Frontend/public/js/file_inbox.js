async function displayFiles() {

    const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
      method: 'POST'
    });
  
    const data1 = await newResponse.json(); // await here
    id = data1['id_username']['id'];
  
    const formData = new FormData();
    formData.append('id', id);

    const response = await fetch('http://localhost:3000/get_shared_files', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    var tables = data["file_rows"][0]
      
    for (let i = 0; i < tables.length; i++) {
      var shared_email = tables[i]['shared_by_email'];
      var file_name = tables[i]['file_name'];
      var date = new Date(tables[i]['date_shared']).toLocaleString();
  
      // Create a new row
      var newRow = document.createElement('tr');
  
      // Add cells to the row
      var cellFileName = document.createElement('td');
      cellFileName.textContent = file_name;
  
      var cellSharedEmail = document.createElement('td');
      cellSharedEmail.textContent = shared_email;
  
      var cellDate = document.createElement('td');
      cellDate.textContent = date;
  
      var cellDecryptButton = document.createElement('td');
      var decryptButton = document.createElement('button');
      decryptButton.textContent = 'Decrypt File';
      decryptButton.addEventListener('click', function() {
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
  }
} 

displayFiles()