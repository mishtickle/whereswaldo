import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import Leaderboard from './Leaderboard';
import './ScoreSubmission.css';

function ScoreSubmission() {
  const { finalTime, formatTime, submitScore } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [nextSubmissionTime, setNextSubmissionTime] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !email.trim()) {
      setError('Please enter both your name and email');
      return;
    }

    try {
      const result = await submitScore(playerName.trim(), email.trim());
      setSubmitted(true);
      setError(null);
    } catch (err) {
      if (err.nextSubmissionTime) {
        setNextSubmissionTime(err.nextSubmissionTime);
        setError(`You can submit again ${new Date(err.nextSubmissionTime).toLocaleString()}`);
      } else {
        setError(err.message || 'Failed to submit score');
      }
    }
  };

  if (submitted) {
    return (
      <div className="score-submission">
        <h2>Score Submitted!</h2>
        <p>Your time: {formatTime(finalTime)}</p>
        <Leaderboard />
      </div>
    );
  }

  return (
    <div className="score-submission">
      <h2>Congratulations!</h2>
      <p>You completed the game in {formatTime(finalTime)}</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="playerName">Enter your name:</label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={20}
            placeholder="Your name"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Enter your email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
          />
          <small className="email-note">
            * You can only submit one score per day with the same email
          </small>
        </div>
        {error && <div className="error">{error}</div>}
        {nextSubmissionTime && (
          <div className="next-submission">
            Next submission available: {new Date(nextSubmissionTime).toLocaleString()}
          </div>
        )}
        <button type="submit">Submit Score</button>
      </form>
    </div>
  );
}

export default ScoreSubmission;
