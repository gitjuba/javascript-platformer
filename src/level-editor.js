import * as _ from 'lodash';

import { Layout, Objects, GameStates } from './parameters';
import { collidePointRectangle } from './collision-detection';

export default function LevelEditor(onStateChange, initParams) {
  this.levels = _.cloneDeep(initParams.levels); // This changes when adding new levels.

  this.levelInd = 0;
  this.levelObjects = [];
  this.selectedObject = undefined;
  this.newObject = undefined;
  this.newObjectType = Objects.OBSTACLE;
  this.deleteObject = false;

  this.mouseDown = false;
  this.mouseX = 0;
  this.mouseY = 0;
  this.dragOffsetX = 0;
  this.dragOffsetY = 0;
  this.globalOffset = initParams.globalOffset;

  this.editLevel = function(levelInd) {
    this.levelInd = levelInd;
    this.levelObjects = this.levels[levelInd];
    console.log(`Editing level ${levelInd} of ${this.levels.length}`);
  };

  this.snapToGrid = val => Layout.GRID_SIZE * Math.round(val / Layout.GRID_SIZE);

  this.blankLevel = function() {
    // a "blank" level isn't exactly blank
    return [
      { type: 2, x: 710, y: 320, w: 20, h: 20 },
      { type: 1, x: 550, y: 320, w: 20, h: 20 },
      { type: 3, x: 480, y: 380, w: 320, h: 20 }
    ];
  };

  this.getObjectUnderCursor = function() {
    const objectsUnderCursor = [];
    for (let i = 0; i < this.levelObjects.length; i++) {
      const object = this.levelObjects[i];
      if (collidePointRectangle(this.mouseX, this.mouseY, object.x, object.y, object.w, object.h)) {
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

  this.removeObjectOfType = function(objType) {
    const ind = this.levelObjects.findIndex(obj => obj.type === objType);
    if (ind >= 0) {
      this.levelObjects.splice(ind, 1);
    }
  };

  this.checkDimensions = function(obj) {
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

  this.eventHandlers = {
    keydown: e => {
      switch (e.keyCode) {
        case 32: // space
          this.onExit(GameStates.GAME);
          break;
        case 83: // 's'
          this.newObjectType = Objects.PLAYER;
          break;
        case 71: // 'g'
          this.newObjectType = Objects.GOAL;
          break;
        case 79: // 'o'
          this.newObjectType = Objects.OBSTACLE;
          break;
        case 65: // 'a', add new level after current level
          this.levels.splice(this.levelInd + 1, 0, this.blankLevel());
          this.editLevel(this.levelInd + 1);
          break;
        case 73: // 'i', insert new level before current one
          this.levels.splice(this.levelInd, 0, this.blankLevel());
          this.editLevel(this.levelInd);
          break;
        case 81: // 'q'
          this.levels[this.levelInd] = this.blankLevel();
          this.editLevel(this.levelInd);
          break;
        case 80: // 'p'
          console.log(JSON.stringify(this.levels, null, 2));
          break;
        case 16: // shift
          this.deleteObject = true;
          break;
        // 'y', 'h' and 'j', 'k' adjust width and height of object
        case 89: // 'y',
          if (this.selectedObject !== undefined) {
            const obj = this.levelObjects[this.selectedObject];
            if (obj.type === Objects.OBSTACLE) {
              obj.y -= 10;
              obj.h += 10;
            }
          }
          break;
        case 72: // 'h'
          if (this.selectedObject !== undefined) {
            const obj = this.levelObjects[this.selectedObject];
            if (obj.type === Objects.OBSTACLE && obj.h > 10) {
              obj.y += 10;
              obj.h -= 10;
            }
          }
          break;
        case 74: // 'j',
          if (this.selectedObject !== undefined) {
            const obj = this.levelObjects[this.selectedObject];
            if (obj.type === Objects.OBSTACLE && obj.w > 10) {
              obj.w -= 10;
            }
          }
          break;
        case 75: // 'k'
          if (this.selectedObject !== undefined) {
            const obj = this.levelObjects[this.selectedObject];
            if (obj.type === Objects.OBSTACLE) {
              obj.w += 10;
            }
          }
          break;
        default:
          console.log('key pressed: ' + e.keyCode);
          break;
      }
    },
    keyup: e => {
      switch (e.keyCode) {
        case 16:
          this.deleteObject = false;
          break;
        default:
          break;
      }
    },
    mousemove: e => {
      this.mouseX = e.clientX - this.globalOffset.x;
      this.mouseY = e.clientY - this.globalOffset.y;
      if (this.mouseDown) {
        if (this.selectedObject !== undefined) {
          this.levelObjects[this.selectedObject].x = this.snapToGrid(this.mouseX - this.dragOffsetX);
          this.levelObjects[this.selectedObject].y = this.snapToGrid(this.mouseY - this.dragOffsetY);
        } else if (this.newObject !== undefined) {
          if (this.newObjectType === Objects.OBSTACLE) {
            this.newObject.w = this.snapToGrid(this.mouseX - this.newObject.x);
            this.newObject.h = this.snapToGrid(this.mouseY - this.newObject.y);
          } else {
            this.newObject.x = this.snapToGrid(this.mouseX);
            this.newObject.y = this.snapToGrid(this.mouseY);
          }
        }
      }
    },
    mousedown: e => {
      this.mouseDown = true;
      this.selectedObject = this.getObjectUnderCursor();
      if (this.selectedObject !== undefined) {
        if (this.deleteObject) {
          this.levelObjects.splice(Number(this.selectedObject), 1);
          this.selectedObject = undefined;
        } else {
          this.dragOffsetX = this.mouseX - this.levelObjects[this.selectedObject].x;
          this.dragOffsetY = this.mouseY - this.levelObjects[this.selectedObject].y;
        }
      } else {
        if (this.newObjectType !== Objects.OBSTACLE) {
          // There can be only one start and one goal.
          this.removeObjectOfType(this.newObjectType);
        }
        const newObjWidth = this.newObjectType === Objects.OBSTACLE ? 0 : Layout.PLAYER_W;
        const newObjHeight = this.newObjectType === Objects.OBSTACLE ? 0 : Layout.PLAYER_H;
        this.newObject = {
          type: this.newObjectType,
          x: this.snapToGrid(this.mouseX),
          y: this.snapToGrid(this.mouseY),
          w: newObjWidth,
          h: newObjHeight
        };
      }
    },
    mouseup: () => {
      this.mouseDown = false;
      if (this.newObject !== undefined) {
        if (this.checkDimensions(this.newObject)) {
          this.levelObjects.push(this.newObject);
        }
        this.newObject = undefined;
      }
    }
  };

  this.onEnter = function(params) {
    _.keys(this.eventHandlers).forEach(event => {
      window.addEventListener(event, this.eventHandlers[event]);
    });
    this.editLevel(params.levelInd);
  };

  this.onExit = function(toState) {
    _.keys(this.eventHandlers).forEach(event => {
      window.removeEventListener(event, this.eventHandlers[event]);
    });
    onStateChange(toState, { levels: this.levels, levelInd: this.levelInd });
  };

  this.drawHelperLines = function(ctx) {
    ctx.strokeStyle = 'lightgreen';
    ctx.setLineDash([]);
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

  this.getFillStyle = function(objType) {
    switch (objType) {
      case Objects.OBSTACLE:
        return 'black';
      case Objects.PLAYER:
        return 'blue';
      case Objects.GOAL:
        return 'red';
    }
  };

  this.update = function(ctx) {
    ctx.clearRect(0, 0, Layout.CANVAS_WIDTH, Layout.CANVAS_HEIGHT);
    this.drawHelperLines(ctx);
    ctx.fillStyle = 'purple';
    ctx.fillText(`(${this.mouseX}, ${this.mouseY})`, this.mouseX, this.mouseY);
    this.levelObjects.forEach(object => {
      ctx.fillStyle = this.getFillStyle(object.type);
      ctx.fillRect(object.x, object.y, object.w, object.h);
    });
    if (this.newObject !== undefined) {
      ctx.fillStyle = this.getFillStyle(this.newObject.type);
      ctx.fillRect(this.newObject.x, this.newObject.y, this.newObject.w, this.newObject.h);
    }
    if (this.selectedObject !== undefined) {
      const obj = this.levelObjects[this.selectedObject];
      ctx.strokeStyle = '#f0f';
      ctx.setLineDash([5, 10])
      ctx.strokeRect(obj.x - 5, obj.y - 5, obj.w + 10, obj.h + 10);
    }
  };
}
