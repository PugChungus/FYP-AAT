

const SCOPES = 'https://www.googleapis.com/auth/drive';
//const CLIENT_ID = '984198711838-2uekpq9dj3nkbe4igf9jl3h78lsvse9p.apps.googleusercontent.com';
//const API_KEY = 'AIzaSyB90VRo8ldzFuNyJNk1nmmgUgUUOn90IVs';
//const APP_ID = '984198711838';
const API_KEY = 'AIzaSyDxVkK8qEwzfy0T7jWzrVlExGicSv6ntro';
const APP_ID = '822327410701';
const CLIENT_ID = '822327410701-losrrlt7ukr1l2l3v7t2rgur3l7sf3kk.apps.googleusercontent.com'
let tokenClient;
let accessToken = null;
let pickerInited = false;
let gisInited = false;

var global_data = ''

 document.getElementById('authorize_button');



function gapiLoaded() {
gapi.load('client:picker', initializePicker);
}


async function initializePicker() {
await gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
pickerInited = true;
maybeEnableButtons();
}


function gisLoaded() {
tokenClient = google.accounts.oauth2.initTokenClient({
client_id: CLIENT_ID,
scope: SCOPES,
callback: '', // defined later
});
gisInited = true;
maybeEnableButtons();
}


function maybeEnableButtons() {
if (pickerInited && gisInited) {
document.getElementById('authorize_button').style.visibility = 'visible';
}
}


function createPicker() {
const view = new google.picker.View(google.picker.ViewId.DOCS);

const picker = new google.picker.PickerBuilder()
.enableFeature(google.picker.Feature.NAV_HIDDEN)
.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
.setDeveloperKey(API_KEY)
.setAppId(APP_ID)
.setOAuthToken(accessToken)
.addView(view)
.addView(new google.picker.DocsUploadView())
.setCallback(pickerCallback)
.build();
picker.setVisible(true);
}

function auth(){
    const width = 600;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const url = '/get-access-token'; // Endpoint to start authentication

    window.open(url, 'Google Auth', `width=${width},height=${height},left=${left},top=${top}`);
  }


async function sendAccessTokenToServer(accessToken) {
  try {
    const response = await fetch('/store-access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accessToken }),
    });

    if (response.ok) {
      console.log('Access token sent to server successfully');
      // Handle any further actions after sending the token
    } else {
      throw new Error('Failed to send access token to server');
    }
  } catch (error) {
    console.error('Error sending access token to server:', error);
  }
}

function handleAuthClick() {
    console.log(tokenClient)
    tokenClient.callback = async (response) => {
    if (response.error !== undefined) {
        throw (response);
        }
    
    
    accessToken = response.access_token;
    

    document.getElementById('authorize_button').innerText = 'Refresh';
    await createPicker();
    };

    if (accessToken === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
    // Skip display of account chooser and consent dialog for an existing session.
    tokenClient.requestAccessToken({prompt: ''});
    
    gapi.load('picker', () => {
        const picker = new google.picker.PickerBuilder()
          .setOAuthToken(accessToken)
          .setDeveloperKey(API_KEY)
          .setAppId(APP_ID)
          .setCallback(this.pickerCallback)
          .addView(new google.picker.View(google.picker.ViewId.DOCS))
          .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
          .build();

        picker.setVisible(true);
        
    });
    
    }
    }

async function pickerCallback(data) {
    if (data.action === google.picker.Action.PICKED) {
        const headers = {
            Authorization: `Bearer ${accessToken}` // Include the access token in the Authorization header
  
          };
        const document = data[google.picker.Response.DOCUMENTS][0];
        const fileId = document[google.picker.Document.ID];
        const mimeType = document[google.picker.Document.MIME_TYPE];
        console.log(fileId)
        try {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        method: 'GET',
        headers: headers,
        'key': API_KEY
        });
        // Process  each picked file
        console.log('response', response)
        if (response.ok) {
          const blobe = await response.blob();
          console.log("heyy")
          console.log(response)
          //const base64 = `data:${mimeType};base64,${await this.blobToBase64(blob)}`;
          // Now you have the file content as a base64-encoded string - proceed as desired
          const file = new File([blob], document[google.picker.Document.NAME]);
          uploadFile(file)
          
        } else {
          console.error('Failed to fetch file:', response.status, response.statusText);
        }
        } catch (error) {
          console.error('Error while fetching file:', error);
        }
        
      }
            // Access the file data and pass it to the uploader
            // const fileData = {
            //     id: fileId,
            //     name: res.result.name,
            //     size: res.result.size,
            //     mimeType: res.result.mimeType,
            //     // Add more necessary file details as needed
            // };
            
            // Pass fileData to the uploader function
            
    
}

document.getElementById('file-input-encrypt').addEventListener('change', handleFileUpload);


function handleFileUpload(event) {
    const files = event.target.files;

    // Clear previous file details
    document.getElementById(  'file-details-container').innerHTML = '';

    // Display file details
    for (const file of files) {
        const fileName = file.name;
        console.log(fileName)
        uploadFile(file);
    }
}

