const canvas = document.getElementById('mainCanvas');
// Note: canvas.width is the actual width of the element; canvas.style.width is its appearance.
// So if they differ, shapes appear distorted.
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const ctx = canvas.getContext('2d');

const rect = canvas.getBoundingClientRect();
const root = document.documentElement;

// Space is expressed in pixels and time in frames in all kinematic quantities such as speed and acceleration.
const pixPerMet = 5;
const framesPerSec = 60;
const gravitationalPull = 9.81 * pixPerMet / (framesPerSec ^ 2);

const playerMaxSpeedHorizontal = 7;
const playerMaxSpeedVertical = 10;
const playerAccHorizontalGround = 1.5;
const playerAccHorizontalAirForced = 0.5;
const playerAccHorizontalAirFree = 0.1;
const playerAccVertical = 5 * gravitationalPull;
const maxJumpDuration = 10; // When jumping, apply vertical acceleration for at most this many frames.

let gameState;

let levelObjects = [];

const resetPlayer = (levelInd, livesLeft) => {
  const startObj = levels[levelInd].find(obj => obj.type === Objects.PLAYER);
  return {
    levelProgress: levelInd,
    alive: true,
    livesLeft: livesLeft || NUM_LIVES,
    w: PLAYER_W,
    h: PLAYER_H,
    x: startObj.x,
    y: startObj.y,
    vx: 0,
    vy: 0,
    left: false,
    right: false,
    up: false,
    newJump: true,
    jumpDuration: maxJumpDuration,
    turbo: false
  };
};

let player = resetPlayer(0, NUM_LIVES);

const isDead = () => {
  return player.y > CANVAS_HEIGHT;
};

const onSurface = levelObjects => {
  // Check whether the player is in a position where they can execute a jump, i.e. on top of an obstacle.
  for (const obstacle of levelObjects.filter(obj => obj.type === Objects.OBSTACLE)) {
    if (
      player.y === obstacle.y - PLAYER_H &&
      player.x + PLAYER_W >= obstacle.x &&
      player.x <= obstacle.x + obstacle.w
    ) {
      return true;
    }
  }
  return false;
};

const updateSplash = () => {
  const leftMargin = 100;
  const topMargin = 200;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = 'black';
  ctx.font = '48px serif';
  ctx.fillText('a platforming game', leftMargin, topMargin);
  ctx.font = '24px serif';
  ctx.fillText('arrow keys to control', leftMargin, topMargin + 100);
  ctx.fillText('space bar to start', leftMargin, topMargin + 130);
  ctx.fillText('esc to reset', leftMargin, topMargin + 160);
};

const updateGameOver = () => {
  const leftMargin = 100;
  const topMargin = 200;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = 'black';
  ctx.font = '48px serif';
  ctx.fillText('game over', leftMargin, topMargin);
  ctx.font = '24px serif';
  ctx.fillText('press space', leftMargin, topMargin + 100);
};

const updateGameComplete = () => {
  const leftMargin = 100;
  const topMargin = 200;

  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = 'black';
  ctx.font = '48px serif';
  ctx.fillText('congratulations!', leftMargin, topMargin);
  ctx.font = '24px serif';
  ctx.fillText('press space', leftMargin, topMargin + 100);
};

