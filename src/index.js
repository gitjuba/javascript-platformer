import _ from 'lodash';
import levels from './levels.json';
import { collidePointRectangle, collidePlayerObstacle } from './collision-detection';
import { Layout, Game, Objects, GameStates } from './parameters';

import GameLoop from './game-loop';
import Splash from './splash';
import GameOver from './game-over';
import GameComplete from './game-complete';

const State = {};
function onStateChange(toState) {
  console.log('on state chnage');
  console.log(toState);
  gameStateChange(toState);
}

State[GameStates.GAME] = new GameLoop(onStateChange);
State[GameStates.SPLASH] = new Splash(onStateChange);
State[GameStates.GAME_COMPLETE] = new GameComplete(onStateChange);
State[GameStates.GAME_OVER] = new GameOver(onStateChange);
console.log(State);

let mouseX, mouseY, dragOffsetX, dragOffsetY;

// a "blank" level isn't exactly blank
const blankLevel = [
  { type: 2, x: 710, y: 320, w: 20, h: 20 },
  { type: 1, x: 550, y: 320, w: 20, h: 20 },
  { type: 3, x: 480, y: 380, w: 320, h: 20 }
];

const editorState = {
  deleteObject: false,
  selectedObject: undefined,
  newObjectType: Objects.OBSTACLE,
  newObject: undefined,
  levelObjects: []
};

const snapToGrid = val => Layout.GRID_SIZE * Math.round(val / Layout.GRID_SIZE);

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
    const newObjWidth = editorState.newObjectType === Objects.OBSTACLE ? 0 : Layout.PLAYER_W;
    const newObjHeight = editorState.newObjectType === Objects.OBSTACLE ? 0 : Layout.PLAYER_H;
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
      console.log(JSON.stringify(levels));
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
  ctx.moveTo(Layout.CANVAS_WIDTH / 2, 0);
  ctx.lineTo(Layout.CANVAS_WIDTH / 2, Layout.CANVAS_HEIGHT);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, Layout.CANVAS_HEIGHT / 2);
  ctx.lineTo(Layout.CANVAS_WIDTH, Layout.CANVAS_HEIGHT / 2);
  ctx.stroke();

  const nDivsHorizontal = 16;
  const nDivsVertical = 36;
  ctx.setLineDash([5, 5]);
  for (let i = 0; i < nDivsHorizontal; i++) {
    // vertical lines
    ctx.beginPath();
    ctx.moveTo((i * Layout.CANVAS_WIDTH) / nDivsHorizontal, 0);
    ctx.lineTo((i * Layout.CANVAS_WIDTH) / nDivsHorizontal, Layout.CANVAS_HEIGHT);
    ctx.stroke();
  }

  for (let i = 0; i < nDivsVertical; i++) {
    // horizontal lines
    ctx.beginPath();
    ctx.moveTo(0, (i * Layout.CANVAS_HEIGHT) / nDivsVertical);
    ctx.lineTo(Layout.CANVAS_WIDTH, (i * Layout.CANVAS_HEIGHT) / nDivsVertical);
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
canvas.width = Layout.CANVAS_WIDTH;
canvas.height = Layout.CANVAS_HEIGHT;

const ctx = canvas.getContext('2d');

const rect = canvas.getBoundingClientRect();
const root = document.documentElement;

let gameState;

let levelObjects = [];

const updateEditor = () => {
  ctx.clearRect(0, 0, Layout.CANVAS_WIDTH, Layout.CANVAS_HEIGHT);
  drawHelperLines();
  ctx.fillStyle = 'purple';
  ctx.fillText(`(${mouseX}, ${mouseY})`, mouseX, mouseY);
  editorState.levelObjects.forEach(object => {
    ctx.fillStyle = getFillStyle(object.type);
    ctx.fillRect(object.x, object.y, object.w, object.h);
  });
  if (editorState.newObject !== undefined) {
    ctx.fillStyle = getFillStyle(editorState.newObject.type);
    ctx.fillRect(
      editorState.newObject.x,
      editorState.newObject.y,
      editorState.PLAYERnewObject.w,
      editorState.newObject.h
    );
  }
};

const update = () => {
  switch (gameState) {
    case GameStates.EDITOR:
      updateEditor();
      break;
    default:
      State[gameState].update(ctx);
  }

  window.requestAnimationFrame(update);
};

const gameStateChange = newState => {
  if (newState === gameState) {
    return;
  }
  let startingLevel = 0;
  // Remove event listeners of current state
  if (gameState === GameStates.EDITOR) {
    window.removeEventListener('mousemove', editorHandleMouseMove);
    window.removeEventListener('mousedown', editorHandleMouseDown);
    window.removeEventListener('mouseup', editorHandleMouseUp);
    window.removeEventListener('keydown', editorHandleKeyDown);
    window.removeEventListener('keyup', editorHandleKeyUp);
    startingLevel = editorState.levelInd;
  }
  // Add new state event listeners
  if (
    newState === GameStates.SPLASH ||
    newState === GameStates.GAME_COMPLETE ||
    newState === GameStates.GAME_OVER ||
    newState === GameStates.GAME
  ) {
    State[newState].onEnter();
  }
  if (newState === GameStates.EDITOR) {
    window.addEventListener('mousemove', editorHandleMouseMove);
    window.addEventListener('mousedown', editorHandleMouseDown);
    window.addEventListener('mouseup', editorHandleMouseUp);
    window.addEventListener('keydown', editorHandleKeyDown);
    window.addEventListener('keyup', editorHandleKeyUp);
    const levelInd = State[GameStates.GAME].getLevelProgress();
    levelObjects = levels[levelInd];
    startLevelEditor(levelInd);
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

console.log('to splash');
gameStateChange(GameStates.SPLASH);

update();
