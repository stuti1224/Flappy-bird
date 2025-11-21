// Assignment 3 - Flappy Bird Game
// Enhanced version with multiple features including power-ups, combos, and particle effects
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // GAME CONSTANTS
  // These values control the core physics and dimensions of the game
  const GAME_WIDTH = 800;           // Width of the game area in pixels
  const GAME_HEIGHT = 500;          // Height of the game area in pixels
  const PLAYER_SIZE = 45;           // Size of the player (bird) in pixels
  const OBSTACLE_WIDTH = 60;        // Width of obstacles (TNT boxes) in pixels
  const GAP_SIZE = 200;             // Gap between top and bottom obstacles in pixels
  const GRAVITY = 0.5;              // Gravity force applied to player each frame
  const JUMP_STRENGTH = -10;        // Upward velocity when player jumps (negative = up)
  const HORIZONTAL_SPEED = 8;       // Speed of left/right movement in pixels

  // CORE GAME STATE
  // Essential states for game mechanics
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 250 });  // Player position (x, y coordinates)
  const [obstacles, setObstacles] = useState([]);                   // Array of obstacle objects
  const [score, setScore] = useState(0);                            // Current score (obstacles passed)
  const [gameOver, setGameOver] = useState(false);                  // Whether the game has ended
  const [gameStarted, setGameStarted] = useState(false);            // Whether the game has started
  const [velocity, setVelocity] = useState(0);                      // Current vertical velocity of player
  
  // VISUAL ELEMENTS STATE
  // States for background and environmental elements
  const [clouds, setClouds] = useState([
    { id: 1, x: 100, y: 80, size: 60 },   // Cloud 1 position and size
    { id: 2, x: 400, y: 120, size: 80 },  // Cloud 2 position and size
    { id: 3, x: 650, y: 60, size: 70 }    // Cloud 3 position and size
  ]);
  
  const [groundX, setGroundX] = useState(0);  // X-offset for scrolling ground animation
  
  // GAME PROGRESSION STATE
  // States that track game difficulty and progress
  const [obstacleSpeed, setObstacleSpeed] = useState(2.5);  // Current speed of obstacles moving left
  
  // Load high score from browser's localStorage (persists between sessions)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('flappyBirdHighScore');
    return saved ? parseInt(saved) : 0;  // Return saved score or 0 if none exists
  });

  // VISUAL EFFECTS STATE
  // States for temporary visual feedback
  const [showJumpEffect, setShowJumpEffect] = useState(false);  // Shows puff animation when jumping
  
  // NEW FEATURES STATE
  // Enhanced gameplay features added to make game more interesting
  
  // Pause System - allows player to pause/resume game
  const [isPaused, setIsPaused] = useState(false);
  
  // Distance Tracker - measures how far player has traveled
  const [distance, setDistance] = useState(0);
  
  // Invincibility System - gives player 2 seconds of protection at start
  const [isInvincible, setIsInvincible] = useState(false);
  
  // Combo System - rewards consecutive obstacle passes
  const [combo, setCombo] = useState(0);              // Current combo count
  const [showCombo, setShowCombo] = useState(false);  // Whether to show combo display
  
  // Power-up System - special items that give temporary abilities
  const [powerUps, setPowerUps] = useState([]);           // Array of power-up objects
  const [hasShield, setHasShield] = useState(false);      // Whether player has shield protection
  const [slowMotion, setSlowMotion] = useState(false);    // Whether slow motion is active
  
  // Particle System - explosion effect on collision
  const [particles, setParticles] = useState([]);
  
  // Screen Effects - visual feedback for events
  const [screenShake, setScreenShake] = useState(false);  // Camera shake on collision
  
  // REFS FOR COUNTERS AND TRACKERS
  // useRef preserves values between renders without causing re-renders
  const obstacleIdCounter = useRef(0);      // Counter for assigning unique IDs to obstacles
  const passedObstacles = useRef(new Set());  // Set to track which obstacles have been passed (for scoring)
  const powerUpIdCounter = useRef(0);       // Counter for assigning unique IDs to power-ups

  // GAME INITIALIZATION
  //Starts or restarts the game
  //Resets all state variables to their initial values
   
  const startGame = () => {
    setGameStarted(true);           // Enable game loop
    setGameOver(false);             // Clear game over state
    setPlayerPos({ x: 50, y: 250 }); // Reset player to starting position
    setScore(0);                    // Reset score to zero
    setDistance(0);                 // Reset distance traveled
    setVelocity(0);                 // Reset vertical velocity
    setObstacles([]);               // Clear all obstacles
    setPowerUps([]);                // Clear all power-ups
    setParticles([]);               // Clear all particles
    setObstacleSpeed(2.5);          // Reset obstacle speed to initial value
    setIsPaused(false);             // Ensure game is not paused
    setIsInvincible(true);          // Enable invincibility at start
    setHasShield(false);            // Remove shield if any
    setSlowMotion(false);           // Disable slow motion
    setCombo(0);                    // Reset combo counter
    setShowCombo(false);            // Hide combo display
    setScreenShake(false);          // Disable screen shake
    passedObstacles.current = new Set();  // Clear passed obstacles tracker
    obstacleIdCounter.current = 0;        // Reset obstacle ID counter
    powerUpIdCounter.current = 0;         // Reset power-up ID counter
    
    // Remove invincibility after 2 seconds (2000 milliseconds)
    setTimeout(() => setIsInvincible(false), 2000);
  };

  // MEDAL SYSTEM
  /**
   * Determines medal based on score
   * @param {number} score - Player's final score
   * @returns {object|null} Medal object with emoji, name, and color, or null if no medal
   */
  const getMedal = (score) => {
    if (score >= 50) return { emoji: '🥇', name: 'Gold', color: '#FFD700' };     // Gold medal for 50+ points
    if (score >= 30) return { emoji: '🥈', name: 'Silver', color: '#C0C0C0' };   // Silver medal for 30+ points
    if (score >= 15) return { emoji: '🥉', name: 'Bronze', color: '#CD7F32' };   // Bronze medal for 15+ points
    return null;  // No medal for scores below 15
  };

  // KEYBOARD INPUT HANDLING
  //Handles all keyboard input for game controls
  // Runs whenever gameStarted, gameOver, or isPaused changes
  useEffect(() => {
    const handleKeyDown = (e) => {
      // PAUSE/UNPAUSE: Press 'P' to toggle pause (only during active game)
      if (e.code === 'KeyP' && gameStarted && !gameOver) {
        setIsPaused(prev => !prev);  // Toggle pause state
        return;
      }

      // START GAME: Press Space when game is not started or after game over
      if (!gameStarted || gameOver) {
        if (e.code === 'Space') {
          startGame();
        }
        return;
      }

      // Don't process other controls if game is paused
      if (isPaused) return;

      // GAME CONTROLS (when game is active and not paused)
      switch(e.code) {
        case 'Space':
        case 'ArrowUp':
          // JUMP: Apply upward velocity and show jump effect
          setVelocity(JUMP_STRENGTH);
          setShowJumpEffect(true);
          setTimeout(() => setShowJumpEffect(false), 200);  // Hide effect after 200ms
          break;
        case 'ArrowLeft':
          // MOVE LEFT: Decrease x position (clamped to left boundary)
          setPlayerPos(prev => ({
            ...prev,
            x: Math.max(0, prev.x - HORIZONTAL_SPEED)  // Don't go past left edge (x = 0)
          }));
          break;
        case 'ArrowRight':
          // MOVE RIGHT: Increase x position (clamped to right boundary)
          setPlayerPos(prev => ({
            ...prev,
            x: Math.min(GAME_WIDTH - PLAYER_SIZE, prev.x + HORIZONTAL_SPEED)  // Don't go past right edge
          }));
          break;
        default:
          break;
      }
    };

    // Attach keyboard listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Cleanup: Remove listener when component unmounts or dependencies change
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, isPaused, JUMP_STRENGTH, HORIZONTAL_SPEED, GAME_WIDTH, PLAYER_SIZE]);

  // GRAVITY AND PLAYER PHYSICS 
  // Applies gravity to player and updates position
  //Runs 50 times per second (every 20ms)
  
  useEffect(() => {
    // Don't run physics if game is not active or paused
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      // Apply gravity: increase downward velocity each frame
      setVelocity(prev => prev + GRAVITY);
      
      // Update player position based on velocity
      setPlayerPos(prev => {
        const newY = prev.y + velocity;  // Calculate new Y position
        
        // CHECK BOUNDARY COLLISIONS
        // Top boundary (y = 0) or bottom boundary (above ground)
        if (newY < 0 || newY > GAME_HEIGHT - PLAYER_SIZE - 80) {
          if (!hasShield) {
            handleCollision();  // End game if no shield
          }
          return prev;  // Don't update position if collision occurs
        }
        
        // Valid position: update Y coordinate
        return { ...prev, y: newY };
      });
    }, 20);  // Run every 20 milliseconds (50 FPS)

    // Cleanup: Clear interval when component unmounts or dependencies change
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, velocity, hasShield, GRAVITY, GAME_HEIGHT, PLAYER_SIZE]);

  // OBSTACLE GENERATION
  // Spawns new obstacles at regular intervals
  // Creates TNT boxes with random gap positions
   
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      // Calculate random Y position for gap (must leave room at top and bottom)
      const gapPosition = Math.random() * (GAME_HEIGHT - GAP_SIZE - 180) + 50;
      
      // Add new obstacle to obstacles array
      setObstacles(prev => [...prev, {
        id: obstacleIdCounter.current++,  // Unique ID for this obstacle
        x: GAME_WIDTH,                     // Start at right edge of screen
        gapY: gapPosition,                 // Y position where gap starts
        passed: false                      // Track if player has passed this obstacle
      }]);
    }, 2500);  // Spawn new obstacle every 2.5 seconds

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, GAME_HEIGHT, GAME_WIDTH, GAP_SIZE]);

  // POWER-UP GENERATION
  // Spawns power-ups with 20% probability
  // Two types: shield (protection) and slow motion (time manipulation)
   
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      // 20% chance to spawn a power-up
      if (Math.random() < 0.2) {
        const type = Math.random() < 0.5 ? 'shield' : 'slowmo';  // Random type selection
        const yPos = Math.random() * (GAME_HEIGHT - 150) + 50;   // Random Y position
        
        // Add new power-up to array
        setPowerUps(prev => [...prev, {
          id: powerUpIdCounter.current++,  // Unique ID
          x: GAME_WIDTH,                    // Start at right edge
          y: yPos,                          // Random Y position
          type: type                        // 'shield' or 'slowmo'
        }]);
      }
    }, 5000);  // Check every 5 seconds

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, GAME_HEIGHT, GAME_WIDTH]);

  // COLLISION HANDLER
  // Handles collision events
  // Creates particle explosion and triggers screen shake
 
  const handleCollision = () => {
    // PARTICLE EXPLOSION: Generate 15 particles radiating from player
    const newParticles = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: Date.now() + i,                      // Unique ID using timestamp
        x: playerPos.x + PLAYER_SIZE / 2,        // Start at player center
        y: playerPos.y + PLAYER_SIZE / 2,        // Start at player center
        vx: (Math.random() - 0.5) * 12,          // Random horizontal velocity (-6 to +6)
        vy: (Math.random() - 0.5) * 12           // Random vertical velocity (-6 to +6)
      });
    }
    setParticles(newParticles);
    
    // SCREEN SHAKE: Enable shake effect for 200ms
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 200);
    
    // END GAME
    setGameOver(true);
  };

  // MAIN GAME LOOP
  // Core game loop: moves obstacles, checks collisions, handles power-ups
  // This is the most complex useEffect - it handles multiple game systems
   
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    // Calculate current speed (reduced if slow motion is active)
    const currentSpeed = slowMotion ? obstacleSpeed * 0.5 : obstacleSpeed;

    const interval = setInterval(() => {
      // UPDATE DISTANCE TRAVELED
      setDistance(prev => prev + currentSpeed);
      
      // MOVE AND CHECK OBSTACLES 
      setObstacles(prev => {
        // Move all obstacles left and filter out those that went off-screen
        const updated = prev
          .map(obstacle => ({
            ...obstacle,
            x: obstacle.x - currentSpeed  // Move left
          }))
          .filter(obstacle => obstacle.x > -OBSTACLE_WIDTH);  // Remove if off-screen

        // CHECK EACH OBSTACLE FOR COLLISIONS AND SCORING
        updated.forEach(obstacle => {
          // Get bounding boxes for collision detection
          const obstacleLeft = obstacle.x;
          const obstacleRight = obstacle.x + OBSTACLE_WIDTH;
          const playerLeft = playerPos.x;
          const playerRight = playerPos.x + PLAYER_SIZE;
          const playerTop = playerPos.y;
          const playerBottom = playerPos.y + PLAYER_SIZE;

          // SCORE TRACKING: Check if player passed obstacle
          if (!passedObstacles.current.has(obstacle.id) &&   // Not already counted
              obstacleRight < playerLeft) {                   // Obstacle fully passed player
            passedObstacles.current.add(obstacle.id);         // Mark as passed
            setScore(s => s + 1);                             // Increment score
            setCombo(c => c + 1);                             // Increment combo
            setShowCombo(true);                               // Show combo indicator
            setTimeout(() => setShowCombo(false), 1000);      // Hide after 1 second
          }

          // COLLISION DETECTION: Check if player overlaps with obstacle
          const horizontalOverlap = playerRight > obstacleLeft && playerLeft < obstacleRight;
          
          if (horizontalOverlap && !isInvincible) {
            // Check collision with top or bottom pipe
            const topPipeCollision = playerTop < obstacle.gapY;
            const bottomPipeCollision = playerBottom > obstacle.gapY + GAP_SIZE;
            
            if (topPipeCollision || bottomPipeCollision) {
              // COLLISION OCCURRED
              if (hasShield) {
                // Shield absorbs hit: remove shield and reset combo
                setHasShield(false);
                setCombo(0);
              } else {
                // No shield: trigger collision (game over)
                handleCollision();
              }
            }
          }
        });

        return updated;
      });

      // MOVE AND CHECK POWER-UPS
      setPowerUps(prev => {
        // Move all power-ups left and filter out those off-screen
        const updated = prev
          .map(powerUp => ({
            ...powerUp,
            x: powerUp.x - currentSpeed  // Move left
          }))
          .filter(powerUp => powerUp.x > -30);  // Remove if off-screen

        // CHECK POWER-UP COLLECTION using distance formula
        updated.forEach(powerUp => {
          // Calculate distance between player center and power-up
          const distance = Math.sqrt(
            Math.pow(powerUp.x - (playerPos.x + PLAYER_SIZE/2), 2) +
            Math.pow(powerUp.y - (playerPos.y + PLAYER_SIZE/2), 2)
          );

          // Collection threshold: 40 pixels
          if (distance < 40) {
            // ACTIVATE POWER-UP based on type
            if (powerUp.type === 'shield') {
              setHasShield(true);
              setTimeout(() => setHasShield(false), 5000);  // Shield lasts 5 seconds
            } else if (powerUp.type === 'slowmo') {
              setSlowMotion(true);
              setTimeout(() => setSlowMotion(false), 3000); // Slow motion lasts 3 seconds
            }
            // Remove collected power-up from array
            setPowerUps(prev => prev.filter(p => p.id !== powerUp.id));
          }
        });

        return updated;
      });
    }, 20);  // Run 50 times per second

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, playerPos, obstacleSpeed, slowMotion, isInvincible, hasShield, OBSTACLE_WIDTH, PLAYER_SIZE, GAP_SIZE]);

  // PARTICLE ANIMATION
  // Animates explosion particles with gravity
  // Particles move based on velocity and fall downward
   
  useEffect(() => {
    if (particles.length === 0) return;  // Skip if no particles

    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,        // Move horizontally
            y: p.y + p.vy,        // Move vertically
            vy: p.vy + 0.5        // Apply gravity (accelerate downward)
          }))
          .filter(p => p.y < GAME_HEIGHT)  // Remove particles that fall off screen
      );
    }, 30);  // Update ~33 times per second

    return () => clearInterval(interval);
  }, [particles.length, GAME_HEIGHT]);

  // CLOUD ANIMATION
  // Moves clouds slowly across screen for parallax effect
  // Clouds loop back to right side when they go off left side
   
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    const interval = setInterval(() => {
      setClouds(prev => 
        prev.map(cloud => ({
          ...cloud,
          // Move left slowly (0.5 pixels per frame)
          // If cloud goes off left side, wrap it to right side
          x: cloud.x - 0.5 > -100 ? cloud.x - 0.5 : GAME_WIDTH + 50
        }))
      );
    }, 50);  // Update 20 times per second

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, GAME_WIDTH]);

  // GROUND ANIMATION
  // Scrolls ground texture to create movement illusion
  // Speed matches obstacle speed (or slower during slow motion)
   
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;

    // Calculate ground speed (half of obstacle speed during slow motion)
    const currentSpeed = slowMotion ? 1.25 : 2.5;

    const interval = setInterval(() => {
      // Move ground left and wrap using modulo (seamless loop)
      setGroundX(prev => (prev - currentSpeed) % 100);
    }, 20);  // Update 50 times per second

    return () => clearInterval(interval);
  }, [gameStarted, gameOver, isPaused, slowMotion]);

  // DIFFICULTY PROGRESSION 
  // Increases game difficulty as score increases
  // Speed increases every 15 points
   
  useEffect(() => {
    // Calculate new speed: base 2.5 + 0.3 for every 15 points
    const newSpeed = 2.5 + Math.floor(score / 15) * 0.3;
    setObstacleSpeed(newSpeed);
  }, [score]);  // Recalculate whenever score changes

  // HIGH SCORE PERSISTENCE 
  // Saves high score to browser's localStorage
  // Persists between browser sessions
   
  useEffect(() => {
    // Check if current score beats high score
    if (gameOver && score > highScore) {
      setHighScore(score);  // Update high score state
      localStorage.setItem('flappyBirdHighScore', score.toString());  // Save to localStorage
    }
  }, [gameOver, score, highScore]);

  // COMBO RESET TIMER 
  // Resets combo if player doesn't pass obstacle within 3 seconds
  // Encourages continuous play
   
  useEffect(() => {
    if (combo === 0) return;  // Skip if no combo active
    
    // Set timeout to reset combo after 3 seconds
    const timeout = setTimeout(() => {
      setCombo(0);
    }, 3000);

    // Clear timeout if combo increases (new obstacle passed)
    return () => clearTimeout(timeout);
  }, [combo, score]);  // Reset timer whenever combo or score changes

  // RENDER (JSX) 
  return (
    <div className="app-container">
      {/* HEADER: Score and combo display */}
      <div className="header">
        <h1>Angry Bird Game</h1>
        {/* Display current score and distance traveled */}
        <div className="score">Score: {score} | Distance: {Math.floor(distance)}m</div>
        {/* Display persistent high score */}
        <div className="high-score">High Score: {highScore}</div>
        {/* Show combo indicator when combo is 3 or higher */}
        {combo > 2 && (
          <div className="combo-display">🔥 COMBO x{combo} 🔥</div>
        )}
      </div>

      {/* GAME BOX: Main game area */}
      <div 
        className={`game-box ${screenShake ? 'shake' : ''}`}  // Add 'shake' class on collision
      >
        {/* CLOUDS: Background decoration */}
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

        {/* PLAYER: The angry bird character */}
        {gameStarted && (
          <div
            className={`player ${isInvincible ? 'invincible' : ''} ${hasShield ? 'shielded' : ''}`}
            style={{
              left: playerPos.x + 'px',
              top: playerPos.y + 'px',
              transform: `rotate(${Math.min(velocity * 3, 45)}deg)`,  // Rotate based on velocity
              opacity: isInvincible ? 0.6 : 1,                         // Semi-transparent when invincible
              animation: isInvincible ? 'blink 0.2s infinite' : 'none' // Blink during invincibility
            }}
          >
            {/* Bird facial features */}
            <div className="eye"></div>
            <div className="beak"></div>
            {/* Shield visual effect (only shown when shield is active) */}
            {hasShield && <div className="shield-effect"></div>}
          </div>
        )}

        {/* JUMP EFFECT: Visual feedback when jumping */}
        {showJumpEffect && gameStarted && (
          <div
            className="jump-puff"
            style={{
              left: playerPos.x + 20 + 'px',
              top: playerPos.y + 40 + 'px'
            }}
          />
        )}

        {/* POWER-UPS: Collectible items */}
        {powerUps.map(powerUp => (
          <div
            key={powerUp.id}
            className={`power-up ${powerUp.type}`}
            style={{
              left: powerUp.x + 'px',
              top: powerUp.y + 'px'
            }}
          >
            {/* Display emoji based on power-up type */}
            {powerUp.type === 'shield' ? '🛡️' : '⏰'}
          </div>
        ))}

        {/* PARTICLES: Explosion effect on collision */}
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

        {/*  OBSTACLES: TNT boxes that player must avoid */}
        {obstacles.map(obstacle => (
          <React.Fragment key={obstacle.id}>
            {/* Top obstacle (above gap) */}
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
            
            {/* Bottom obstacle (below gap) */}
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

        {/* GROUND: Bottom scrolling ground  */}
        <div className="ground" style={{ backgroundPositionX: groundX + 'px' }} />

        {/*  SLOW MOTION INDICATOR: Shows when slow motion is active */}
        {slowMotion && (
          <div className="slow-motion-indicator">
            ⏰ SLOW MOTION
          </div>
        )}

        {/* GAME OVER / START MENU  */}
        {(!gameStarted || gameOver) && (
          <div className="overlay">
            <div className="menu">
              {gameOver ? (
                <>
                  {/* Game Over screen */}
                  <h2 className="game-over">Game Over!</h2>
                  <p className="final-score">Final Score: {score}</p>
                  <p className="final-score">Distance: {Math.floor(distance)}m</p>
                  
                  {/* Show new high score message */}
                  {score === highScore && score > 0 && (
                    <p className="new-record">🏆 New High Score! 🏆</p>
                  )}
                  
                  {/* Show medal if earned */}
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
                /* Start screen */
                <h2 className="ready">Ready to Play?</h2>
              )}
              
              {/* Start/Restart button */}
              <button onClick={startGame} className="start-button">
                {gameOver ? 'Play Again' : 'Start Game'}
              </button>
              
              {/* Control instructions */}
              <div className="controls">
                <p className="controls-title">Controls:</p>
                <p>• SPACE / ↑ - Jump</p>
                <p>• ← - Move Left</p>
                <p>• → - Move Right</p>
                <p>• P - Pause/Resume</p>
              </div>
              
              {/* Power-up descriptions */}
              <div className="controls">
                <p className="controls-title">Power-ups:</p>
                <p>• 🛡️ Shield - Protects from one hit</p>
                <p>• ⏰ Slow Motion - Slows game for 3s</p>
              </div>
            </div>
          </div>
        )}

        {/*  PAUSE OVERLAY: Shown when game is paused */}
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

      {/*  FOOTER: Assignment information  */}
      <div className="footer">
        <p>Assignment 3 - Internet Tools</p>
        <p>React Framework Implementation - Enhanced Version</p>
      </div>
    </div>
  );
}

export default App;