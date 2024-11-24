import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import ScoreSubmission from './ScoreSubmission';
import './GamePage.css';

function GamePage() {
  const { 
    elapsedTime, 
    formatTime, 
    checkCharacterFound, 
    foundCharacters,
    gameCompleted 
  } = useGame();
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [clickIndicator, setClickIndicator] = useState(null);
  const gameContainerRef = useRef(null);
  const imageRef = useRef(null);
  
  const characters = ['Waldo', 'Wizard Whitebeard', 'Odlaw'];

  const handleImageClick = (e) => {
    if (gameCompleted) return;

    const rect = imageRef.current.getBoundingClientRect();
    
    // Calculate click position relative to the viewport
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Calculate the actual coordinates on the image
    const imageX = Math.round((clickX / rect.width) * imageRef.current.naturalWidth);
    const imageY = Math.round((clickY / rect.height) * imageRef.current.naturalHeight);

    // Calculate the position for the visual indicator
    const indicatorX = clickX;
    const indicatorY = clickY;

    setClickIndicator({
      x: imageX,
      y: imageY,
      style: {
        left: indicatorX + 'px',
        top: indicatorY + 'px'
      }
    });

    // Position the dropdown menu relative to the viewport
    setDropdownPosition({
      x: e.pageX,
      y: e.pageY,
      imageX: imageX,
      imageY: imageY
    });
  };

  const handleCharacterSelect = (character) => {
    if (dropdownPosition) {
      const { imageX, imageY } = dropdownPosition;
      const isCorrect = checkCharacterFound(imageX, imageY, character);
      
      const newAttempt = {
        x: imageX,
        y: imageY,
        character,
        correct: isCorrect
      };
      
      setAttempts(prev => [...prev, newAttempt]);
      setDropdownPosition(null);
      
      // Clear click indicator after a short delay
      setTimeout(() => {
        setClickIndicator(null);
      }, 1000);
    }
  };

  const handlePageClick = (e) => {
    if (!e.target.closest('.character-dropdown') && !e.target.closest('.game-map')) {
      setDropdownPosition(null);
      setClickIndicator(null);
    }
  };

  return (
    <div className="game-page" onClick={handlePageClick}>
      <div className="game-container" ref={gameContainerRef}>
        <div className="map-container">
          <img 
            ref={imageRef}
            src="/images/map.jpg" 
            alt="Where's Waldo Game Map" 
            className="game-map"
            onClick={handleImageClick}
          />
          {clickIndicator && (
            <div 
              className="click-indicator"
              style={clickIndicator.style}
            >
              <div className="coordinates">
                x: {clickIndicator.x}, y: {clickIndicator.y}
              </div>
            </div>
          )}
        </div>
        {dropdownPosition && !gameCompleted && (
          <div 
            className="character-dropdown"
            style={{
              left: dropdownPosition.x,
              top: dropdownPosition.y
            }}
          >
            {characters.map((character) => (
              !foundCharacters[character] && (
                <div
                  key={character}
                  className="dropdown-item"
                  onClick={() => handleCharacterSelect(character)}
                >
                  {character}
                </div>
              )
            ))}
          </div>
        )}
      </div>
      <div className="click-display">
        <div className="timer">Time: {formatTime(elapsedTime)}</div>
        <h3>Found Characters:</h3>
        <ul className="character-list">
          {characters.map(character => (
            <li 
              key={character}
              className={foundCharacters[character] ? 'found' : ''}
            >
              {character}: {foundCharacters[character] ? '✅' : '❌'}
            </li>
          ))}
        </ul>
        {gameCompleted ? (
          <ScoreSubmission />
        ) : (
          <>
            <h3>Recent Attempts:</h3>
            <ul className="attempts-list">
              {attempts.slice(-5).map((attempt, index) => (
                <li key={index} className={attempt.correct ? 'correct' : 'incorrect'}>
                  {attempt.character}: {attempt.correct ? '✅' : '❌'}
                  <div className="attempt-coords">
                    x: {attempt.x}, y: {attempt.y}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default GamePage;
