const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import cors

require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Use environment variable for secret
const USERS_FILE = path.join(__dirname, 'users.json');
const POSTS_FILE = path.join(__dirname, 'posts.json');

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Body parser for JSON requests

// Load users from JSON file, or create if it doesn't exist
let users = [];
if (fs.existsSync(USERS_FILE)) {
    try {
        users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (error) {
        console.error('Error reading users.json:', error);
        users = [];
    }
} else {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

// Load posts from JSON file
let posts = [];
if (fs.existsSync(POSTS_FILE)) {
    try {
        posts = JSON.parse(fs.readFileSync(POSTS_FILE, 'utf8'));
    } catch (error) {
        console.error('Error reading posts.json:', error);
        posts = [];
    }
} else {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2));
}

// Helper to save users to file
const saveUsers = () => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Helper to save posts to file
const savePosts = () => {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
};

// --- Validation Functions ---
function isValidEmail(email) {
    return /^[\w.-]+@[\w.-]+\.\w+$/.test(email);
}

function isValidPassword(password) {
    const minLength = 8;
    const maxLength = 25;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (password.length < minLength || password.length > maxLength || !hasUpperCase || !hasNumber) {
        return false; // Does not meet password requirements
    }
    return true; // Password is valid
}

// Basic middleware to protect routes
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Middleware to check for Admin role
const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admins only' });
    }
};

// --- Authentication Routes ---

// Register User
app.post('/api/auth/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body; // Destructure firstName and lastName

    // Server-side validation
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (!isValidPassword(password)) {
        return res.status(400).json({ message: 'Password must be 8-25 characters long, contain at least one capital letter, and at least one number.' });
    }

    // Check for existing user
    if (users.some(user => user.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1, // Simple ID generation
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 'user' // Default to user role
        };
        users.push(newUser);
        saveUsers();

        // Generate token
        const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: { id: newUser.id, email: newUser.email, role: newUser.role }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login User
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.json({
            message: 'Logged in successfully',
            token,
            user: { id: user.id, email: user.email, role: user.role }
        });

    } catch (err) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// --- Post Management Routes (Admin Only) ---

// Create New Post (General or Polled)
app.post('/api/posts', auth, authorizeAdmin, (req, res) => {
    const { type, title, content, imageUrl, videoUrl, question, options } = req.body;

    if (!type || !title || (!content && !question)) {
        return res.status(400).json({ message: 'Missing required post fields' });
    }

    const newPost = {
        id: posts.length > 0 ? Math.max(...posts.map(p => p.id)) + 1 : 1,
        author: req.user.email, // Author is the logged-in admin's email
        date: new Date().toISOString(),
        type,
        title,
    };

    if (type === 'general') {
        newPost.content = content;
        if (imageUrl) newPost.imageUrl = imageUrl;
        if (videoUrl) newPost.videoUrl = videoUrl;
    } else if (type === 'polled') {
        if (!question || !options || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ message: 'Polled post requires a question and at least two options' });
        }
        newPost.question = question;
        newPost.options = options.map(opt => ({ text: opt, votes: 0 }));
        newPost.totalVotes = 0;
    } else {
        return res.status(400).json({ message: 'Invalid post type' });
    }

    posts.push(newPost);
    savePosts();
    res.status(201).json({ message: 'Post created successfully', post: newPost });
});

// --- Feed Retrieval ---

app.get('/api/feed', (req, res) => {
    // Sort posts by date, most recent first
    const sortedPosts = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

    // For non-admin users, hide poll vote counts
    const userRole = req.user ? req.user.role : 'guest';
    const filteredPosts = sortedPosts.map(post => {
        if (post.type === 'polled' && userRole !== 'admin') {
            const { votes, ...rest } = post;
            return { ...rest, options: post.options.map(opt => ({ text: opt.text })) }; // Hide votes for non-admins
        }
        return post;
    });

    res.json(filteredPosts);
});

// --- Poll Voting (User & Admin) ---
app.post('/api/posts/:id/vote', auth, (req, res) => {
    const postId = parseInt(req.params.id);
    const { optionIndex } = req.body;

    const post = posts.find(p => p.id === postId);

    if (!post || post.type !== 'polled') {
        return res.status(404).json({ message: 'Poll post not found' });
    }
    if (optionIndex === undefined || optionIndex < 0 || optionIndex >= post.options.length) {
        return res.status(400).json({ message: 'Invalid option selected' });
    }

    // Increment vote for the selected option
    post.options[optionIndex].votes++;
    post.totalVotes++;
    savePosts();

    res.json({ message: 'Vote cast successfully', post });
});

// --- Poll Results (Admin Only) ---
app.get('/api/posts/:id/results', auth, authorizeAdmin, (req, res) => {
    const postId = parseInt(req.params.id);
    const post = posts.find(p => p.id === postId);

    if (!post || post.type !== 'polled') {
        return res.status(404).json({ message: 'Poll post not found' });
    }

    // Return detailed poll results
    res.json({
        id: post.id,
        question: post.question,
        options: post.options,
        totalVotes: post.totalVotes
    });
});

// Example protected route (can be used for testing auth)
app.get('/api/protected', auth, (req, res) => {
    res.json({ message: `Welcome ${req.user.email}! You are a ${req.user.role}. This is a protected route.` });
});

// --- Admin Dashboard Data Routes ---

// Get Dashboard Statistics (Admin Only)
app.get('/api/admin/dashboard-stats', auth, authorizeAdmin, (req, res) => {
    const totalUsers = users.length;
    const totalAdmins = users.filter(user => user.role === 'admin').length;

    // Placeholder data for website visits and total time spent
    // Real-time tracking would require more complex implementation (e.g., database, session management)
    const websiteVisits = 12345; // Example value
    const totalTimeSpent = "500 hours"; // Example value

    res.json({
        totalUsers,
        totalAdmins,
        websiteVisits,
        totalTimeSpent
    });
});

// --- User Management Routes (Admin Only) ---

// Get all users
app.get('/api/admin/users', auth, authorizeAdmin, (req, res) => {
    // Return users without their hashed passwords
    const usersData = users.map(user => ({ id: user.id, email: user.email, role: user.role }));
    res.json(usersData);
});

// Update user role
app.put('/api/admin/users/:id/role', auth, authorizeAdmin, (req, res) => {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!role || (role !== 'user' && role !== 'admin')) {
        return res.status(400).json({ message: 'Invalid role specified.' });
    }

    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found.' });
    }

    users[userIndex].role = role;
    saveUsers();

    res.json({ message: `User ${users[userIndex].email} role updated to ${role}.`, user: { id: users[userIndex].id, email: users[userIndex].email, role: users[userIndex].role } });
});

// --- Post Deletion Route (Admin Only) ---
app.delete('/api/posts/:id', auth, authorizeAdmin, (req, res) => {
    const postId = parseInt(req.params.id);
    const initialLength = posts.length;
    posts = posts.filter(post => post.id !== postId);

    if (posts.length < initialLength) {
        savePosts();
        res.json({ message: 'Post deleted successfully.' });
    } else {
        res.status(404).json({ message: 'Post not found.' });
    }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 