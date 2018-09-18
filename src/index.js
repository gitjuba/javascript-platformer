import _ from 'lodash';
import levels from './levels';
import { collidePointRectangle, collidePlayerObstacle } from './collision-detection';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

const GRID_SIZE = 10;
const PLAYER_W = 2 * GRID_SIZE;
const PLAYER_H = 2 * GRID_SIZE;

const NUM_LIVES = 3;

const Objects = {
  NONE: 0,
  PLAYER: 1,
  GOAL: 2,
  OBSTACLE: 3
};

const GameStates = {
  SPLASH: 0,
  GAME: 1,
  EDITOR: 2,
  GAME_OVER: 3,
  GAME_COMPLETE: 4
};

let mouseX, mouseY, dragOffsetX, dragOffsetY;

// a "blank" level isn't exactly blank
const blankLevel = [{ type: 2, x: 710, y: 320, w: 20, h: 20 }, { type: 1, x: 550, y: 320, w: 20, h: 20 }, { type: 3, x: 480, y: 380, w: 320, h: 20 }];

const editorState = {
  deleteObject: false,
  selectedObject: undefined,
  newObjectType: Objects.OBSTACLE,
  newObject: undefined,
  levelObjects: []
};

const snapToGrid = val => GRID_SIZE * Math.round(val / GRID_SIZE);

const getObjectUnderCursor = () => {
  const objectsUnderCursor = [];
  for (let i = 0; i < editorState.levelObjects.length; i++) {
    const object = editorState.levelObjects[i];
    if (collidePointRectangle(mouseX, mouseY, object.x, object.y, object.w, object.h)) {
      objectsUnderCursor.push(i);
    }
  }
  if (objectsUnderCursor.length > 0) {
    // In the case of several overlapping objects, return the one with largest index, i.e. the one added most recently.
    return Math.max(...objectsUnderCursor);
  } else {
    return undefined;
  }
};

const removeObjectOfType = objType => {
  const ind = editorState.levelObjects.findIndex(obj => obj.type === objType);
  if (ind >= 0) {
    editorState.levelObjects.splice(ind, 1);
  }
};

const checkDimensions = obj => {
  if (obj.w === 0 || obj.h === 0) {
    return false;
  }
  if (obj.w < 0) {
    obj.x += obj.w;
    obj.w *= -1;
  }
  if (obj.h < 0) {
    obj.y += obj.h;
    obj.h *= -1;
  }
  return true;
};

const editorHandleMouseMove = e => {
  mouseX = e.clientX - rect.left - root.scrollLeft;
  mouseY = e.clientY - rect.top - root.scrollTop;
  if (editorState.selectedObject !== undefined) {
    editorState.levelObjects[editorState.selectedObject].x = snapToGrid(mouseX - dragOffsetX);
    editorState.levelObjects[editorState.selectedObject].y = snapToGrid(mouseY - dragOffsetY);
  } else if (editorState.newObject !== undefined) {
    if (editorState.newObjectType === Objects.OBSTACLE) {
      editorState.newObject.w = snapToGrid(mouseX - editorState.newObject.x);
      editorState.newObject.h = snapToGrid(mouseY - editorState.newObject.y);
    } else {
      editorState.newObject.x = snapToGrid(mouseX);
      editorState.newObject.y = snapToGrid(mouseY);
    }
  }
};

const editorHandleMouseDown = () => {
  editorState.selectedObject = getObjectUnderCursor();
  if (editorState.selectedObject !== undefined) {
    if (editorState.deleteObject) {
      editorState.levelObjects.splice(Number(editorState.selectedObject), 1);
      editorState.selectedObject = undefined;
    } else {
      dragOffsetX = mouseX - editorState.levelObjects[editorState.selectedObject].x;
      dragOffsetY = mouseY - editorState.levelObjects[editorState.selectedObject].y;
    }
  } else {
    if (editorState.newObjectType !== Objects.OBSTACLE) {
      // There can be only one start and one goal.
      removeObjectOfType(editorState.newObjectType);
    }
    const newObjWidth = editorState.newObjectType === Objects.OBSTACLE ? 0 : PLAYER_W;
    const newObjHeight = editorState.newObjectType === Objects.OBSTACLE ? 0 : PLAYER_H;
    editorState.newObject = {
      type: editorState.newObjectType,
      x: snapToGrid(mouseX),
      y: snapToGrid(mouseY),
      w: newObjWidth,
      h: newObjHeight
    };
  }
};

