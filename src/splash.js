import { Layout, GameStates } from './parameters';
import * as _ from 'lodash';

const leftMargin = 100;
const topMargin = 200;

export default function Splash(onStateChange) {
  this.eventHandlers = {
    keydown: e => {
      if (e.keyCode === 32) {
        this.onExit(GameStates.GAME);
      }
    }
  };

  this.addEventListeners = function() {
    console.log(this);
    _.keys(this.eventHandlers).forEach(event => {
      window.addEventListener(event, this.eventHandlers[event]);
    });
  };

  this.onEnter = function() {
    console.log('splash on enter');
    this.addEventListeners();
  };

  this.onExit = function(toState) {
    console.log('splash on exit');
    _.keys(this.eventHandlers).forEach(event => {
      window.removeEventListener(event, this.eventHandlers[event]);
    });
    onStateChange(toState);
  };

  this.update = function(ctx) {
    ctx.clearRect(0, 0, Layout.CANVAS_WIDTH, Layout.CANVAS_HEIGHT);

    ctx.fillStyle = 'black';
    ctx.font = '48px serif';
    ctx.fillText('a platforming game', leftMargin, topMargin);
    ctx.font = '24px serif';
    ctx.fillText('arrow keys to control', leftMargin, topMargin + 100);
    ctx.fillText('space bar to start', leftMargin, topMargin + 130);
    ctx.fillText('esc to reset', leftMargin, topMargin + 160);
  };
}
