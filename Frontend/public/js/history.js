function createTableRow(data) {
    const newRow = document.createElement('li');
    newRow.className = 'table-row';
  
    // Add columns to the row
    for (let i = 1; i <= 6; i++) {
      const col = document.createElement('div');
      col.className = `col col-${i}`;
      col.textContent = data[`col${i}`];
      newRow.appendChild(col);
    }
  
    return newRow;
}
  
function appendRowToTable(data) {
    const table = document.getElementById('responsive-table');
    const newRow = createTableRow(data);
    table.appendChild(newRow);
}
  
async function renderHistory() {
    const email = sessionStorage.getItem('email');
  
    const formData = new FormData();
    formData.append('email', email);
  
    try {
      const response = await fetch('http://localhost:5000/display_history', {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        const historyData = await response.json();
        console.log(historyData)
  
        // Check if historyData is an array
        if (Array.isArray(historyData)) {
          const table = document.querySelector('.responsive-table');
  
          // Clear existing rows
          table.innerHTML = '';
  
          // Append new rows
          historyData.forEach(rowData => {
            appendRowToTable(rowData, table);
          });
        } else {
          console.error('Invalid data format: historyData is not an array.');
        }
      } else {
        console.error('Error fetching history:', response.status);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
}

  // Ensure the script is executed after the HTML has been fully loaded
document.addEventListener('DOMContentLoaded', function () {
    renderHistory();
});
  