const updateGame = () => {
  // Handle input. Player input changes the velocity.
  levelObjects = levels[player.levelProgress];
  const isOnSurface = onSurface(levelObjects);
  if (player.left) {
    if (isOnSurface) {
      player.vx -= playerAccHorizontalGround;
    } else {
      player.vx -= playerAccHorizontalAirForced;
    }
    if (player.vx < -playerMaxSpeedHorizontal) {
      player.vx = -playerMaxSpeedHorizontal;
    }
  } else if (player.right) {
    if (isOnSurface) {
      player.vx += playerAccHorizontalGround;
    } else {
      player.vx += playerAccHorizontalAirForced;
    }
    if (player.vx > playerMaxSpeedHorizontal) {
      player.vx = playerMaxSpeedHorizontal;
    }
  } else {
    if (isOnSurface) {
      player.vx += player.vx < 0 ? playerAccHorizontalGround : -playerAccHorizontalGround;
      if (Math.abs(player.vx) < 2 * playerAccHorizontalGround) {
        player.vx = 0;
      }
    } else {
      player.vx += player.vx < 0 ? playerAccHorizontalAirFree : -playerAccHorizontalAirFree;
      if (Math.abs(player.vx) < 2 * playerAccHorizontalAirFree) {
        player.vx = 0;
      }
    }
  }

  if (player.up && player.newJump) {
    if (isOnSurface) {
      player.jumpDuration = 0;
      player.vy -= playerAccVertical;
    }
    if (player.jumpDuration < maxJumpDuration) {
      player.vy -= playerAccVertical;
      if (player.vy < -playerMaxSpeedVertical) {
        player.vy = -playerMaxSpeedVertical;
      }
    } else {
      player.newJump = false;
    }
  }

  //
  // Apply physics.
  //

  // Advance player state.
  player.x += player.vx;
  if (!isOnSurface) {
    player.jumpDuration += 1;
    player.vy += gravitationalPull;
    if (player.vy > playerMaxSpeedVertical) {
      player.vy = playerMaxSpeedVertical;
    }
    player.y += player.vy;
  } else {
    // The player has just jumped.
    player.y += player.vy;
  }

  // Check if goal is reached.
  const goal = levelObjects.find(obj => obj.type === Objects.GOAL);
  const goalCollision = collidePlayerObstacle(player, goal);
  if (goalCollision.isColliding) {
    if (player.levelProgress === levels.length - 1) {
      gameStateChange(GameStates.GAME_COMPLETE);
    } else {
      player = resetPlayer(player.levelProgress + 1, player.livesLeft);
    }
  }

  // Detect collisions.
  levelObjects.filter(obj => obj.type === Objects.OBSTACLE).forEach(obstacle => {
    const collision = collidePlayerObstacle(player, obstacle);
    if (collision.isColliding) {
      player.x += collision.deltaX;
      player.y += collision.deltaY;
      player.vx += collision.deltaVx;
      player.vy += collision.deltaVy;
      if (collision.resetJump) {
        player.jumpDuration = maxJumpDuration;
      }
    }
  });

  if (isDead()) {
    if (player.livesLeft === 1) {
      gameStateChange(GameStates.GAME_OVER);
    } else {
      player = resetPlayer(player.levelProgress, player.livesLeft - 1);
    }
  }

  //
  // Render new frame.
  //

  // Clear previous frame.
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Draw obstacles.
  ctx.fillStyle = 'black';
  levelObjects
    .filter(obj => obj.type === Objects.OBSTACLE)
    .forEach(obstacle => ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h));

  // Draw goal
  ctx.fillStyle = 'red';
  ctx.fillRect(goal.x, goal.y, goal.w, goal.h);

  // Draw player.
  ctx.fillStyle = 'blue';
  ctx.fillRect(player.x, player.y, PLAYER_W, PLAYER_H);

  // Draw lives left
  var iLife = 0;
  for (var life in _.range(player.livesLeft - 1)) {
    ctx.fillRect(10 + iLife*30, 10, PLAYER_W, PLAYER_H);
    iLife++;
  }
};

const updateEditor = () => {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawHelperLines();
  ctx.fillStyle = 'purple';
  ctx.fillText(`(${mouseX}, ${mouseY})`, mouseX, mouseY);
  editorState.levelObjects.forEach(object => {
    ctx.fillStyle = getFillStyle(object.type);
    ctx.fillRect(object.x, object.y, object.w, object.h);
  });
  if (editorState.newObject !== undefined) {
    ctx.fillStyle = getFillStyle(editorState.newObject.type);
    ctx.fillRect(editorState.newObject.x, editorState.newObject.y, editorState.newObject.w, editorState.newObject.h);
  }
};

