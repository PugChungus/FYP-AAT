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
        const files = data[google.picker.Response.DOCUMENTS];

        // Process each picked file
        for (const file of files) {
            const fileId = file[google.picker.Document.ID];
            const res = await gapi.client.drive.files.get({
                'fileId': fileId,
                'fields': '*',
            });

            // Access the file data and pass it to the uploader
            const fileData = {
                id: fileId,
                name: res.result.name,
                size: res.result.size,
                mimeType: res.result.mimeType,
                // Add more necessary file details as needed
            };
            
            // Pass fileData to the uploader function
            uploadFile(fileData);
        }
    }
}



function uploadFile(fileData) {
    // Display file details in the file details container
    const fileDetailsContainer = document.getElementById('file-details-container');

    // Create a div element for the selected file
    const fileContainer = document.createElement('div');
    fileContainer.classList.add('file-container');

    // Display file name
    const fileName = document.createElement('div');
    fileName.textContent = `File Name: ${fileData.name}`;
    fileContainer.appendChild(fileName);

    // Display file size
    const fileSize = document.createElement('div');
    fileSize.textContent = `File Size: ${formatFileSize(fileData.size)}`;
    fileContainer.appendChild(fileSize);

    // Append file container to the details container
    fileDetailsContainer.appendChild(fileContainer);

    // You can perform other actions here using fileData if needed
    // For example, initiate an AJAX request to upload the file or perform other operations
}