const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));


// Set up a route to render your HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/', 'login.html'));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
