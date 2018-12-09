import { Layout, GameStates } from './parameters';
import * as _ from 'lodash';

const leftMargin = 100;
const topMargin = 200;

export default function GameOver(onStateChange) {
  this.eventHandlers = {
    keydown: e => {
      if (e.keyCode === 32) {
        this.onExit(GameStates.SPLASH);
      }
    }
  };

  this.onEnter = function() {
    console.log('game over on enter');
    _.keys(this.eventHandlers).forEach(event => {
      window.addEventListener(event, this.eventHandlers[event]);
    });
  };

  this.onExit = function(toState) {
    console.log('game over on exit');
    _.keys(this.eventHandlers).forEach(event => {
      window.removeEventListener(event, this.eventHandlers[event]);
    });
    onStateChange(toState);
  };

  this.update = function(ctx) {
    ctx.clearRect(0, 0, Layout.CANVAS_WIDTH, Layout.CANVAS_HEIGHT);

    ctx.fillStyle = 'black';
    ctx.font = '48px serif';
    ctx.fillText('game over', leftMargin, topMargin);
    ctx.font = '24px serif';
    ctx.fillText('press space', leftMargin, topMargin + 100);
  };
}
