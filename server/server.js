const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Ensure scores file exists
const scoresPath = path.join(__dirname, 'scores.json');

async function ensureScoresFile() {
  try {
    await fs.access(scoresPath);
  } catch {
    await fs.writeFile(scoresPath, JSON.stringify([]));
  }
}

// Helper function to filter scores by time period
function filterScoresByPeriod(scores, period) {
  const now = new Date();
  const periods = {
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000,
    monthly: 30 * 24 * 60 * 60 * 1000,
    allTime: Infinity
  };

  const timeAgo = periods[period] || periods.allTime;
  return scores.filter(score => {
    const scoreDate = new Date(score.date);
    return now - scoreDate <= timeAgo;
  });
}

// Helper function to calculate statistics
function calculateStatistics(scores, email) {
  if (!scores.length) return null;

  const userScores = scores.filter(score => score.email === email);
  const allTimes = scores.map(score => score.time);
  const userTimes = userScores.map(score => score.time);

  // Sort times for percentile calculations
  const sortedTimes = [...allTimes].sort((a, b) => a - b);

  // Calculate percentiles
  const calculatePercentile = (time) => {
    const position = sortedTimes.indexOf(time);
    return Math.round((1 - position / sortedTimes.length) * 100);
  };

  // Calculate speed ratings
  const calculateSpeedRating = (time) => {
    const mean = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;
    const variance = allTimes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / allTimes.length;
    const stdDev = Math.sqrt(variance);
    const zScore = (time - mean) / stdDev;
    // Convert z-score to a 0-100 rating where 50 is average
    return Math.max(0, Math.min(100, Math.round(50 - (zScore * 10))));
  };

  // Calculate time distributions
  const timeRanges = {
    under2min: allTimes.filter(t => t < 120000).length,
    under5min: allTimes.filter(t => t < 300000).length,
    under10min: allTimes.filter(t => t < 600000).length,
    over10min: allTimes.filter(t => t >= 600000).length
  };

  const globalStats = {
    bestTime: Math.min(...allTimes),
    averageTime: allTimes.reduce((a, b) => a + b, 0) / allTimes.length,
    medianTime: sortedTimes[Math.floor(sortedTimes.length / 2)],
    totalPlayers: new Set(scores.map(score => score.email)).size,
    totalGames: scores.length,
    timeDistribution: {
      under2min: (timeRanges.under2min / scores.length * 100).toFixed(1),
      under5min: (timeRanges.under5min / scores.length * 100).toFixed(1),
      under10min: (timeRanges.under10min / scores.length * 100).toFixed(1),
      over10min: (timeRanges.over10min / scores.length * 100).toFixed(1)
    }
  };

  const userStats = userScores.length ? {
    bestTime: Math.min(...userTimes),
    averageTime: userTimes.reduce((a, b) => a + b, 0) / userTimes.length,
    totalGames: userScores.length,
    rank: scores.filter(score => score.time < userScores[0].time).length + 1,
    bestPercentile: calculatePercentile(Math.min(...userTimes)),
    averagePercentile: calculatePercentile(userTimes.reduce((a, b) => a + b, 0) / userTimes.length),
    speedRating: calculateSpeedRating(Math.min(...userTimes)),
    improvement: userTimes.length > 1 ? 
      ((userTimes[0] - userTimes[userTimes.length - 1]) / userTimes[0] * 100).toFixed(1) : null,
    consistency: userTimes.length > 1 ? 
      (100 - (Math.sqrt(userTimes.reduce((a, b) => a + Math.pow(b - userTimes.reduce((c, d) => c + d, 0) / userTimes.length, 2), 0) / userTimes.length) / 
      (userTimes.reduce((a, b) => a + b, 0) / userTimes.length) * 100)).toFixed(1) : null
  } : null;

  return {
    globalStats,
    userStats
  };
}

// Routes
app.get('/api/scores', async (req, res) => {
  try {
    await ensureScoresFile();
    const scoresData = await fs.readFile(scoresPath, 'utf-8');
    const scores = JSON.parse(scoresData);
    const period = req.query.period || 'allTime';
    const email = req.query.email;

    const filteredScores = filterScoresByPeriod(scores, period);
    const statistics = calculateStatistics(scores, email);

    res.json({
      scores: filteredScores,
      statistics
    });
  } catch (error) {
    console.error('Error reading scores:', error);
    res.status(500).json({ error: 'Failed to read scores' });
  }
});

app.post('/api/scores', async (req, res) => {
  try {
    await ensureScoresFile();
    const { playerName, email, time, date } = req.body;
    
    if (!playerName || !email || time === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const scoresData = await fs.readFile(scoresPath, 'utf-8');
    const scores = JSON.parse(scoresData);
    
    // Check for duplicate submission within last 24 hours
    const lastDayScores = filterScoresByPeriod(scores, 'daily');
    const recentSubmission = lastDayScores.find(score => score.email === email);
    if (recentSubmission) {
      return res.status(400).json({ 
        error: 'You can only submit one score per day',
        nextSubmissionTime: new Date(recentSubmission.date).getTime() + (24 * 60 * 60 * 1000)
      });
    }

    const newScore = {
      id: Date.now(),
      playerName,
      email,
      time,
      date: date || new Date().toISOString()
    };
    
    scores.push(newScore);
    scores.sort((a, b) => a.time - b.time);
    
    await fs.writeFile(scoresPath, JSON.stringify(scores, null, 2));
    
    const statistics = calculateStatistics(scores, email);
    res.json({ score: newScore, statistics });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.get('/api/scores/top', async (req, res) => {
  try {
    await ensureScoresFile();
    const scoresData = await fs.readFile(scoresPath, 'utf-8');
    const scores = JSON.parse(scoresData);
    const period = req.query.period || 'allTime';
    
    const filteredScores = filterScoresByPeriod(scores, period);
    const topScores = filteredScores.slice(0, 10);
    
    res.json(topScores);
  } catch (error) {
    console.error('Error reading top scores:', error);
    res.status(500).json({ error: 'Failed to read top scores' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  ensureScoresFile();
});
