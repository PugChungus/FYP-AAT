let db

export function openIndexDB(jwk_private, user_email) {
  // Open specific to user email
  const DBOpenRequest = window.indexedDB.open(`${user_email}_db`, 4);

  DBOpenRequest.onupgradeneeded = (event) => {
    console.log("Database upgrade needed");
    db = event.target.result;

    // Check if object store already exists
    if (!db.objectStoreNames.contains(`${user_email}__Object_Store`)) {
      const objectStore = db.createObjectStore(`${user_email}__Object_Store`, {
        keyPath: "keyName",
      });

      // Define what data items the objectStore will contain
      objectStore.createIndex("keyName", "keyName", { unique: false });
      objectStore.createIndex("privateKey", "privateKey", { unique: false });
      objectStore.createIndex("email", "email", { unique: false });
      objectStore.createIndex("dateCreated", "dateCreated", { unique: false });
    }
    else {
      const objectStore = transaction.objectStore(`${user_email}__Object_Store`);

      if (!objectStore.indexNames.contains("keyName")) {
        objectStore.createIndex("keyName", "keyName", { unique: false });
      }
      // Check if indexes exist; if not, create them
      if (!objectStore.indexNames.contains("privateKey")) {
        objectStore.createIndex("privateKey", "privateKey", { unique: false });
      }
      if (!objectStore.indexNames.contains("email")) {
        objectStore.createIndex("email", "email", { unique: false });
      }
      if (!objectStore.indexNames.contains("dateCreated")) {
        objectStore.createIndex("dateCreated", "dateCreated", { unique: false });
      }
    }
  };

  DBOpenRequest.onsuccess = (event) => {
    db = event.target.result;

    // Check if object store exists
    if (!db.objectStoreNames.contains(`${user_email}__Object_Store`)) {
      console.error("Object store does not exist in the database");
      return;
    }

    addData(jwk_private, user_email);
    console.log("Database opened successfully");
  };

  DBOpenRequest.onerror = (error) => {
    console.error("Error opening database: ", error);
  };
}

function addData(jwk_private, user_email) {
  const transaction = db.transaction([`${user_email}__Object_Store`], "readwrite");
  const objectStore = transaction.objectStore(`${user_email}__Object_Store`);

  const newItem = {
    keyName: 'Private Key',
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
  const dbExists = await doesDatabaseExist(`${user_email}_db`);

  if (dbExists) {
    const objectStoreName = `${user_email}__Object_Store`;

    const DBOpenRequest = window.indexedDB.open(`${user_email}_db`, 4);

    DBOpenRequest.onsuccess = function (event) {
      const db = event.target.result;

      if (db.objectStoreNames.contains(objectStoreName)) {
        const transaction = db.transaction([objectStoreName], "readwrite");
        const objectStore = transaction.objectStore(objectStoreName);
        const request = objectStore.put(newData);

        request.onsuccess = function (event) {
          console.log('Data updated successfully');
        };

        request.onerror = function (event) {
          console.error('Error updating data: ', event.target.error);
        };
      } else {
        alert(`Object store '${objectStoreName}' does not exist. Please delete your current account and create a new account, if you still want to share your files.`);
      }
    };
  } else {
    alert(`DB ${user_email}_db does not exist. Please delete your current account and create a new account, if you still want to share your files.`);
  }
}

async function doesDatabaseExist(dbName) {
  return new Promise((resolve) => {
    const request = window.indexedDB.open(dbName);

    request.onsuccess = function () {
      request.result.close();
      resolve(true);
    };

    request.onerror = function () {
      resolve(false);
    };
  });
}

export function deleteIndexDB(user_email) {
  const dbName = `${user_email}_db`;
  const objectStoreName = `${user_email}__Object_Store`;

  const dbDeleteRequest = indexedDB.open(dbName, 4);

  dbDeleteRequest.onupgradeneeded = function (event) {
    const db = event.target.result;
    if (db.objectStoreNames.contains(objectStoreName)) {
      db.deleteObjectStore(objectStoreName);
      console.log(`Object store '${objectStoreName}' deleted successfully`);
    }
  };

  const deleteRequest = indexedDB.deleteDatabase(dbName);

  deleteRequest.onsuccess = function () {
    console.log('Database deleted successfully');
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