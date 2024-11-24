import React, { createContext, useState, useContext, useEffect } from 'react';

const GameContext = createContext();

const CHARACTER_LOCATIONS = {
  'Waldo': { xMin: 1560, xMax: 1610, yMin: 540, yMax: 660 },
  'Wizard Whitebeard': { xMin: 660, xMax: 740, yMin: 500, yMax: 640 },
  'Odlaw': { xMin: 260, xMax: 300, yMin: 500, yMax: 610 }
};

export function GameProvider({ children }) {
  const [gameStarted, setGameStarted] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [foundCharacters, setFoundCharacters] = useState({
    'Waldo': false,
    'Wizard Whitebeard': false,
    'Odlaw': false
  });
  const [gameCompleted, setGameCompleted] = useState(false);
  const [finalTime, setFinalTime] = useState(null);
  const [topScores, setTopScores] = useState([]);
  const [isLoadingScores, setIsLoadingScores] = useState(false);
  const [scoresError, setScoresError] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('allTime');

  // Check if all characters are found
  useEffect(() => {
    if (gameStarted && !gameCompleted && Object.values(foundCharacters).every(found => found)) {
      setGameCompleted(true);
      setFinalTime(elapsedTime);
    }
  }, [foundCharacters, gameStarted, gameCompleted]);

  // Start timer when game starts
  useEffect(() => {
    if (gameStarted && !startTime) {
      setStartTime(Date.now());
    }
  }, [gameStarted, startTime]);

  // Update elapsed time
  useEffect(() => {
    let timer;
    if (gameStarted && startTime && !gameCompleted) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameStarted, startTime, gameCompleted]);

  const checkCharacterFound = (x, y, selectedCharacter) => {
    let characterFound = null;
    
    Object.entries(CHARACTER_LOCATIONS).forEach(([character, location]) => {
      if (
        x >= location.xMin && x <= location.xMax &&
        y >= location.yMin && y <= location.yMax
      ) {
        characterFound = character;
      }
    });

    if (characterFound && characterFound === selectedCharacter) {
      setFoundCharacters(prev => ({
        ...prev,
        [characterFound]: true
      }));
      return true;
    }
    return false;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const startGame = () => {
    setGameStarted(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setGameCompleted(false);
    setFinalTime(null);
    setFoundCharacters({
      'Waldo': false,
      'Wizard Whitebeard': false,
      'Odlaw': false
    });
  };

  const fetchTopScores = async (period = selectedPeriod, email = null) => {
    setIsLoadingScores(true);
    setScoresError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/scores?period=${period}&email=${email || ''}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch scores');
      }
      const data = await response.json();
      setTopScores(data.scores);
      setStatistics(data.statistics);
    } catch (error) {
      console.error('Error fetching scores:', error);
      setScoresError(error.message);
    } finally {
      setIsLoadingScores(false);
    }
  };

  // Fetch scores when period changes
  useEffect(() => {
    if (gameCompleted) {
      fetchTopScores(selectedPeriod);
    }
  }, [gameCompleted, selectedPeriod]);

  const submitScore = async (playerName, email) => {
    try {
      const response = await fetch('http://localhost:3001/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          email,
          time: finalTime,
          date: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit score');
      }
      
      const data = await response.json();
      setStatistics(data.statistics);
      await fetchTopScores(selectedPeriod, email);
      return data;
    } catch (error) {
      console.error('Error submitting score:', error);
      throw error;
    }
  };

  const value = {
    gameStarted,
    startGame,
    elapsedTime,
    formatTime,
    foundCharacters,
    checkCharacterFound,
    gameCompleted,
    finalTime,
    submitScore,
    topScores,
    isLoadingScores,
    scoresError,
    fetchTopScores,
    statistics,
    selectedPeriod,
    setSelectedPeriod
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
