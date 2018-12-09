import _ from 'lodash';
import levels from './levels.json';
import { Layout, GameStates } from './parameters';

import GameLoop from './game-loop';
import Splash from './splash';
import GameOver from './game-over';
import GameComplete from './game-complete';
import LevelEditor from './level-editor';

const canvas = document.getElementById('mainCanvas');
canvas.width = Layout.CANVAS_WIDTH;
canvas.height = Layout.CANVAS_HEIGHT;

const ctx = canvas.getContext('2d');

const rect = canvas.getBoundingClientRect();
const root = document.documentElement;

const globalOffset = {
  x: rect.left + root.scrollLeft,
  y: rect.top + root.scrollTop
};

const State = {};
let currentState;
function onStateChange(toState, params) {
  console.log('on state change');
  console.log(params);
  // gameStateChange(toState, params);
  if (toState === currentState) {
    return;
  }
  currentState = toState;
  State[toState].onEnter(params);
}

State[GameStates.GAME] = new GameLoop(onStateChange, { levels });
State[GameStates.SPLASH] = new Splash(onStateChange);
State[GameStates.GAME_COMPLETE] = new GameComplete(onStateChange);
State[GameStates.GAME_OVER] = new GameOver(onStateChange);
State[GameStates.LEVEL_EDITOR] = new LevelEditor(onStateChange, { globalOffset, levels });

onStateChange(GameStates.SPLASH, {});

const update = () => {
  State[currentState].update(ctx);
  window.requestAnimationFrame(update);
};

// Always reset game by pressing Esc.
window.addEventListener('keydown', e => {
  if (e.keyCode === 27) {
    // esc
    onStateChange(GameStates.SPLASH);
  }
});

update();
