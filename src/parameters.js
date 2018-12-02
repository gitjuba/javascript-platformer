
const GRID_SIZE = 10;

export const Layout = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,

  GRID_SIZE,
  PLAYER_W: 2 * GRID_SIZE,
  PLAYER_H: 2 * GRID_SIZE
};

export const Game = {
  NUM_LIVES: 3
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
