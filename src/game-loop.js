import { Layout, Game, Objects, GameStates } from './parameters';
import { collidePlayerObstacle } from './collision-detection';
import * as _ from 'lodash';

const levels = require('./levels.json');

console.log(Game);

function State() {
  this.params = Game;

  this.player = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    newJump: true,
    jumpDuration: 0,
    numLives: this.params.NUM_LIVES
  };

  this.level = {
    ind: 0,
    objects: [],
    start: {},
    goal: {}
  };

  this.resetLevel = function(level) {
    const objects = levels[level].filter(obj => obj.type === Objects.OBSTACLE);
    const start = levels[level].find(obj => obj.type === Objects.PLAYER);
    const goal = levels[level].find(obj => obj.type === Objects.GOAL);
    this.level = {
      ind: level,
      objects,
      start,
      goal
    };
    console.log(this.level.start.x);

    this.player = {
      x: start.x,
      y: start.y,
      vx: 0,
      vy: 0,
      newJump: true,
      jumpDuration: 0,
      numLives: this.player.numLives
    };
    console.log(this.player);
  };

  this.resetCurrentLevel = function() {
    this.resetLevel(this.level.ind);
  };

  this.resetGame = function() {
    this.player.numLives = this.params.NUM_LIVES;
    this.resetLevel(0);
  };

  this.isLastLevel = function() {
    return this.level.ind === levels.length - 1;
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

  this.loseLife = function() {
    this.player.numLives -= 1;
  };

  this.isPlayerOutOfLives = function() {
    return this.player.numLives === 0;
  };

  this.isPlayerOnSurface = function() {
    return this.level.objects.some(
      obj =>
        this.player.y === obj.y - Layout.PLAYER_H &&
        this.player.x + Layout.PLAYER_W >= obj.x &&
        this.player.x <= obj.x + obj.w
    );
  };

  this.hasPlayerReachedGoal = function() {
    return collidePlayerObstacle(this.player, this.level.goal).isColliding;
  };

  this.update = function(input) {
    // Update state based on user input.
    // Only stuff which does not change the program state (game over etc)
    const isOnSurface = this.isPlayerOnSurface();
    if (input.left) {
      if (isOnSurface) {
        this.player.vx -= this.params.playerAccHorizontalGround;
      } else {
        this.player.vx -= this.params.playerAccHorizontalAirForced;
      }
      if (this.player.vx < -this.params.playerMaxSpeedHorizontal) {
        this.player.vx = -this.params.playerMaxSpeedHorizontal;
      }
    } else if (input.right) {
      if (isOnSurface) {
        this.player.vx += this.params.playerAccHorizontalGround;
      } else {
        this.player.vx += this.params.playerAccHorizontalAirForced;
      }
      if (this.player.vx > this.params.playerMaxSpeedHorizontal) {
        this.player.vx = this.params.playerMaxSpeedHorizontal;
      }
    } else {
      if (isOnSurface) {
        this.player.vx +=
          this.player.vx < 0 ? this.params.playerAccHorizontalGround : -this.params.playerAccHorizontalGround;
        if (Math.abs(this.player.vx) < 2 * this.params.playerAccHorizontalGround) {
          this.player.vx = 0;
        }
      } else {
        this.player.vx +=
          this.player.vx < 0 ? this.params.playerAccHorizontalAirFree : -this.params.playerAccHorizontalAirFree;
        if (Math.abs(this.player.vx) < 2 * this.params.playerAccHorizontalAirFree) {
          this.player.vx = 0;
        }
      }
    }

    if (input.up && this.player.newJump) {
      if (isOnSurface) {
        this.player.jumpDuration = 0;
        this.player.vy -= this.params.playerAccVertical;
      }
      if (this.player.jumpDuration < this.params.maxJumpDuration) {
        this.player.vy -= this.params.playerAccVertical;
        if (this.player.vy < -this.params.playerMaxSpeedVertical) {
          this.player.vy = -this.params.playerMaxSpeedVertical;
        }
      } else {
        this.player.newJump = false;
      }
    }

    this.player.x += this.player.vx;
    if (!isOnSurface) {
      this.player.jumpDuration += 1;
      this.player.vy += this.params.gravitationalPull;
      if (this.player.vy > this.params.playerMaxSpeedVertical) {
        this.player.vy = this.params.playerMaxSpeedVertical;
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
          this.player.jumpDuration = this.params.maxJumpDuration;
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

export default function GameLoop(onStateChange) {
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
        case 18: // once I saw this logged when pressing up (?)
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
          this.state.player.newJump = true;
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
    console.log('game loop on enter');
    _.keys(this.eventHandlers).forEach(event => {
      window.addEventListener(event, this.eventHandlers[event]);
    });
    this.state.resetGame();
  };

  this.onExit = function(toState) {
    this.input.reset();
    console.log('game loop on exit');
    _.keys(this.eventHandlers).forEach(event => {
      window.removeEventListener(event, this.eventHandlers[event]);
    });
    onStateChange(toState);
  };

  this.getLevelProgress = function() {
    return this.state.level.ind;
  };

  this.update = function(ctx) {
    // Use input to change physical state.
    this.state.update(this.input);

    if (this.state.hasPlayerReachedGoal()) {
      if (this.state.isLastLevel()) {
        this.onExit(GameStates.GAME_COMPLETE);
      } else {
        this.state.nextLevel();
      }
    }

    if (this.state.isPlayerDead()) {
      this.state.loseLife();
      if (this.state.isPlayerOutOfLives()) {
        this.onExit(GameStates.GAME_OVER);
      } else {
        this.state.resetCurrentLevel();
      }
    }

    // Clear previous frame.
    ctx.clearRect(0, 0, Layout.CANVAS_WIDTH, Layout.CANVAS_HEIGHT);

    // Draw obstacles.
    ctx.fillStyle = 'black';
    this.state.level.objects.forEach(obj => ctx.fillRect(obj.x, obj.y, obj.w, obj.h));

    // Draw goal
    ctx.fillStyle = 'red';
    const goal = this.state.level.goal;
    ctx.fillRect(goal.x, goal.y, goal.w, goal.h);

    // Draw player.
    ctx.fillStyle = 'blue';
    ctx.fillRect(this.state.player.x, this.state.player.y, Layout.PLAYER_W, Layout.PLAYER_H);

    // Draw lives left
    var iLife = 0;
    for (var life in _.range(this.state.player.numLives - 1)) {
      ctx.fillRect(10 + iLife * 30, 10, Layout.PLAYER_W, Layout.PLAYER_H);
      iLife++;
    }

    // Level progress
    var iLevel = 0;
    ctx.fillStyle = 'black';
    for (var lev in _.range(levels.length - this.state.level.ind - 1)) {
      ctx.fillRect(Layout.CANVAS_WIDTH - 20 - iLevel * 15, 10, 10, 10);
      iLevel++;
    }
  };
}
