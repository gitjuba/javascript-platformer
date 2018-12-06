import { Layout, Game, Objects, GameStates } from './parameters';
import { collidePlayerObstacle } from './collision-detection';
import * as _ from 'lodash';

const levels = require('./levels.json');

function State() {
  this.player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    newJump: false,
    jumpDuration: 0
  };

  this.level = {
    ind: 0,
    objects: [],
    start: {},
    goal: {}
  };

  this.resetLevel = function(level) {
    this.level = {
      ind: level,
      objects: levels[level].filter(obj => obj.type === Objects.OBSTACLE),
      start: levels[level].find(obj => obj.type === Objects.PLAYER),
      goal: levels[level].find(obj => obj.type === Objects.GOAL)
    };

    this.player = {
      x: this.level.start.x,
      y: this.level.start.y,
      vx: 0,
      vy: 0,
      jumpDuration: 0
    };
  };

  this.nextLevel = function() {
    if (this.level.ind === levels.length - 1) {
      this.resetLevel(0);
    } else {
      this.resetLevel(this.level.ind + 1);
    }
  };

  this.previousLevel = function() {
    if (this.level.ind === 0) {
      this.resetLevel(levels.length - 1);
    } else {
      this.resetLevel(this.level.ind - 1);
    }
  };

  this.isPlayerDead = function() {
    return this.player.y > Layout.CANVAS_HEIGHT;
  };

  this.isPlayerOnSurface = function() {
    return this.level.objects.some(
      obj =>
        this.player.y === obj.y - Layout.PLAYER_H &&
        this.player.x + Layout.PLAYER_W >= obj.x &&
        this.player.x <= obj.x + obj.w
    );
  };

  this.update = function(input) {
    // Update state based on user input.
    // Only stuff which does not change the program state (game over etc)
    const isOnSurface = this.isPlayerOnSurface();
    if (input.left) {
      if (isOnSurface) {
        this.player.vx -= Game.playerAccHorizontalGround;
      } else {
        this.player.vx -= Game.playerAccHorizontalAirForced;
      }
      if (this.player.vx < -Game.playerMaxSpeedHorizontal) {
        this.player.vx = -Game.playerMaxSpeedHorizontal;
      }
    } else if (input.right) {
      if (isOnSurface) {
        this.player.vx += Game.playerAccHorizontalGround;
      } else {
        this.player.vx += Game.playerAccHorizontalAirForced;
      }
      if (this.player.vx > Game.playerMaxSpeedHorizontal) {
        this.player.vx = Game.playerMaxSpeedHorizontal;
      }
    } else {
      if (isOnSurface) {
        this.player.vx += this.player.vx < 0 ? Game.playerAccHorizontalGround : -Game.playerAccHorizontalGround;
        if (Math.abs(Game.player.vx) < 2 * Game.playerAccHorizontalGround) {
          this.player.vx = 0;
        }
      } else {
        this.player.vx += this.player.vx < 0 ? this.playerAccHorizontalAirFree : -Game.playerAccHorizontalAirFree;
        if (Math.abs(this.player.vx) < 2 * this.playerAccHorizontalAirFree) {
          this.player.vx = 0;
        }
      }
    }

    if (input.up && this.player.newJump) {
      if (isOnSurface) {
        this.player.jumpDuration = 0;
        this.player.vy -= Game.playerAccVertical;
      }
      if (this.player.jumpDuration < Game.maxJumpDuration) {
        this.player.vy -= Game.playerAccVertical;
        if (this.player.vy < -Game.playerMaxSpeedVertical) {
          this.player.vy = -Game.playerMaxSpeedVertical;
        }
      } else {
        this.player.newJump = false;
      }
    }

    this.player.x += this.player.vx;
    if (!isOnSurface) {
      this.player.jumpDuration += 1;
      this.player.vy += Game.gravitationalPull;
      if (this.player.vy > Game.playerMaxSpeedVertical) {
        this.player.vy = Game.playerMaxSpeedVertical;
      }
      this.player.y += this.player.vy;
    } else {
      // The player has just jumped.
      this.player.y += this.player.vy;
    }

    // Check collision with obstacles (not goal)
    this.level.objects.forEach(obstacle => {
      const collision = collidePlayerObstacle(this.player, obstacle);
      if (collision.isColliding) {
        this.player.x += collision.deltaX;
        this.player.y += collision.deltaY;
        this.player.vx += collision.deltaVx;
        this.player.vy += collision.deltaVy;
        if (collision.resetJump) {
          this.player.jumpDuration = Game.maxJumpDuration;
        }
      }
    });
  };
}

function Input() {
  this.up = false;
  this.left = false;
  this.right = false;

  this.reset = function() {
    this.up = false;
    this.left = false;
    this.right = false;
  };
}

export default function Game(onStateChange) {
  this.state = new State();
  this.input = new Input();

  this.eventHandlers = {
    keydown: e => {
      switch (e.keyCode) {
        case 69: // 'e'
          console.log('todo: open editor');
          // gameStateChange(GameStates.EDITOR);
          break;
        case 37: // left
          this.input.right = false;
          this.input.left = true;
          break;
        case 38: // up
          this.input.up = true;
          break;
        case 39: // right
          this.input.left = false;
          this.input.right = true;
          break;
        case 78: // 'n' (advance to next level)
          this.state.nextLevel();
          break;
        case 80: // 'p' (retreat to previous level)
          this.state.previousLevel();
          break;
        default:
          console.log(`key pressed: ${e.keyCode}`);
          break;
      }
    },
    keyup: e => {
      switch (e.keyCode) {
        case 37:
          this.input.left = false;
          break;
        case 38:
          this.input.up = false;
          this.input.newJump = true;
          break;
        case 39:
          this.input.right = false;
          break;
        default:
          break;
      }
    }
  };

  this.onEnter = function() {
    console.log('game on enter');
    _.keys(this.eventHandlers).forEach(event => {
      window.addEventListener(event, this.eventHandlers[event]);
    });
  };

  this.onExit = function(toState) {
    console.log('game on exit');
    _.keys(this.eventHandlers).forEach(event => {
      window.removeEventListener(event, this.eventHandlers[event]);
    });
    onStateChange(toState);
  };

  this.update = ctx => {
    // Use input to change physical state.
    this.state.update(this.input);
  };
}
