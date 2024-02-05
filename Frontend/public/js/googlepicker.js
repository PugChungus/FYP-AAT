
import { sendFileToBackend } from "./virustotal.js";
document.getElementById('googlepocker').addEventListener('click', function(event) {
  event.preventDefault();
  handleAuthClick();
});

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

  }


  function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
  client_id: CLIENT_ID,
  scope: SCOPES,
  callback: '', // defined later
  });

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
  export async function getGoogleToken() {
    return new Promise((resolve, reject) => {
      gisLoaded()
      gapiLoaded()
        tokenClient.callback = async (response) => {
            if (response.error !== undefined) {
                reject(response);
            } else {
                const accessToken = response.access_token;
                console.log(accessToken);
                resolve(accessToken);
            }
        };

        if (accessToken === null) {
            // Prompt the user to select a Google Account and ask for consent to share their data
            // when establishing a new session.
            tokenClient.requestAccessToken({ prompt: "consent" });
        } else {
            // Skip display of account chooser and consent dialog for an existing session.
            tokenClient.requestAccessToken({ prompt: "consent" });
        }
    });
  }


    

  function handleAuthClick() {

      gisLoaded()
      gapiLoaded()
      console.log(tokenClient)
      tokenClient.callback = async (response) => {
      if (response.error !== undefined) {
          throw (response);
          }
      
      
      accessToken = response.access_token;
      

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
              Authorization: `Bearer: ${accessToken}` // Include the access token in the Authorization header
    
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
            const file = new File([blobe], document[google.picker.Document.NAME]);
            sendFileToBackend(file)
            
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




