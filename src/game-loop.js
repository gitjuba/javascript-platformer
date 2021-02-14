import { Layout, Game, Objects, GameStates } from './parameters';
import { collidePlayerObstacle } from './collision-detection';
import * as _ from 'lodash';

function State(levels) {
  this.levels = levels;
  this.params = Game;

  this.player = {
    x: 0,
    y: 0,
    w: Layout.PLAYER_W,
    h: Layout.PLAYER_H,
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

  this.isDebugging = false;

  this.resetLevel = function(levelInd) {
    const objects = this.levels[levelInd].filter(obj => obj.type === Objects.OBSTACLE);
    const start = this.levels[levelInd].find(obj => obj.type === Objects.PLAYER);
    const goal = this.levels[levelInd].find(obj => obj.type === Objects.GOAL);
    this.level = {
      ind: levelInd,
      objects,
      start,
      goal
    };

    this.player = {
      x: start.x,
      y: start.y,
      w: Layout.PLAYER_W,
      h: Layout.PLAYER_H,
      vx: 0,
      vy: 0,
      newJump: true,
      jumpDuration: 0,
      numLives: this.player.numLives
    };
  };

  this.resetCurrentLevel = function() {
    this.resetLevel(this.level.ind);
  };

  this.resetLives = function() {
    this.player.numLives = this.params.NUM_LIVES;
  };

  this.resetGame = function() {
    this.resetLives();
    this.resetLevel(0);
  };

  this.isLastLevel = function() {
    return this.level.ind === this.levels.length - 1;
  };

  this.nextLevel = function() {
    if (this.level.ind === this.levels.length - 1) {
      this.resetLevel(0);
    } else {
      this.resetLevel(this.level.ind + 1);
    }
  };

  this.previousLevel = function() {
    if (this.level.ind === 0) {
      this.resetLevel(this.levels.length - 1);
    } else {
      this.resetLevel(this.level.ind - 1);
    }
  };

  this.isPlayerDead = function() {
    return this.player.y > Layout.CANVAS_HEIGHT;
  };

  this.loseLife = function() {
    if (!this.isDebugging) {
      this.player.numLives -= 1;
    }
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

export default function GameLoop(onStateChange, initParams) {
  this.state = new State(initParams.levels);
  this.input = new Input();

  this.isDebugging = false;
  this.debugData = {
    positions: [],
    velocity: []
  };

  this.eventHandlers = {
    keydown: e => {
      switch (e.keyCode) {
        case 69: // 'e'
          this.onExit(GameStates.LEVEL_EDITOR);
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
        case 68: // 'd'
          this.isDebugging = !this.isDebugging;
          this.state.isDebugging = !this.state.isDebugging;
          if (this.isDebugging) {
            // Clear previous debug data when re-entering debug mode
            this.debugData.positions = [];
          }
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

  this.onEnter = function(params) {
    _.keys(this.eventHandlers).forEach(event => {
      window.addEventListener(event, this.eventHandlers[event]);
    });
    if (params) {
      if ('levels' in params) {
        this.state.levels = params.levels;
      }
      if ('levelInd' in params) {
        this.state.resetLives();
        this.state.resetLevel(params.levelInd);
      } else {
        this.state.resetGame();
      }
    } else {
      this.state.resetGame();
    }
  };

  this.onExit = function(toState) {
    this.input.reset();
    _.keys(this.eventHandlers).forEach(event => {
      window.removeEventListener(event, this.eventHandlers[event]);
    });
    onStateChange(toState, { levelInd: this.getLevelProgress(), debugData: this.debugData });
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

    // Player trail in debug mode
    if (this.isDebugging) {
      ctx.fillStyle = 'lightblue';
      this.debugData.positions.forEach(pos => {
        ctx.fillRect(pos.x, pos.y, Layout.PLAYER_W, Layout.PLAYER_H);
      });
      this.debugData.positions.push({ x: this.state.player.x, y: this.state.player.y });
    }

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

    if (this.isDebugging) {
      ctx.fillStyle = 'purple';
      ctx.font = '10px monospace';
      ctx.fillText(`v = (${this.state.player.vx.toFixed(1)}, ${this.state.player.vy.toFixed(1)})`, 10, 50);
    }

    // Draw lives left
    ctx.fillStyle = 'blue';
    _.range(this.state.player.numLives - 1).forEach(iLife => {
      ctx.fillRect(10 + iLife * 30, 10, Layout.PLAYER_W, Layout.PLAYER_H);
    });

    // Level progress
    ctx.fillStyle = 'black';
    _.range(this.state.levels.length - this.state.level.ind - 1).forEach(iLevel => {
      ctx.fillRect(Layout.CANVAS_WIDTH - 20 - iLevel * 15, 10, 10, 10);
    });
  };
}
