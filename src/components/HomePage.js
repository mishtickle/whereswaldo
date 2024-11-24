import React from 'react';
import './HomePage.css';

function HomePage({ onStartGame }) {
  return (
    <div className="home-page">
      <h1>Where's Waldo?</h1>
      <div className="characters-container">
        <div className="character">
          <img 
            src="/images/wally.png" 
            alt="Waldo" 
          />
          <h2>Waldo</h2>
          <p>Find the guy in the red and white striped shirt!</p>
        </div>
        <div className="character">
          <img 
            src="/images/odlaw.gif" 
            alt="Odlaw" 
          />
          <h2>Odlaw</h2>
          <p>Look for Waldo's opposite in yellow and black!</p>
        </div>
        <div className="character">
          <img 
            src="/images/wizard.gif" 
            alt="Wizard Whitebeard" 
          />
          <h2>Wizard Whitebeard</h2>
          <p>Can you spot the magical wizard?</p>
        </div>
      </div>
      <div className="start-button">
        <button onClick={onStartGame}>Start Game!</button>
      </div>
    </div>
  );
}

export default HomePage;
