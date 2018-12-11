import assert from 'assert';

import { collidePointRectangle, collidePlayerObstacle } from './../src/collision-detection';
import { Layout } from './../src/parameters';

describe('collidePlayerObstacle', function() {
  it('should collide a thing with itself', function() {
    const obstacle = { x: 0, y: 0, w: 100, h: 100 };
    const player = { x: 0, y: 0, w: 100, h: 100 };
    const collision = collidePlayerObstacle(player, obstacle);
    assert(collision.isColliding);
  });
});
