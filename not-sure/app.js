// Importing express module.
var express = require('express');
// Starting up an instance of app.
var app = express();

// Defining a route at '/' (our root route).
app.get('/', function(req, res) {
    // Sending a response of 'Welcome to our app!'
    res.send('Welcome to our app!');
});

// Defining a route at '/about'
app.get('/about', function(req, res) {
    // Sending a response of 'About this app.'
    res.send('About this app.');
});

// Defining a route at '/users'
app.get('/users', function(req, res) {
    // This could be replaced with a database call in a real-world application.
    // For simplicity, we are returning a hardcoded list.
    var users = [
        { name: 'John', age: 25 },
        { name: 'Jane', age: 23 },
        { name: 'Doe', age: 29 }
    ];

    // Send the list of users as a response.
    res.json(users);
});

// Setting up the server to listen at port 3000.
app.listen(3000, function() {
    console.log('App is listening on port 3000');
});
