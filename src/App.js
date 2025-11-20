// Assignment 3 - Flappy Bird Game
// Feature 1: Basic game structure
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // Constants - moved inside component
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 500;
  const PLAYER_SIZE = 40;
  const OBSTACLE_WIDTH = 60;
  const GAP_SIZE = 180;
  const GRAVITY = 0.6;
  const JUMP_STRENGTH = -12;
  const HORIZONTAL_SPEED = 8;

  // State declarations
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 250 });
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [velocity, setVelocity] = useState(0);
  
  // Change 1: Clouds
  const [clouds, setClouds] = useState([
    { id: 1, x: 100, y: 80, size: 60 },
    { id: 2, x: 400, y: 120, size: 80 },
    { id: 3, x: 650, y: 60, size: 70 }
  ]);
  
  // Change 3: Ground
  const [groundX, setGroundX] = useState(0);
  
  // Change 6: Animated background
  const [bgColorIndex, setBgColorIndex] = useState(0);
  
  // Change 7: Difficulty progression
  const [obstacleSpeed, setObstacleSpeed] = useState(3);
  
  // Change 8: High score
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flappyBirdHighScore');
    return saved ? parseInt(saved) : 0;
  });
  
  const obstacleIdCounter = useRef(0);
  const passedObstacles = useRef(new Set());

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setPlayerPos({ x: 50, y: 250 });
    setScore(0);
    setVelocity(0);
    setObstacles([]);
    setObstacleSpeed(3);
    setBgColorIndex(0);
    passedObstacles.current = new Set();
    obstacleIdCounter.current = 0;
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || gameOver) {
        if (e.code === 'Space') {
          startGame();
        }
        return;
      }

      switch(e.code) {
        case 'Space':
        case 'ArrowUp':
          setVelocity(JUMP_STRENGTH);
          break;
        case 'ArrowLeft':
          setPlayerPos(prev => ({
            ...prev,
            x: Math.max(0, prev.x - HORIZONTAL_SPEED)
          }));
          break;
        case 'ArrowRight':
          setPlayerPos(prev => ({
            ...prev,
            x: Math.min(GAME_WIDTH - PLAYER_SIZE, prev.x + HORIZONTAL_SPEED)
          }));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, JUMP_STRENGTH, HORIZONTAL_SPEED, GAME_WIDTH, PLAYER_SIZE]);

  // Gravity and player movement
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setVelocity(prev => prev + GRAVITY);
      setPlayerPos(prev => {
        const newY = prev.y + velocity;
        
        if (newY < 0 || newY > GAME_HEIGHT - PLAYER_SIZE) {
          setGameOver(true);
          return prev;
        }
        
        return { ...prev, y: newY };
      });
    }, 20);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, velocity, GRAVITY, GAME_HEIGHT, PLAYER_SIZE]);

  // Generate obstacles
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      const gapPosition = Math.random() * (GAME_HEIGHT - GAP_SIZE - 100) + 50;
      
      setObstacles(prev => [...prev, {
        id: obstacleIdCounter.current++,
        x: GAME_WIDTH,
        gapY: gapPosition,
        passed: false
      }]);
    }, 2000);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, GAME_HEIGHT, GAME_WIDTH, GAP_SIZE]);

  // Move obstacles and check collisions
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setObstacles(prev => {
        const updated = prev
          .map(obstacle => ({
            ...obstacle,
            x: obstacle.x - obstacleSpeed
          }))
          .filter(obstacle => obstacle.x > -OBSTACLE_WIDTH);

        updated.forEach(obstacle => {
          const obstacleLeft = obstacle.x;
          const obstacleRight = obstacle.x + OBSTACLE_WIDTH;
          const playerLeft = playerPos.x;
          const playerRight = playerPos.x + PLAYER_SIZE;
          const playerTop = playerPos.y;
          const playerBottom = playerPos.y + PLAYER_SIZE;

          if (!passedObstacles.current.has(obstacle.id) && 
              obstacleRight < playerLeft) {
            passedObstacles.current.add(obstacle.id);
            setScore(s => s + 1);
          }

          const horizontalOverlap = playerRight > obstacleLeft && playerLeft < obstacleRight;
          
          if (horizontalOverlap) {
            const topPipeCollision = playerTop < obstacle.gapY;
            const bottomPipeCollision = playerBottom > obstacle.gapY + GAP_SIZE;
            
            if (topPipeCollision || bottomPipeCollision) {
              setGameOver(true);
            }
          }
        });

        return updated;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, playerPos, obstacleSpeed, OBSTACLE_WIDTH, PLAYER_SIZE, GAP_SIZE]);

  // Change 1: Move clouds
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setClouds(prev => 
        prev.map(cloud => ({
          ...cloud,
          x: cloud.x - 0.5 > -100 ? cloud.x - 0.5 : GAME_WIDTH + 50
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, GAME_WIDTH]);

  // Change 3: Move ground
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setGroundX(prev => (prev - 3) % 100);
    }, 20);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  // Change 6: Animate background color
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setBgColorIndex(prev => (prev + 1) % 360);
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  // Change 7: Increase difficulty
  useEffect(() => {
    const newSpeed = 3 + Math.floor(score / 10) * 0.5;
    setObstacleSpeed(newSpeed);
  }, [score]);

  // Change 8: Update high score
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('flappyBirdHighScore', score.toString());
    }
  }, [gameOver, score, highScore]);

  return (
    <div className="app-container">
      <div className="header">
        <h1>Flappy Bird React</h1>
        <div className="score">Score: {score}</div>
        <div className="high-score">High Score: {highScore}</div>
      </div>

      <div 
        className="game-box"
        style={{
          background: `linear-gradient(to bottom, 
            hsl(${200 + bgColorIndex * 0.1}, 70%, 75%) 0%, 
            hsl(${195 + bgColorIndex * 0.1}, 80%, 85%) 100%)`
        }}
      >
        {/* Change 1: Clouds */}
        {clouds.map(cloud => (
          <div
            key={cloud.id}
            className="cloud"
            style={{
              left: cloud.x + 'px',
              top: cloud.y + 'px',
              width: cloud.size + 'px',
              height: cloud.size * 0.6 + 'px'
            }}
          />
        ))}

        {gameStarted && (
          <div
            className="player"
            style={{
              left: playerPos.x + 'px',
              top: playerPos.y + 'px',
              transform: `rotate(${Math.min(velocity * 3, 45)}deg)`
            }}
          >
            <div className="eye"></div>
            <div className="beak"></div>
          </div>
        )}

        {obstacles.map(obstacle => (
          <React.Fragment key={obstacle.id}>
            <div
              className="obstacle obstacle-top"
              style={{
                width: OBSTACLE_WIDTH + 'px',
                height: obstacle.gapY + 'px',
                left: obstacle.x + 'px',
                top: 0
              }}
            >
              <div className="pipe-cap"></div>
            </div>
            
            <div
              className="obstacle obstacle-bottom"
              style={{
                width: OBSTACLE_WIDTH + 'px',
                height: (GAME_HEIGHT - obstacle.gapY - GAP_SIZE) + 'px',
                left: obstacle.x + 'px',
                top: (obstacle.gapY + GAP_SIZE) + 'px'
              }}
            >
              <div className="pipe-cap"></div>
            </div>
          </React.Fragment>
        ))}

        {/* Change 3: Ground */}
        <div className="ground" style={{ backgroundPositionX: groundX + 'px' }} />

        {(!gameStarted || gameOver) && (
          <div className="overlay">
            <div className="menu">
              {gameOver ? (
                <>
                  <h2 className="game-over">Game Over!</h2>
                  <p className="final-score">Final Score: {score}</p>
                  {score === highScore && score > 0 && (
                    <p className="new-record">🏆 New High Score! 🏆</p>
                  )}
                </>
              ) : (
                <h2 className="ready">Ready to Play?</h2>
              )}
              <button onClick={startGame} className="start-button">
                {gameOver ? 'Play Again' : 'Start Game'}
              </button>
              <div className="controls">
                <p className="controls-title">Controls:</p>
                <p>• SPACE / ↑ - Jump</p>
                <p>• ← - Move Left</p>
                <p>• → - Move Right</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <p>Assignment 3 - Internet Tools</p>
        <p>React Framework Implementation</p>
      </div>
    </div>
  );
}

export default App;