const update = () => {
  switch (gameState) {
    case GameStates.SPLASH:
      updateSplash();
      break;
    case GameStates.GAME:
      updateGame();
      break;
    case GameStates.EDITOR:
      updateEditor();
      break;
    case GameStates.GAME_OVER:
      updateGameOver();
      break;
    case GameStates.GAME_COMPLETE:
      updateGameComplete();
      break;
  }

  window.requestAnimationFrame(update);
};

const gameStateChange = newState => {
  if (newState === gameState) {
    return;
  }
  let startingLevel = 0;
  // Remove event listeners of current state
  if (gameState === GameStates.SPLASH) {
    window.removeEventListener('keydown', splashHandleKeyDown);
  }
  if ([GameStates.GAME_OVER, GameStates.GAME_COMPLETE].includes(gameState)) {
    window.removeEventListener('keydown', gameOverHandleKeyDown);
  }
  if (gameState === GameStates.GAME) {
    window.removeEventListener('keydown', gameHandleKeyDown);
    window.removeEventListener('keyup', gameHandleKeyUp);
  }
  if (gameState === GameStates.EDITOR) {
    window.removeEventListener('mousemove', editorHandleMouseMove);
    window.removeEventListener('mousedown', editorHandleMouseDown);
    window.removeEventListener('mouseup', editorHandleMouseUp);
    window.removeEventListener('keydown', editorHandleKeyDown);
    window.removeEventListener('keyup', editorHandleKeyUp);
    startingLevel = editorState.levelInd;
  }
  // Add new state event listeners
  if (newState === GameStates.SPLASH) {
    window.addEventListener('keydown', splashHandleKeyDown);
  }
  if ([GameStates.GAME_OVER, GameStates.GAME_COMPLETE].includes(newState)) {
    window.addEventListener('keydown', gameOverHandleKeyDown);
  }
  if (newState === GameStates.GAME) {
    window.addEventListener('keydown', gameHandleKeyDown);
    window.addEventListener('keyup', gameHandleKeyUp);
    player = resetPlayer(startingLevel);
  }
  if (newState === GameStates.EDITOR) {
    window.addEventListener('mousemove', editorHandleMouseMove);
    window.addEventListener('mousedown', editorHandleMouseDown);
    window.addEventListener('mouseup', editorHandleMouseUp);
    window.addEventListener('keydown', editorHandleKeyDown);
    window.addEventListener('keyup', editorHandleKeyUp);
    levelObjects = levels[player.levelProgress];
    startLevelEditor(player.levelProgress);
  }
  gameState = newState;
};

// Always reset game by pressing Esc.
window.addEventListener('keydown', e => {
  if (e.keyCode === 27) {
    // esc
    gameStateChange(GameStates.SPLASH);
  }
});

const splashHandleKeyDown = e => {
  if (e.keyCode === 32) {
    gameStateChange(GameStates.GAME);
  }
};

const gameOverHandleKeyDown = e => {
  if (e.keyCode === 32) {
    gameStateChange(GameStates.SPLASH);
  }
};

// Register input.
const gameHandleKeyDown = e => {
  switch (e.keyCode) {
    case 69: // 'e'
      gameStateChange(GameStates.EDITOR);
      break;
    case 37: // left
      player.right = false;
      player.left = true;
      break;
    case 38: // up
      player.up = true;
      break;
    case 39: // right
      player.left = false;
      player.right = true;
      break;
    case 78: // 'n' (advance to next level)
      player = resetPlayer(player.levelProgress === levels.length - 1 ? 0 : player.levelProgress + 1);
      break;
    case 80: // 'p' (retreat to previous level)
      player = resetPlayer(player.levelProgress === 0 ? levels.length - 1 : player.levelProgress - 1);
      break;
    default:
      console.log(e.keyCode);
      break;
  }
};

const gameHandleKeyUp = e => {
  switch (e.keyCode) {
    case 37:
      player.left = false;
      break;
    case 38:
      player.up = false;
      player.newJump = true;
      break;
    case 39:
      player.right = false;
      break;
    default:
      break;
  }
};

console.log('to splash');
gameStateChange(GameStates.SPLASH);

update();
