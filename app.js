const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'ElcarOwi22!',
    database: process.env.DB_NAME || 'candleshop',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Session configuration
app.use(session({
    secret: 'your-secret-key', // Change this to a secure key
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Set to true if using HTTPS
        maxAge: 1000 * 60 * 60 // 1 hour
    }
}));

// Test MySQL connection
pool.getConnection((err, connection) => {
    if (err) throw err; // Not connected
    console.log('Connected to MySQL Database.');
    connection.release(); // Release connection back to pool
});

// Route to get all products
app.get('/products', (req, res) => {
    const sql = 'SELECT * FROM products';
    pool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Error fetching products');
        }
        res.json(results);
    });
});

// Route to get a single product by ID
app.get('/products/:id', (req, res) => {
    const productId = req.params.id;
    const sql = 'SELECT * FROM products WHERE id = ?';
    pool.query(sql, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            return res.status(500).send('Error fetching product');
        }
        if (results.length === 0) {
            return res.status(404).send('Product not found');
        }
        res.json(results[0]); // Send the product details
    });
});

// Route to register a new user
app.post('/register', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Email and password are required');
    }

    // Hash the password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return res.status(500).send('Error registering user');
        }

        const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
        pool.query(sql, [email, hash], (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).send('Error registering user');
            }
            res.status(201).send('User registered successfully');
        });
    });
});

// Route to login a user
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM users WHERE email = ?';
    pool.query(sql, [email], (err, results) => {
        if (err) {
            console.error('Error fetching user:', err);
            return res.status(500).send('Error logging in');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid email or password');
        }

        const user = results[0];

        // Compare password with hashed password
        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                console.error('Error comparing passwords:', err);
                return res.status(500).send('Error logging in');
            }

            if (!match) {
                return res.status(401).send('Invalid email or password');
            }

            // Store user ID in session
            req.session.userId = user.id;
            res.send('Logged in successfully');
        });
    });
});

// Check user login status middleware
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next();
    }
    res.status(401).send('You must be logged in to view this page');
}

// Route to handle checkout
app.post('/checkout', isAuthenticated, (req, res) => {
    const { name, email, address, cardNumber, cvv, cart } = req.body;

    // Basic validation
    if (!name || !email || !address || !cardNumber || !cvv || !cart) {
        return res.status(400).send('All fields are required');
    }

    const sql = 'INSERT INTO orders (name, email, address, card_number, cvv, cart) VALUES (?, ?, ?, ?, ?, ?)';
    pool.query(sql, [name, email, address, cardNumber, cvv, JSON.stringify(cart)], (err, result) => {
        if (err) {
            console.error('Error inserting order:', err);
            return res.status(500).send('Error processing order');
        }
        res.status(201).send('Order created successfully');
    });
});

// Logout endpoint
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error logging out:', err);
            return res.status(500).send('Error logging out');
        }
        res.send('Logged out successfully');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
