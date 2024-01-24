  //make storage persistent
  //In this example, the "month" index is used to efficiently retrieve tasks for the month of December. 
  //Without the index, the database would need to scan all records to find tasks for a specific month,
  //which could be less efficient, especially as the dataset grows.
  let db;

  const DBOpenRequest = window.indexedDB.open("Major_Project_DB", 4);

  //onupgradeneeded only triggers when a new database is being created 
  DBOpenRequest.onupgradeneeded = (event) => {
    console.log("Database upgrade needed");
    db = event.target.result;

    if (!db.objectStoreNames.contains("Major_Project_Object_Store")) {
      const objectStore = db.createObjectStore("Major_Project_Object_Store", {
        keyPath: "taskTitle",
      });

      // // define what data items the objectStore will contain
      objectStore.createIndex("hours", "hours", { unique: false });
      objectStore.createIndex("minutes", "minutes", { unique: false });
      objectStore.createIndex("day", "day", { unique: false });
      objectStore.createIndex("month", "month", { unique: false });
      objectStore.createIndex("year", "year", { unique: false });
      objectStore.createIndex("notified", "notified", { unique: false });
      objectStore.createIndex("taskTitle", "taskTitle", { unique: false });
    }
  };

  DBOpenRequest.onsuccess = (event) => {
    console.log("Database initialized");
    db = event.target.result;

    // Perform CRUD operations
    // Uncomment the operation you want to test

    // Create
    // addData();

    // Read
    // readData();

    // Update
    // updateData();

    // Delete
    // deleteData();

    db.close();
  };

  function addData() {
    const transaction = db.transaction(["Major_Project_Object_Store"], "readwrite");
    const objectStore = transaction.objectStore("Major_Project_Object_Store");

    const newItem = {
      hours: 19,
      minutes: 30,
      day: 24,
      month: "December",
      year: 2013,
      notified: "no",
      taskTitle: "Walk dog",
    };

    const addRequest = objectStore.add(newItem);

    addRequest.onsuccess = () => {
      console.log("Data added successfully");
    };

    addRequest.onerror = (error) => {
      console.error("Error adding data: ", error);
    };
  }

  function readData() {
    const transaction = db.transaction(["Major_Project_Object_Store"], "readonly");
    const objectStore = transaction.objectStore("Major_Project_Object_Store");

    const getRequest = objectStore.get("Walk dog");

    getRequest.onsuccess = (event) => {
      const result = event.target.result;
      if (result) {
        console.log("Read data:", result);
      } else {
        console.log("No data found");
      }
    };

    getRequest.onerror = (error) => {
      console.error("Error reading data: ", error);
    };
  }

  function updateData() {
    const transaction = db.transaction(["Major_Project_Object_Store"], "readwrite");
    const objectStore = transaction.objectStore("Major_Project_Object_Store");

    const updateRequest = objectStore.put({
      hours: 20,
      minutes: 0,
      day: 24,
      month: "December",
      year: 2013,
      notified: "no",
      taskTitle: "Walk dog",
    });

    updateRequest.onsuccess = () => {
      console.log("Data updated successfully");
    };

    updateRequest.onerror = (error) => {
      console.error("Error updating data: ", error);
    };
  }

  function deleteData() {
    const transaction = db.transaction(["Major_Project_Object_Store"], "readwrite");
    const objectStore = transaction.objectStore("Major_Project_Object_Store");

    const deleteRequest = objectStore.delete("Walk dog");

    deleteRequest.onsuccess = () => {
      console.log("Data deleted successfully");
    };

    deleteRequest.onerror = (error) => {
      console.error("Error deleting data: ", error);
    };
  }

