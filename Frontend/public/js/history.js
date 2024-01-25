import { get_cookie } from "./cookie.js";

function appendRowToTable(index, fileName, file_size, key_name, type, time) {
  const table = document.querySelector('.responsive-table');
  const newRow = document.createElement('li');
  newRow.className = 'table-row';

  // Id column using row index
  const col0 = document.createElement('div');
  col0.className = `col col-0`;
  col0.textContent = index + 1;  // Adding 1 to start counting from 1
  newRow.appendChild(col0);

  // File Name column
  const col1 = document.createElement('div');
  col1.className = `col col-1`;
  col1.textContent = fileName;
  newRow.appendChild(col1);

  // File Size column
  const col2 = document.createElement('div');
  col2.className = `col col-2`;
  col2.textContent = file_size;
  newRow.appendChild(col2);

  // Key Name column
  const col3 = document.createElement('div');
  col3.className = `col col-3`;
  col3.textContent = key_name;
  newRow.appendChild(col3);

  // Type column
  const col4 = document.createElement('div');
  col4.className = `col col-4`;
  col4.textContent = type;
  newRow.appendChild(col4);

  // Time column
  const col5 = document.createElement('div');
  col5.className = `col col-5`;
  col5.textContent = time;
  newRow.appendChild(col5);

  table.appendChild(newRow);
}

let id;



async function renderHistory() {
    const newResponse = await fetch('http://localhost:3000/get_data_from_cookie', {
        method: 'POST'
    });

    const data = await newResponse.json(); // await here
    id = data['id_username']['id'];
      
    const formData = new FormData();
    formData.append('id', id);
  
    try {
      const jwtToken = await get_cookie()

      const response = await fetch('http://localhost:5000/display_history', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer: ${jwtToken}`
        },
        body: formData,
      });
  
      if (response.ok) {
        const historyData = await response.json();
       
        for (let i = 0; i < historyData.length; i++) {
          const row = historyData[i];
          console.log(`Row ${i + 1}:`, row);
          
          // Access individual values in the row
          const time = row.time;
          const time_formatted = time.slice(0, -3)
          const dateObject = new Date(time_formatted);
          const day = ('0' + dateObject.getDate()).slice(-2);
          const month = dateObject.toLocaleString('default', { month: 'short' });
          const year = dateObject.getFullYear();
          const hours = ('0' + dateObject.getHours()).slice(-2);
          const minutes = ('0' + dateObject.getMinutes()).slice(-2);
          const seconds = ('0' + dateObject.getSeconds()).slice(-2);
          const formattedTime = `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;

          const fileName = row.file_name;
          const file_size = row.file_size;
          const type = row.type;
          const key_name = row.key_name
          appendRowToTable(i, fileName, file_size, key_name, type, formattedTime)
        }

      } else {
        console.error('Error fetching history:', response.status);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
}

export async function clear_history() {  
  const formData = new FormData();
  formData.append('id', id);

  try {
    const jwtToken = await get_cookie()
    
    const response = await fetch('http://localhost:5000/clear_history', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer: ${jwtToken}`
      },
      body: formData,
    });

    if (response.ok) {
      window.location.reload();
      alert('History Cleared.')
    }
  }

  catch (error) {
    console.error('Error fetching history:', error);
  }
}

  // Ensure the script is executed after the HTML has been fully loaded
document.addEventListener('DOMContentLoaded', function () {
    renderHistory();
});
  