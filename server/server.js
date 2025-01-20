const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3080;
const mongoUrl = process.env.MONGO_URL || 'mongodb://mongodb:27017/tetris';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB connection
mongoose.connect(mongoUrl)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Score Schema
const scoreSchema = new mongoose.Schema({
    username: String,
    score: Number,
    date: Date
});

const Score = mongoose.model('Score', scoreSchema);

// API Routes
app.post('/api/scores', async (req, res) => {
    try {
        const score = new Score(req.body);
        await score.save();
        res.status(201).json(score);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/scores', async (req, res) => {
    try {
        const scores = await Score.find()
            .sort({ score: -1 })
            .limit(10);
        res.json(scores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
