// Assignment 3 - Flappy Bird Game
// Enhanced version with multiple features
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // Constants - moved inside component with adjusted physics
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 500;
  const PLAYER_SIZE = 45;
  const OBSTACLE_WIDTH = 60;
  const GAP_SIZE = 200;
  const GRAVITY = 0.5;
  const JUMP_STRENGTH = -10;
  const HORIZONTAL_SPEED = 8;

  // State declarations
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 250 });
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [velocity, setVelocity] = useState(0);
  
  // Clouds
  const [clouds, setClouds] = useState([
    { id: 1, x: 100, y: 80, size: 60 },
    { id: 2, x: 400, y: 120, size: 80 },
    { id: 3, x: 650, y: 60, size: 70 }
  ]);
  
  // Ground
  const [groundX, setGroundX] = useState(0);
  
  // Difficulty progression
  const [obstacleSpeed, setObstacleSpeed] = useState(2.5);
  
  // High score
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flappyBirdHighScore');
    return saved ? parseInt(saved) : 0;
  });

  // Jump effect
  const [showJumpEffect, setShowJumpEffect] = useState(false);
  
  // NEW: Pause functionality
  const [isPaused, setIsPaused] = useState(false);
  
  // NEW: Distance traveled
  const [distance, setDistance] = useState(0);
  
  // NEW: Invincibility at start
  const [isInvincible, setIsInvincible] = useState(false);
  
  // NEW: Combo system
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  
  // NEW: Power-ups
  const [powerUps, setPowerUps] = useState([]);
  const [hasShield, setHasShield] = useState(false);
  const [slowMotion, setSlowMotion] = useState(false);
  
  // NEW: Particles on collision
  const [particles, setParticles] = useState([]);
  
  // NEW: Screen shake on collision
  const [screenShake, setScreenShake] = useState(false);
  
  const obstacleIdCounter = useRef(0);
  const passedObstacles = useRef(new Set());
  const powerUpIdCounter = useRef(0);

  // Start game
  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setPlayerPos({ x: 50, y: 250 });
    setScore(0);
    setDistance(0);
    setVelocity(0);
    setObstacles([]);
    setPowerUps([]);
    setParticles([]);
    setObstacleSpeed(2.5);
    setIsPaused(false);
    setIsInvincible(true);
    setHasShield(false);
    setSlowMotion(false);
    setCombo(0);
    setShowCombo(false);
    setScreenShake(false);
    passedObstacles.current = new Set();
    obstacleIdCounter.current = 0;
    powerUpIdCounter.current = 0;
    
    // Invincibility for 2 seconds at start
    setTimeout(() => setIsInvincible(false), 2000);
  };

  // Get medal based on score
  const getMedal = (score) => {
    if (score >= 50) return { emoji: '🥇', name: 'Gold', color: '#FFD700' };
    if (score >= 30) return { emoji: '🥈', name: 'Silver', color: '#C0C0C0' };
    if (score >= 15) return { emoji: '🥉', name: 'Bronze', color: '#CD7F32' };
    return null;
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Pause/Unpause
      if (e.code === 'KeyP' && gameStarted && !gameOver) {
        setIsPaused(prev => !prev);
        return;
      }

      if (!gameStarted || gameOver) {
        if (e.code === 'Space') {
          startGame();
        }
        return;
      }

      if (isPaused) return;

      switch(e.code) {
        case 'Space':
        case 'ArrowUp':
          setVelocity(JUMP_STRENGTH);
          setShowJumpEffect(true);
          setTimeout(() => setShowJumpEffect(false), 200);
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
  }, [gameStarted, gameOver, isPaused, JUMP_STRENGTH, HORIZONTAL_SPEED, GAME_WIDTH, PLAYER_SIZE]);

  // Gravity and player movement
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      setVelocity(prev => prev + GRAVITY);
      setPlayerPos(prev => {
        const newY = prev.y + velocity;
        
        if (newY < 0 || newY > GAME_HEIGHT - PLAYER_SIZE - 80) {
          if (!hasShield) {
            handleCollision();
          }
          return prev;
        }
        
        return { ...prev, y: newY };
      });
    }, 20);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, velocity, hasShield, GRAVITY, GAME_HEIGHT, PLAYER_SIZE]);

  // Generate obstacles
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      const gapPosition = Math.random() * (GAME_HEIGHT - GAP_SIZE - 180) + 50;
      
      setObstacles(prev => [...prev, {
        id: obstacleIdCounter.current++,
        x: GAME_WIDTH,
        gapY: gapPosition,
        passed: false
      }]);
    }, 2500);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, GAME_HEIGHT, GAME_WIDTH, GAP_SIZE]);

  // Generate power-ups (20% chance)
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      if (Math.random() < 0.2) {
        const type = Math.random() < 0.5 ? 'shield' : 'slowmo';
        const yPos = Math.random() * (GAME_HEIGHT - 150) + 50;
        
        setPowerUps(prev => [...prev, {
          id: powerUpIdCounter.current++,
          x: GAME_WIDTH,
          y: yPos,
          type: type
        }]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, GAME_HEIGHT, GAME_WIDTH]);

  // Handle collision
  const handleCollision = () => {
    // Generate explosion particles
    const newParticles = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: playerPos.x + PLAYER_SIZE / 2,
        y: playerPos.y + PLAYER_SIZE / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12
      });
    }
    setParticles(newParticles);
    
    // Screen shake
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
    
    setGameOver(true);
  };

  // Move obstacles, check collisions, and handle power-ups
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const currentSpeed = slowMotion ? obstacleSpeed * 0.5 : obstacleSpeed;

    const interval = setInterval(() => {
      setDistance(prev => prev + currentSpeed);
      
      // Move obstacles
      setObstacles(prev => {
        const updated = prev
          .map(obstacle => ({
            ...obstacle,
            x: obstacle.x - currentSpeed
          }))
          .filter(obstacle => obstacle.x > -OBSTACLE_WIDTH);

        updated.forEach(obstacle => {
          const obstacleLeft = obstacle.x;
          const obstacleRight = obstacle.x + OBSTACLE_WIDTH;
          const playerLeft = playerPos.x;
          const playerRight = playerPos.x + PLAYER_SIZE;
          const playerTop = playerPos.y;
          const playerBottom = playerPos.y + PLAYER_SIZE;

          // Score and combo tracking
          if (!passedObstacles.current.has(obstacle.id) && 
              obstacleRight < playerLeft) {
            passedObstacles.current.add(obstacle.id);
            setScore(s => s + 1);
            setCombo(c => c + 1);
            setShowCombo(true);
            setTimeout(() => setShowCombo(false), 1000);
          }

          const horizontalOverlap = playerRight > obstacleLeft && playerLeft < obstacleRight;
          
          if (horizontalOverlap && !isInvincible) {
            const topPipeCollision = playerTop < obstacle.gapY;
            const bottomPipeCollision = playerBottom > obstacle.gapY + GAP_SIZE;
            
            if (topPipeCollision || bottomPipeCollision) {
              if (hasShield) {
                setHasShield(false);
                setCombo(0);
              } else {
                handleCollision();
              }
            }
          }
        });

        return updated;
      });

      // Move power-ups
      setPowerUps(prev => {
        const updated = prev
          .map(powerUp => ({
            ...powerUp,
            x: powerUp.x - currentSpeed
          }))
          .filter(powerUp => powerUp.x > -30);

        // Check power-up collection
        updated.forEach(powerUp => {
          const distance = Math.sqrt(
            Math.pow(powerUp.x - (playerPos.x + PLAYER_SIZE/2), 2) +
            Math.pow(powerUp.y - (playerPos.y + PLAYER_SIZE/2), 2)
          );

          if (distance < 40) {
            if (powerUp.type === 'shield') {
              setHasShield(true);
              setTimeout(() => setHasShield(false), 5000);
            } else if (powerUp.type === 'slowmo') {
              setSlowMotion(true);
              setTimeout(() => setSlowMotion(false), 3000);
            }
            setPowerUps(prev => prev.filter(p => p.id !== powerUp.id));
          }
        });

        return updated;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, playerPos, obstacleSpeed, slowMotion, isInvincible, hasShield, OBSTACLE_WIDTH, PLAYER_SIZE, GAP_SIZE]);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.5
          }))
          .filter(p => p.y < GAME_HEIGHT)
      );
    }, 30);

    return () => clearInterval(interval);
  }, [particles.length, GAME_HEIGHT]);

  // Move clouds
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      setClouds(prev => 
        prev.map(cloud => ({
          ...cloud,
          x: cloud.x - 0.5 > -100 ? cloud.x - 0.5 : GAME_WIDTH + 50
        }))
      );
    }, 50);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, GAME_WIDTH]);

  // Move ground
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const currentSpeed = slowMotion ? 1.25 : 2.5;

    const interval = setInterval(() => {
      setGroundX(prev => (prev - currentSpeed) % 100);
    }, 20);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, slowMotion]);

  // Increase difficulty
  useEffect(() => {
    const newSpeed = 2.5 + Math.floor(score / 15) * 0.3;
    setObstacleSpeed(newSpeed);
  }, [score]);

  // Update high score
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
      localStorage.setItem('flappyBirdHighScore', score.toString());
    }
  }, [gameOver, score, highScore]);

  // Reset combo if no obstacle passed for 3 seconds
  useEffect(() => {
    if (combo === 0) return;
    
    const timeout = setTimeout(() => {
      setCombo(0);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [combo, score]);

  return (
    <div className="app-container">
      <div className="header">
        <h1>Angry Bird Game</h1>
        <div className="score">Score: {score} | Distance: {Math.floor(distance)}m</div>
        <div className="high-score">High Score: {highScore}</div>
        {combo > 2 && (
          <div className="combo-display">🔥 COMBO x{combo} 🔥</div>
        )}
      </div>

      <div 
        className={`game-box ${screenShake ? 'shake' : ''}`}
      >
        {/* Clouds */}
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

        {/* Player */}
        {gameStarted && (
          <div
            className={`player ${isInvincible ? 'invincible' : ''} ${hasShield ? 'shielded' : ''}`}
            style={{
              left: playerPos.x + 'px',
              top: playerPos.y + 'px',
              transform: `rotate(${Math.min(velocity * 3, 45)}deg)`,
              opacity: isInvincible ? 0.6 : 1,
              animation: isInvincible ? 'blink 0.2s infinite' : 'none'
            }}
          >
            <div className="eye"></div>
            <div className="beak"></div>
            {hasShield && <div className="shield-effect"></div>}
          </div>
        )}

        {/* Jump effect */}
        {showJumpEffect && gameStarted && (
          <div
            className="jump-puff"
            style={{
              left: playerPos.x + 20 + 'px',
              top: playerPos.y + 40 + 'px'
            }}
          />
        )}

        {/* Power-ups */}
        {powerUps.map(powerUp => (
          <div
            key={powerUp.id}
            className={`power-up ${powerUp.type}`}
            style={{
              left: powerUp.x + 'px',
              top: powerUp.y + 'px'
            }}
          >
            {powerUp.type === 'shield' ? '🛡️' : '⏰'}
          </div>
        ))}

        {/* Particles */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: particle.x + 'px',
              top: particle.y + 'px'
            }}
          />
        ))}

        {/* Obstacles */}
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
                height: (GAME_HEIGHT - obstacle.gapY - GAP_SIZE - 80) + 'px',
                left: obstacle.x + 'px',
                top: (obstacle.gapY + GAP_SIZE) + 'px'
              }}
            >
              <div className="pipe-cap"></div>
            </div>
          </React.Fragment>
        ))}

        {/* Ground */}
        <div className="ground" style={{ backgroundPositionX: groundX + 'px' }} />

        {/* Slow motion indicator */}
        {slowMotion && (
          <div className="slow-motion-indicator">
            ⏰ SLOW MOTION
          </div>
        )}

        {/* Game Over / Start Menu */}
        {(!gameStarted || gameOver) && (
          <div className="overlay">
            <div className="menu">
              {gameOver ? (
                <>
                  <h2 className="game-over">Game Over!</h2>
                  <p className="final-score">Final Score: {score}</p>
                  <p className="final-score">Distance: {Math.floor(distance)}m</p>
                  {score === highScore && score > 0 && (
                    <p className="new-record">🏆 New High Score! 🏆</p>
                  )}
                  {getMedal(score) && (
                    <div className="medal-display">
                      <span className="medal-emoji">{getMedal(score).emoji}</span>
                      <p style={{ color: getMedal(score).color, fontWeight: 'bold' }}>
                        {getMedal(score).name} Medal!
                      </p>
                    </div>
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
                <p>• P - Pause/Resume</p>
              </div>
              <div className="controls">
                <p className="controls-title">Power-ups:</p>
                <p>• 🛡️ Shield - Protects from one hit</p>
                <p>• ⏰ Slow Motion - Slows game for 3s</p>
              </div>
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {isPaused && (
          <div className="overlay">
            <div className="menu">
              <h2 className="ready">Paused</h2>
              <p style={{ fontSize: '1.2rem', color: '#f0e6d2', marginTop: '20px' }}>
                Press P to Resume
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <p>Assignment 3 - Internet Tools</p>
        <p>React Framework Implementation - Enhanced Version</p>
      </div>
    </div>
  );
}

export default App;