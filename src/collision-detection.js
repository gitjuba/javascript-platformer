import { Layout } from './parameters';

const collidePointRectangle = (x0, y0, x1, y1, w1, h1) => {
    return x0 > x1 && x0 < x1 + w1 && y0 > y1 && y0 < y1 + h1;
};

const collidePlayerObstacle = (player, obstacle) => {
    // Check collision between moving player and static obstacle
    let collision = {
        isColliding: false,
        deltaX: 0,
        deltaY: 0,
        deltaVx: 0,
        deltaVy: 0,
        resetJump: false
    };
    const aL = player.x + Layout.PLAYER_W - obstacle.x;
    const aR = obstacle.x + obstacle.w - player.x;
    if (aL > 0 && aR > 0) {
        const aT = player.y + Layout.PLAYER_H - obstacle.y;
        const aB = obstacle.y + obstacle.h - player.y;
        if (aT > 0 && aB > 0) {
            collision.isColliding = true;

            if (aL < Layout.PLAYER_W && Layout.PLAYER_W < aR) {
                // left collision
                if (aT < Layout.PLAYER_H && Layout.PLAYER_H < aB) {
                    // top-left
                    if (player.vx >= 0 && player.vy <= 0) {
                        // player velocity towards top-right
                        collision.deltaVx = -player.vx;
                        collision.deltaX = -aL;
                    } else if (player.vx <= 0 && player.vy >= 0) {
                        // velocity towards bottom-left
                        collision.deltaVy = -player.vy;
                        collision.deltaY = -aT;
                    } else if (player.vx > 0 && player.vy > 0) {
                        // velocity direction to bottom-right, i.e. towards the obstacle
                        if (aL > aT) {
                            collision.deltaVy = -player.vy;
                            collision.deltaY = -aT;
                        } else {
                            collision.deltaVx = -player.vx;
                            collision.deltaX = -aL;
                        }
                    } else {
                        console.log('Corner collision with velocity pointed away from obstacle!');
                    }
                } else if (aB < Layout.PLAYER_H && Layout.PLAYER_H < aT) {
                    // bottom-left
                    if (player.vx >= 0 && player.vy >= 0) {
                        // player velocity towards bottom-right
                        collision.deltaVx = -player.vx;
                        collision.deltaX = -aL;
                    } else if (player.vx <= 0 && player.vy <= 0) {
                        // velocity towards top-left
                        collision.deltaVy = -player.vy;
                        collision.deltaY = aB;
                        collision.resetJump = true;
                    } else if (player.vx > 0 && player.vy < 0) {
                        // velocity direction to top-right, i.e. towards the obstacle
                        if (aL > aB) {
                            collision.deltaVy = -player.vy;
                            collision.deltaY = aB;
                            collision.resetJump = true;
                        } else {
                            collision.deltaVx = -player.vx;
                            collision.deltaX = -aL;
                        }
                    } else {
                        console.log('Corner collision with velocity pointed away from obstacle!');
                    }
                } else {
                    // direct left
                    collision.deltaVx = -player.vx;
                    collision.deltaX = -aL;
                }
            } else if (aR < Layout.PLAYER_W && Layout.PLAYER_W < aL) {
                // right collision
                if (aT < Layout.PLAYER_H && Layout.PLAYER_H < aB) {
                    // top-right
                    if (player.vx <= 0 && player.vy <= 0) {
                        // player velocity towards top-left
                        collision.deltaVx = -player.vx;
                        collision.deltaX = aR;
                    } else if (player.vx >= 0 && player.vy >= 0) {
                        // velocity towards bottom-right
                        collision.deltaVy = -player.vy;
                        collision.deltaY = -aT;
                    } else if (player.vx < 0 && player.vy > 0) {
                        // velocity direction to bottom-left, i.e. towards the obstacle
                        if (aR > aT) {
                            collision.deltaVy = -player.vy;
                            collision.deltaY = -aT;
                        } else {
                            collision.deltaVx = -player.vx;
                            collision.deltaX = aR;
                        }
                    } else {
                        console.log('Corner collision with velocity pointed away from obstacle!');
                    }
                } else if (aB < Layout.PLAYER_H && Layout.PLAYER_H < aT) {
                    // bottom-right
                    if (player.vx <= 0 && player.vy >= 0) {
                        // player velocity towards bottom-left
                        collision.deltaVx = -player.vx;
                        collision.deltaX = aR;
                    } else if (player.vx >= 0 && player.vy <= 0) {
                        // velocity towards top-right
                        collision.deltaVy = -player.vy;
                        collision.deltaY = aB;
                        collision.resetJump = true;
                    } else if (player.vx < 0 && player.vy < 0) {
                        // velocity direction to top-left, i.e. towards the obstacle
                        if (aR > aB) {
                            collision.deltaVy = -player.vy;
                            collision.deltaY = aB;
                            collision.resetJump = true;
                        } else {
                            collision.deltaVx = -player.vx;
                            collision.deltaX = aR;
                        }
                    } else {
                        console.log('Corner collision with velocity pointed away from obstacle!');
                    }
                } else {
                    // direct right
                    collision.deltaVx = -player.vx;
                    collision.deltaX = aR;
                }
            } else {
                // either a direct top or direct bottom collision
                if (aT < aB) {
                    // direct top
                    collision.deltaVy = -player.vy;
                    collision.deltaY = -aT;
                } else {
                    // direct bottom
                    collision.deltaVy = -player.vy;
                    collision.deltaY = aB;
                    collision.resetJump = true;
                }
            }
        }
    }
    return collision;
};

export { collidePointRectangle, collidePlayerObstacle };
