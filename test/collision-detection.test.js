import assert from 'assert';

import { collidePointRectangle, collidePlayerObstacle } from './../src/collision-detection';
import { Layout } from './../src/parameters';

describe('collision-detection', function() {
  describe('collidePlayerObstacle', function() {
    it('should collide a thing with itself', function() {
      const player = { x: 0, y: 0, w: 100, h: 100, vx: 0, vy: 0 };
      const obstacle = { x: 0, y: 0, w: 100, h: 100 };
      const collision = collidePlayerObstacle(player, obstacle);
      assert(collision.isColliding);
    });

    it('should recognize a direct left collision', function() {
      const player = { x: 81, y: 140, w: 20, h: 20, vx: 5, vy: 0 };
      const obstacle = { x: 100, y: 100, w: 100, h: 100 };
      const collision = collidePlayerObstacle(player, obstacle);
      assert(collision.isColliding);
      assert(collision.deltaX < 0);
      assert(collision.deltaY === 0);
      assert(collision.deltaVx < 0);
      assert(collision.deltaVy === 0);
    });

    it('should recognize a direct right collision', function() {
      const player = { x: 199, y: 140, w: 20, h: 20, vx: -5, vy: 0 };
      const obstacle = { x: 100, y: 100, w: 100, h: 100 };
      const collision = collidePlayerObstacle(player, obstacle);
      assert(collision.isColliding);
      assert(collision.deltaX > 0);
      assert(collision.deltaY === 0);
      assert(collision.deltaVx > 0);
      assert(collision.deltaVy === 0);
    });

    it('should recognize a direct top collision', function() {
      const player = { x: 140, y: 81, w: 20, h: 20, vx: 0, vy: 5 };
      const obstacle = { x: 100, y: 100, w: 100, h: 100 };
      const collision = collidePlayerObstacle(player, obstacle);
      assert(collision.isColliding);
      assert(collision.deltaX === 0);
      assert(collision.deltaY < 0);
      assert(collision.deltaVx === 0);
      assert(collision.deltaVy < 0);
    });

    it('should recognize a direct bottom collision', function() {
      const player = { x: 140, y: 199, w: 20, h: 20, vx: 0, vy: -5 };
      const obstacle = { x: 100, y: 100, w: 100, h: 100 };
      const collision = collidePlayerObstacle(player, obstacle);
      assert(collision.isColliding);
      assert(collision.deltaX === 0);
      assert(collision.deltaY > 0);
      assert(collision.deltaVx === 0);
      assert(collision.deltaVy > 0);
    });
  });
});
