// server.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { check, validationResult } = require('express-validator');
const app = express();

// Configure session middleware
app.use(session({
    secret: 'gggerrwhjmniw23hskslkmmnawwebkit',
    resave: false,
    saveUninitialized: true
}));

// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'learners_app'
});

connection.connect((err)=>{
    if (err){
        console.error('Error connecting to mySQL: ', err.stack);
        return;
    }
    console.log('Successfully connected to mySQL');
});

// Serve static files from the default directory
app.use(express.static(__dirname));

// Set up middleware to parse incoming JSON data
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));

// Define routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/leaderboard', (req, res) => {
    res.sendFile(__dirname + '/leaderboard.html');
    // Your code to retrieve data from the leaderboard table and render a response
    res.send('This is the leaderboard page');
});

const user={
    tableName: 'users',
    createUser: function(newUser,callback){
        connection.query(`INSERT INTO ${this.tableName} SET?`, newUser,callback);
    },
    getUserbyEmail: function(email,callback){
        connection.query(`SELECT * FROM ${this.tableName} WHERE email =?`,email,callback);
    },
    getUserbyUsername: function(username,callback){
        connection.query(`SELECT * FROM ${this.tableName} WHERE us =?`,username,callback);
    }
}

// Registration route
app.post('/register', [
    // Validate email and username fields
    check('email').isEmail(),
    check('username').isAlphanumeric().withMessage('Username must be alphanumeric'),

    // Custom validation to check if email and username are unique
    check('email').custom(async (value) => {
        const existingUser = await User.findOne({ email: value });
        if (existingUser) {
            throw new Error('Email already exists');
        }
    }),
    check('username').custom(async (value) => {
        const existingUser = await User.findOne({ username: value });
        if (existingUser) {
            throw new Error('Username already exists');
        }
    }),
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        // Create a new user object
        const newUser = new User({
            email: req.body.email,
            username: req.body.username,
            password: hashedPassword,
            full_name: req.body.full_name
        });

        // Save the new user to the database
        await newUser.save();

        // Respond with success message
        res.status(201).json({ message: 'Registration successful', user: newUser });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }


    
    // Save the user to the database
    try {
        const savedUser = await newUser.save();
        res.status(201).json(savedUser); // Return the newly created user
    } catch (err) {
        res.status(500).json({ error: err.message }); // Handle database errors
    }

});

// Login route
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    // Retrieve user from database
    connection.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            res.status(401).send('Invalid username or password');
        } else {
            const user = results[0];
            // Compare passwords
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    // Store user in session
                    req.session.user = user;
                    res.send('Login successful');
                } else {
                    res.status(401).send('Invalid username or password');
                }
            });
        }
    });
});

// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy();
    res.send('Logout successful');
});

//Dashboard route
app.get('/dashboard', (req, res) => {
    // Assuming you have middleware to handle user authentication and store user information in req.user
    const userFullName = req.user.full_name;
    res.render('dashboard', { fullName: userFullName });
});

// Route to retrieve course content
app.get('/course/:id', (req, res) => {
    const courseId = req.params.id;
    const sql = 'SELECT * FROM courses WHERE id = ?';
    db.query(sql, [courseId], (err, result) => {
      if (err) {
        throw err;
      }
      // Send course content as JSON response
      res.json(result);
    });
  });

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
