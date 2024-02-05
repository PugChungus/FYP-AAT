
import { sendFileToBackend } from "./virustotal.js";
import { isValidFileExtension } from "./decrypt.js";

    
      document.getElementById('decryptlaunchPicker').addEventListener('click', function(event) {
        event.preventDefault();
        decryptlaunchPicker();
      });
    const msalParams = {
        auth: {
            authority:  "https://login.microsoftonline.com/consumers",
            clientId: "2ab80a1e-7300-4cb1-beac-c38c730e8b7f",
            redirectUri: "http://localhost:3000"
        },
    }

    const app = new msal.PublicClientApplication(msalParams);

    async function getToken() {

        let accessToken = "";
        
        const authParams = 
        { scopes: ["OneDrive.ReadWrite"],
        prompt: "select_account" };

        try {

            // see if we have already the idtoken saved
            const resp = await app.acquireTokenSilent(authParams);
            accessToken = resp.accessToken;

        } catch (e) {

            // per examples we fall back to popup
            const resp = await app.loginPopup(authParams);
            app.setActiveAccount(resp.account);

            if (resp.idToken) {

                const resp2 = await app.acquireTokenSilent(authParams);
                accessToken = resp2.accessToken;

            }
        }

        return accessToken;

    }

    export async function getTokenForRequest() {

        let accessToken = null;
        
        const
        authParams = 
        { scopes: ["OneDrive.ReadWrite"],
        prompt: "select_account" };
        // per examples we fall back to popup
        try {
            const resp = await app.loginPopup(authParams);
            app.setActiveAccount(resp.account);
            accessToken = resp.accessToken;
        } catch (error) {
            console.error("Error during login:", error);
            // Handle error (e.g., user canceled login, etc.)
        }
        return accessToken

    }

    async function testtoken() {
        const accessToken = await getTokenForRequest();

        if (accessToken !== null) {
            // Token retrieval was successful, proceed to launchPicker
            launchPicker(e)
        } else {
            // Token retrieval failed, handle accordingly
            console.error('Token retrieval failed. Cannot proceed.');
            // You might want to terminate or handle the error in some way
        }
    }

    


    const baseUrl = "https://onedrive.live.com/picker";

            // the options we pass to the picker page through the querystring
            const params = {
                sdk: "8.0",
                entry: {
                    oneDrive: {
                        files: {},
                    }
                },
                authentication: {},
                messaging: {
                    origin: "http://localhost:3000",
                    channelId: "27"
                },
                typesAndSources: {
                    mode: "files",
                    pivots: {
                        oneDrive: true,
                        recent: true,
                    },
                },
            };

            let win = null;
            let port = null;

            

            async function decryptlaunchPicker(e) {
                const authToken = await getTokenForRequest();
                // Ensure the token is available before proceeding
                if (!authToken) {
                    console.error('Token retrieval failed. Cannot proceed.');
                    return;
                }
                //e.preventDefault();

                win = window.open("", "Picker", "width=800,height=600")

                
                const queryString = new URLSearchParams({
                    filePicker: JSON.stringify(params),
                });

                const url = `${baseUrl}?${queryString}`;

                const form = win.document.createElement("form");
                form.setAttribute("action", url);
                form.setAttribute("method", "POST");
                win.document.body.append(form);

                const input = win.document.createElement("input");
                input.setAttribute("type", "hidden")
                input.setAttribute("name", "access_token");
                input.setAttribute("value", authToken);
                form.appendChild(input);

                form.submit();

                window.addEventListener("message", (event) => {

                    if (event.source && event.source === win) {

                        const message = event.data;

                        if (message.type === "initialize" && message.channelId === params.messaging.channelId) {

                            port = event.ports[0];

                            port.addEventListener("message", decryptmessageListener);

                            port.start();

                            port.postMessage({
                                type: "activate",
                            });
                        }
                    }
                });
            }

            async function decryptmessageListener(message) {
                switch (message.data.type) {

                    case "notification":
                        console.log(`notification: ${message.data}`);
                        break;

                    case "command":

                        port.postMessage({
                            type: "acknowledge",
                            id: message.data.id,
                        });

                        const command = message.data.data;

                        switch (command.command) {

                            case "authenticate":

                                // getToken is from scripts/auth.js
                                const token = await getToken();
                                //😍
                                if (typeof token !== "undefined" && token !== null) {

                                    port.postMessage({
                                        type: "result",
                                        id: message.data.id,
                                        data: {
                                            result: "token",
                                            token,
                                        }
                                    });

                                } else {
                                    console.error(`Could not get auth token for command: ${JSON.stringify(command)}`);
                                }

                                break;

                            case "close":
                                
                                win.close();
                                break;

                            case "pick":
                                const commanddata = JSON.parse(JSON.stringify(command))
                                console.log(commanddata)
                                console.log(commanddata.items)
                                const itemsArray = command.items;

                                if (itemsArray && Array.isArray(itemsArray) && itemsArray.length > 0) {
                                    // Assuming the first item in the 'items' array contains the desired data
                                    const firstItem = itemsArray[0];
                            
                                    // Access specific properties from 'firstItem' as needed
                                    const fileId = firstItem.id;
                                    console.log(fileId)
                                let downloadItemUrl =
                                    firstItem["@sharePoint.endpoint"]+
                                    "/drives/" +
                                    firstItem.parentReference.driveId +
                                    "/items/" +
                                    firstItem.id +
                                    "/content";
                                    console.log(downloadItemUrl)
                                    //const accessToken = getTokenForRequest()
                                    const token = await getToken();
                                    console.log("accessToken is here:" + token)
                                    let response = await fetch(downloadItemUrl, {
                                        headers: new Headers({
                                        authorization: "Bearer: " + token,
                                        }),
                                    });
                                    
                                    let file = new File([await response.blob()], firstItem.name);
                                    const isValidFileExtensionResult = isValidFileExtension(file);

                                    if (!isValidFileExtensionResult) {
                                        return "End of function.";
                                    }
                                    sendFileToBackend(file)
                                }
                                else{
                                    console.log(error)
                                }
                                
                                console.log(`Picked: ${JSON.stringify(command)}`);
                                
                                //document.getElementById("pickedFiles").innerHTML = `<pre>${JSON.stringify(command, null, 2)}</pre>`;

                                // port.postMessage({
                                //     type: "result",
                                //     id: message.data.id,
                                //     data: {
                                //         result: "success",
                                //     },
                                // });

                                win.close();

                                break;

                            default:

                                console.warn(`Unsupported command: ${JSON.stringify(command)}`, 2);

                                port.postMessage({
                                    result: "error",
                                    error: {
                                        code: "unsupportedCommand",
                                        message: command.command
                                    },
                                    isExpected: true,
                                });
                                break;
                        }

                        break;
                }
            }
            
        


        

