const GRID_SIZE = 10;

export const Layout = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,

  GRID_SIZE,
  PLAYER_W: 2 * GRID_SIZE,
  PLAYER_H: 2 * GRID_SIZE
};

const pixPerMet = 5;
const framesPerSec = 60;
const gravitationalPull = (9.81 * pixPerMet) / (framesPerSec ^ 2);

export const Game = {
  NUM_LIVES: 3,

  playerMaxSpeedHorizontal: 7,
  playerMaxSpeedVertical: 10,
  playerAccHorizontalGround: 1.5,
  playerAccHorizontalAirForced: 0.5,
  playerAccHorizontalAirFree: 0.1,
  playerAccVertical: 5 * gravitationalPull,
  maxJumpDuration: 10
};

export const Objects = {
  NONE: 0,
  PLAYER: 1,
  GOAL: 2,
  OBSTACLE: 3
};

export const GameStates = {
  SPLASH: 0,
  GAME: 1,
  EDITOR: 2,
  GAME_OVER: 3,
  GAME_COMPLETE: 4
};
