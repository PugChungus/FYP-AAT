let db;

export function openIndexDB(jwk_private, user_email) {
    //open specific to user email
    const DBOpenRequest = window.indexedDB.open(`${user_email}_db`, 4);
    DBOpenRequest.onupgradeneeded = (event) => {
        console.log("Database upgrade needed");
        db = event.target.result;
    
        if (!db.objectStoreNames.contains(`${user_email}__Object_Store`)) {
          const objectStore = db.createObjectStore(`${user_email}__Object_Store`, {
            keyPath: "Private Key",
          });
    
          // // define what data items the objectStore will contain
          objectStore.createIndex("privateKey", "privateKey", { unique: false });
          objectStore.createIndex("email", "email", { unique: false });
          objectStore.createIndex("dateCreated", "dateCreated", { unique: false });
          addData(jwk_private, user_email)
        }
    };
}

function addData(user_email) {
  const transaction = db.transaction([`${user_email}__Object_Store`], "readwrite");
  const objectStore = transaction.objectStore(`${user_email}__Object_Store`);

  const newItem = {
    privateKey: jwk_private,
    email: user_email,
    dateCreated: getCurrentTime(),
  };

  const addRequest = objectStore.add(newItem);

  addRequest.onsuccess = () => {
    console.log("Data added successfully");
  };

  addRequest.onerror = (error) => {
    console.error("Error adding data: ", error);
  };
}

export async function updateData(user_email, newData) {
  const DBOpenRequest = window.indexedDB.open(`${user_email}_db`, 4);
  DBOpenRequest.onsuccess = (event) => {
    db = event.target.result;
    const transaction = db.transaction([`${user_email}__Object_Store`], "readwrite");
    const objectStore = transaction.objectStore(`${user_email}__Object_Store`);
    const request = objectStore.put(newData);
    request.onsuccess = function (event) {
      console.log('Data updated successfully');
    };
    request.onerror = function (event) {
      console.error('Error updating data: ', event.target.error);
    };
  };
}

export function getCurrentTime() {
  const now = new Date();

  // Get the current date components
  const year = now.getFullYear().toString(); // Get the last two digits of the year
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
  const day = now.getDate().toString().padStart(2, '0');

  // Get the current time components
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  // Combine the components into the desired format
  const currentTime = `${day}/${month}/${year} ${hours}:${minutes}`;

  console.log(currentTime);

  return currentTime;
}


// function addData(user_email) {
//     const transaction = db.transaction([`${user_email}__Object_Store`], "readwrite");
//     const objectStore = transaction.objectStore(`${user_email}__Object_Store`);

//     const newItem = {
//       privateKey: jwk_private,
//       email: user_email,
//       dateCreated: getCurrentTime(),
//     };

//     const addRequest = objectStore.add(newItem);

//     addRequest.onsuccess = () => {
//       console.log("Data added successfully");
//     };

//     addRequest.onerror = (error) => {
//       console.error("Error adding data: ", error);
//     };
// }

// function getCurrentTime() {
//     const now = new Date();
  
//     // Get the current date components
//     const year = now.getFullYear().toString(); // Get the last two digits of the year
//     const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
//     const day = now.getDate().toString().padStart(2, '0');
  
//     // Get the current time components
//     const hours = now.getHours().toString().padStart(2, '0');
//     const minutes = now.getMinutes().toString().padStart(2, '0');
  
//     // Combine the components into the desired format
//     const currentTime = `${day}/${month}/${year} ${hours}:${minutes}`;

//     console.log(currentTime);
  
//     return currentTime;
// }