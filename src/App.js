import React from 'react';
import HomePage from './components/HomePage';
import GamePage from './components/GamePage';
import { GameProvider, useGame } from './context/GameContext';
import './App.css';

function AppContent() {
  const { gameStarted, startGame } = useGame();

  return (
    <div className="App">
      {!gameStarted ? (
        <HomePage onStartGame={startGame} />
      ) : (
        <GamePage />
      )}
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
