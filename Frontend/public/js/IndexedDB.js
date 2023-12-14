//make storage persistent 
// find out if onupgradeneeded is even running
//find out whats the point createindex

let db;
const DBOpenRequest = window.indexedDB.open("toDoList2", 4);

DBOpenRequest.onsuccess = (event) => {
  console.log("Database initialized");
  db = event.target.result;

  // Call addData function here
  addData();
};

DBOpenRequest.onupgradeneeded = (event) => {
  const upgradedDB = event.target.result;

  // Create an objectStore for this database
  const objectStore = upgradedDB.createObjectStore("toDoList2", {
    keyPath: "taskTitle",
  });

  // Define what data items the objectStore will contain
  objectStore.createIndex("hours", "hours", { unique: false });
  objectStore.createIndex("minutes", "minutes", { unique: false });
  objectStore.createIndex("day", "day", { unique: false });
  objectStore.createIndex("month", "month", { unique: false });
  objectStore.createIndex("year", "year", { unique: false });
  objectStore.createIndex("notified", "notified", { unique: false });
  objectStore.createIndex("taskTitle", "taskTitle", { unique: false });

  const hoursIndex = objectStore.index("hours");
  console.log(hoursIndex)

  // Note: No need to call addData() here; it should be called in the onsuccess handler
};

function addData() {
  // Create a new object ready to insert into the IDB
  const newItem = [
    {
      hours: 19,
      minutes: 30,
      day: 24,
      month: "December",
      year: 2013,
      notified: "no",
      taskTitle: "Walk dog",
    },
  ];

  // open a read/write db transaction, ready for adding the data
  const transaction = db.transaction(["toDoList2"], "readwrite");

  // report on the success of the transaction completing, when everything is done
  transaction.oncomplete = (event) => {
    console.log("Transaction completed");
  };

  transaction.onerror = (event) => {
    console.log("Transaction not opened due to error. Duplicate items not allowed.");
  };

  // create an object store on the transaction
  const objectStore = transaction.objectStore("toDoList2");
  console.log(objectStore.transaction);

  // Make a request to add our newItem object to the object store
  const objectStoreRequest = objectStore.add(newItem[0]);

  objectStoreRequest.onsuccess = (event) => {
    // report the success of our request
    console.log("Request successful.");
  };
}