function uploadFile(file) {
    console.log("Filedata")
    
    console.log("name")
  
    
    // Display file details in the file details container
    const fileDetailsContainer = document.getElementById('file-details-container');

    // Create a div element for the selected file
    const fileContainer = document.createElement('div');
    fileContainer.classList.add('file-container');

    // Display file name
    const fileName = document.createElement('div');
    fileName.textContent = `File Name: ${file.name}`;
    fileContainer.appendChild(fileName);

    // Display file size
    const fileSize = document.createElement('div');
    fileSize.textContent = `File Size: ${formatFileSize(file.size)}`;
    fileContainer.appendChild(fileSize);

    // Append file container to the details container
    fileDetailsContainer.appendChild(fileContainer);

    // You can perform other actions here using fileData if needed
    // For example, initiate an AJAX request to upload the file or perform other operations
    
    
  updatefilearrays(file)



}

let fileArray = [];

function updatefilearrays(file){
  // const blob = new Blob([fileData], { type: 'application/octet-stream' });
  //     console.log('LOG BLOB',blob)
      
  //     // Create a File object from the Blob
  // const file = new File([blob], name[google.picker.Document.NAME]);
  //     console.log(file)



  fileArray.push(file)
  console.log("Mista White  ")
  console.log(fileArray)
}

function submitbutton(){
  const button = document.getElementById('submit'); // Replace 'myButton' with the ID of your button
          button.addEventListener('click', function() {
            submit()
           window.location.href = 'download'; // Replace 'anotherPage.html' with the desired page URL
           createFileList(global_data)
          });
}


function submit(){
    const filekey = document.getElementById('file-input-key');
    const uploadedFile = filekey.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const fileContent = event.target.result;
        console.log('File content:', fileContent);
    
        const formData = new FormData();
    
        // Append key file content to the FormData object
        formData.append('keyFileContent', fileContent);
        
        // Append each file to the FormData object
        fileArray.forEach((file, index) => {
        
          formData.append(`file${index}`, file);
        });
    
        // Perform the fetch request inside the onload function
        fetch('http://127.0.0.1:5000/AESencryptFile', {
          method: 'POST',
          body: formData
        })
        .then(response => {
          if (response.ok) {
            console.log('Data submitted successfully');
            // Handle successful submission
            return response.text()

            

          } else {
            console.error('Submission failed');
            // Handle submission failure
          }
        })
        .then((data) => {
          global_data = data; // Store the fetched data in the variable
          // You can perform additional operations or call other functions using encryptedData here
          console.log(global_data) // Call a function and pass the fetched data
          
        })
        .catch(error => {
          console.error('Error:', error);
          // Handle errors
        });
      };
    
      // Read the file as text
      reader.readAsText(uploadedFile);
    }

    





    function formatFileSize(size) {
        const kilobyte = 1024;
        const megabyte = kilobyte * 1024;
    
        if (size < kilobyte) {
            return `${size} B`;
        } else if (size < megabyte) {
            return `${(size / kilobyte).toFixed(2)} KB`;
        } else {
            return `${(size / megabyte).toFixed(2)} MB`;
        }
    }
    

function submitFiles() {
  const files = fileArray


  const filekey = document.getElementById('file-input-key');
  const selectedFiles = fileInput.files;

  if (selectedFiles.length > 0) {
      const file = selectedFiles[0]; // Assuming handling only the first selected file
      const uploadedFile = fileInput.files[0];

      const reader = new FileReader();
      reader.onload = function(event) {
          const key = event.target.result;
          console.log(key)
          // Prepare the data to be sent
          const formData = new FormData();
          formData.append('key', content); // Assuming the content is the key
          formData.append('file', file);

          // Make a POST request to the Python route
          fetch('/AESencryptFile', {
              method: 'POST',
              body: formData
          })
          .then(response => {
              if (response.ok) {
                  return response.json();
              }
              throw new Error('Network response was not ok.');
          })
          .then(data => {
              // Handle the response data from the server if needed
              console.log('Encryption successful:', data);
          })
          .catch(error => {
              console.error('Error:', error);
          });
      };
      reader.readAsText(file); // Read file content as text
  } else {
      console.error('No file selected');
  }
}





const fileInput = document.getElementById('file-input-key');

// Add an event listener for file selection change
fileInput.addEventListener('change', function () {
    const selectedFiles = fileInput.files;

    if (selectedFiles.length > 0) {
        // Assuming you only want to display the name of the first file if multiple files are selected
        const fileName = selectedFiles[0].name;
        document.getElementById('selected-file-name').textContent = `Selected file: ${fileName}`;



    } else {
        // If no file is selected, display a default message or clear the displayed file name
        document.getElementById('selected-file-name').textContent = 'No file selected';
    }
});


//download.html \/
function loaddata() {
  console.log(global_data)
}



function createFileList(global_data) {
  encrypted_data = global_data
  console.log(global_data)
  console.log(encrypted_data)
  // Assuming encrypted_data is an array of objects
  // For example: encrypted_data = [{ "encrypted_data": "...", "filename": "file1.txt" }, { "encrypted_data": "...", "filename": "file2.txt" }];
  
  const tableBody = document.querySelector('#fileTable tbody');

  // Clear existing table rows
  tableBody.innerHTML = '';

  // Loop through the encrypted_data array and populate the table
  encrypted_data.forEach(dataItem => {
    const row = tableBody.insertRow();
    const filenameCell = row.insertCell(0);
    const encryptedCell = row.insertCell(1);

    filenameCell.textContent = dataItem.filename;
    encryptedCell.textContent = dataItem.encrypted_data;
  });
}