
// Load Express, the framework we use to create the web server.
const express = require('express');

// Create an Express application.
const app = express();

// Use the deployment-provided port when available; otherwise use port 3000.
// Bind to all interfaces in hosted environments so the app stays reachable.
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// The home page route. A route handles requests for a particular URL.
app.get('/', (req, res) => {
    res.status(200).send('Welcome to my Node.js server!');
});

// Return the student's name and section as JSON.
app.get('/about', (req, res) => {
    res.status(200).json({
        name: 'V.Viswak Sain',
        section: 'S-26'
    });
});

// Return the current date and time. JSON converts the Date to an ISO string.
app.get('/time', (req, res) => {
    res.status(200).json({
        currentTime: new Date().toISOString()
    });
});

// This final route handles any URL that did not match the routes above.
app.use((req, res) => {
    res.status(404).send('404 - Page Not Found');
});

// Start the server and print its local address in the terminal.
app.listen(PORT, HOST, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
});
