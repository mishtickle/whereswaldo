import React from 'react';
import { useGame } from '../context/GameContext';
import './Leaderboard.css';

function Leaderboard() {
  const {
    topScores,
    isLoadingScores,
    scoresError,
    formatTime,
    fetchTopScores,
    statistics,
    selectedPeriod,
    setSelectedPeriod
  } = useGame();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    const { globalStats, userStats } = statistics;

    const renderSpeedRating = (rating) => {
      let ratingText = 'Average';
      let ratingColor = '#6c757d';
      
      if (rating >= 90) {
        ratingText = 'Legendary';
        ratingColor = '#ff4081';
      } else if (rating >= 80) {
        ratingText = 'Expert';
        ratingColor = '#7c4dff';
      } else if (rating >= 70) {
        ratingText = 'Advanced';
        ratingColor = '#448aff';
      } else if (rating >= 60) {
        ratingText = 'Skilled';
        ratingColor = '#00bcd4';
      } else if (rating >= 40) {
        ratingText = 'Average';
        ratingColor = '#4caf50';
      } else if (rating >= 30) {
        ratingText = 'Beginner';
        ratingColor = '#ff9800';
      } else {
        ratingText = 'Novice';
        ratingColor = '#f44336';
      }

      return (
        <div className="speed-rating" style={{ color: ratingColor }}>
          <span className="rating-number">{rating}</span>
          <span className="rating-text">{ratingText}</span>
        </div>
      );
    };

    return (
      <div className="statistics">
        <div className="stats-section">
          <h3>Global Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <label>Best Time:</label>
              <span>{formatTime(globalStats.bestTime)}</span>
            </div>
            <div className="stat-item">
              <label>Average Time:</label>
              <span>{formatTime(globalStats.averageTime)}</span>
            </div>
            <div className="stat-item">
              <label>Median Time:</label>
              <span>{formatTime(globalStats.medianTime)}</span>
            </div>
            <div className="stat-item">
              <label>Total Players:</label>
              <span>{globalStats.totalPlayers}</span>
            </div>
          </div>

          <h4>Time Distribution</h4>
          <div className="time-distribution">
            <div className="distribution-bar">
              <div className="bar-segment under-2" style={{ width: `${globalStats.timeDistribution.under2min}%` }}>
                <span className="segment-label">&lt;2m</span>
              </div>
              <div className="bar-segment under-5" style={{ width: `${globalStats.timeDistribution.under5min}%` }}>
                <span className="segment-label">&lt;5m</span>
              </div>
              <div className="bar-segment under-10" style={{ width: `${globalStats.timeDistribution.under10min}%` }}>
                <span className="segment-label">&lt;10m</span>
              </div>
              <div className="bar-segment over-10" style={{ width: `${globalStats.timeDistribution.over10min}%` }}>
                <span className="segment-label">&gt;10m</span>
              </div>
            </div>
          </div>
        </div>
        
        {userStats && (
          <div className="stats-section">
            <h3>Your Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <label>Best Time:</label>
                <span>{formatTime(userStats.bestTime)}</span>
              </div>
              <div className="stat-item">
                <label>Average Time:</label>
                <span>{formatTime(userStats.averageTime)}</span>
              </div>
              <div className="stat-item">
                <label>Total Games:</label>
                <span>{userStats.totalGames}</span>
              </div>
              <div className="stat-item">
                <label>Current Rank:</label>
                <span>#{userStats.rank}</span>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-item">
                <label>Best Percentile:</label>
                <span className="percentile">
                  Top {userStats.bestPercentile}%
                </span>
              </div>
              <div className="stat-item">
                <label>Average Percentile:</label>
                <span className="percentile">
                  Top {userStats.averagePercentile}%
                </span>
              </div>
              <div className="stat-item">
                <label>Speed Rating:</label>
                {renderSpeedRating(userStats.speedRating)}
              </div>
              {userStats.improvement !== null && (
                <div className="stat-item">
                  <label>Improvement:</label>
                  <span className={userStats.improvement > 0 ? 'positive' : 'negative'}>
                    {userStats.improvement}%
                  </span>
                </div>
              )}
            </div>

            {userStats.consistency !== null && (
              <div className="consistency-meter">
                <label>Consistency Rating:</label>
                <div className="meter">
                  <div 
                    className="meter-fill"
                    style={{ 
                      width: `${userStats.consistency}%`,
                      backgroundColor: `hsl(${userStats.consistency * 1.2}, 70%, 50%)`
                    }}
                  />
                </div>
                <span className="consistency-value">{userStats.consistency}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoadingScores) {
    return (
      <div className="leaderboard">
        <h2>Top Scores</h2>
        <div className="loading">Loading scores...</div>
      </div>
    );
  }

  if (scoresError) {
    return (
      <div className="leaderboard">
        <h2>Top Scores</h2>
        <div className="error">
          {scoresError}
          <button onClick={fetchTopScores} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2>Top Scores</h2>
      
      <div className="period-filter">
        <button
          className={selectedPeriod === 'daily' ? 'active' : ''}
          onClick={() => handlePeriodChange('daily')}
        >
          Daily
        </button>
        <button
          className={selectedPeriod === 'weekly' ? 'active' : ''}
          onClick={() => handlePeriodChange('weekly')}
        >
          Weekly
        </button>
        <button
          className={selectedPeriod === 'monthly' ? 'active' : ''}
          onClick={() => handlePeriodChange('monthly')}
        >
          Monthly
        </button>
        <button
          className={selectedPeriod === 'allTime' ? 'active' : ''}
          onClick={() => handlePeriodChange('allTime')}
        >
          All Time
        </button>
      </div>

      {renderStatistics()}
      
      {topScores.length === 0 ? (
        <p className="no-scores">No scores yet for this time period. Be the first!</p>
      ) : (
        <div className="scores-table">
          <div className="table-header">
            <div className="rank">#</div>
            <div className="name">Player</div>
            <div className="time">Time</div>
            <div className="date">Date</div>
          </div>
          {topScores.map((score, index) => (
            <div key={score.id} className="score-row">
              <div className="rank">{index + 1}</div>
              <div className="name">{score.playerName}</div>
              <div className="time">{formatTime(score.time)}</div>
              <div className="date">{formatDate(score.date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