const editorHandleMouseUp = () => {
  editorState.selectedObject = undefined;
  if (editorState.newObject !== undefined) {
    if (checkDimensions(editorState.newObject)) {
      editorState.levelObjects.push(editorState.newObject);
    }
    editorState.newObject = undefined;
  }
};

const editorHandleKeyDown = e => {
  switch (e.keyCode) {
    case 32: // space
      gameStateChange(GameStates.GAME);
      break;
    case 83: // 's'
      editorState.newObjectType = Objects.PLAYER;
      break;
    case 71: // 'g'
      editorState.newObjectType = Objects.GOAL;
      break;
    case 79: // 'o'
      editorState.newObjectType = Objects.OBSTACLE;
      break;
    case 65: // 'a', add new level after current level
      levels.splice(editorState.levelInd + 1, 0, _.cloneDeep(blankLevel));
      startLevelEditor(editorState.levelInd + 1);
      break;
    case 73: // 'i', insert new level before current one
      levels.splice(editorState.levelInd, 0, _.cloneDeep(blankLevel));
      startLevelEditor(editorState.levelInd);
      break;
    case 81: // 'q'
      levels[editorState.levelInd] = _.cloneDeep(blankLevel);
      startLevelEditor(editorState.levelInd);
      break;
    case 80: // 'p'
      console.log(JSON.stringify(levels).replace(/"/g, ''));
      break;
    case 16: // shift
      editorState.deleteObject = true;
      break;
    default:
      console.log(e.keyCode);
      break;
  }
};

const editorHandleKeyUp = e => {
  switch (e.keyCode) {
    case 16:
      editorState.deleteObject = false;
      break;
    default:
      break;
  }
};

const drawHelperLines = () => {
  ctx.strokeStyle = 'lightgreen';
  // divide to quadrants
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2, 0);
  ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, CANVAS_HEIGHT / 2);
  ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT / 2);
  ctx.stroke();

  const nDivsHorizontal = 16;
  const nDivsVertical = 36;
  ctx.setLineDash([5, 5]);
  for (let i = 0; i < nDivsHorizontal; i++) {
    // vertical lines
    ctx.beginPath();
    ctx.moveTo(i * CANVAS_WIDTH / nDivsHorizontal, 0);
    ctx.lineTo(i * CANVAS_WIDTH / nDivsHorizontal, CANVAS_HEIGHT);
    ctx.stroke();
  }

  for (let i = 0; i < nDivsVertical; i++) {
    // horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, i * CANVAS_HEIGHT / nDivsVertical);
    ctx.lineTo(CANVAS_WIDTH, i * CANVAS_HEIGHT / nDivsVertical);
    ctx.stroke();
  }
  ctx.setLineDash([]);
};

const getFillStyle = objType => {
  switch (objType) {
    case Objects.OBSTACLE:
      return 'black';
    case Objects.PLAYER:
      return 'blue';
    case Objects.GOAL:
      return 'red';
  }
};

const startLevelEditor = levelInd => {
  editorState.levelInd = levelInd;
  editorState.levelObjects = levels[levelInd];
  console.log(`Editing level ${levelInd} of ${levels.length}`);
};

const quitLevelEditor = () => {};

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

  // Level progress
  var iLevel = 0;
  ctx.fillStyle = 'black';
  for (var lev in _.range(levels.length - player.levelProgress - 1)) {
    ctx.fillRect(CANVAS_WIDTH - 20 - iLevel*15, 10, 10, 10);
    iLevel++;
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
