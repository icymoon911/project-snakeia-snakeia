// SnakeIA GameEngine test
import Grid from "../src/engine/Grid.js";
import Position from "../src/engine/Position.js";
import Constants from "../src/engine/Constants.js";
import Snake from "../src/engine/Snake.js";
import GameEngine from "../src/engine/GameEngine.js";
import SnakeAI from "../src/engine/ai/SnakeAI.js";
import GameUtils from "../src/engine/GameUtils.js";

test("snake stuck horizontally - auto detection", async () => {
  const theGrid = new Grid(5, 5, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.MOCK);
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();
  engine.paused = false;
  engine.started = true;

  for(let i = 0; i < theGrid.width * 2 * engine.aiStuckLimit + 1; i++) {
    engine.doTick();
  }

  expect(engine.gameOver).toBe(true);
  expect(theSnake.isAIStuck(engine.aiStuckLimit, engine.aiStuckLimit)).toBe(true);
});

test("snake stuck horizontally - auto detection - inverse action", async () => {
  class SnakeAICustom extends SnakeAI {
    ai(_snake) {
      return Constants.Key.LEFT;
    }
  }

  const theGrid = new Grid(5, 5, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.CUSTOM, false, "TheAI", new SnakeAICustom());
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();
  engine.paused = false;
  engine.started = true;

  for(let i = 0; i < theGrid.width * 2 * engine.aiStuckLimit + 1; i++) {
    engine.doTick();
  }

  expect(engine.gameOver).toBe(true);
  expect(theSnake.isAIStuck(engine.aiStuckLimit, engine.aiStuckLimit)).toBe(true);
});

test("snake stuck horizontally - auto detection - grid 5 x 50", async () => {
  const theGrid = new Grid(5, 50, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.MOCK);
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();
  engine.paused = false;
  engine.started = true;

  for(let i = 0; i < theGrid.height * 2 * engine.aiStuckLimit + 1; i++) {
    engine.doTick();
  }

  expect(engine.gameOver).toBe(true);
  expect(theSnake.isAIStuck(engine.aiStuckLimit, engine.aiStuckLimit)).toBe(true);
});

test("snake stuck vertically - auto detection", async () => {
  const theGrid = new Grid(5, 5, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.BOTTOM, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.MOCK);
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();
  engine.paused = false;
  engine.started = true;

  for(let i = 0; i < theGrid.height * 2 * engine.aiStuckLimit + 1; i++) {
    engine.doTick();
  }

  expect(engine.gameOver).toBe(true);
  expect(theSnake.isAIStuck(engine.aiStuckLimit, engine.aiStuckLimit)).toBe(true);
});

test("snake stuck vertically - auto detection - inverse action", async () => {
  class SnakeAICustom extends SnakeAI {
    ai(_snake) {
      return Constants.Key.UP;
    }
  }

  const theGrid = new Grid(5, 5, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.BOTTOM, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.CUSTOM, false, "TheAI", new SnakeAICustom());
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();
  engine.paused = false;
  engine.started = true;

  for(let i = 0; i < theGrid.height * 2 * engine.aiStuckLimit + 1; i++) {
    engine.doTick();
  }

  expect(engine.gameOver).toBe(true);
  expect(theSnake.isAIStuck(engine.aiStuckLimit, engine.aiStuckLimit)).toBe(true);
});

test("snake stuck vertically - auto detection - grid 5 x 50", async () => {
  const theGrid = new Grid(5, 50, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.BOTTOM, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.MOCK);
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();
  engine.paused = false;
  engine.started = true;

  for(let i = 0; i < theGrid.height * 2 * engine.aiStuckLimit + 1; i++) {
    engine.doTick();
  }

  expect(engine.gameOver).toBe(true);
  expect(theSnake.isAIStuck(engine.aiStuckLimit, engine.aiStuckLimit)).toBe(true);
});

test("snake stuck with repetitive action - auto detection", async () => {
  class SnakeAICustom extends SnakeAI {

    actionsStep = [Constants.Key.BOTTOM, Constants.Key.BOTTOM, Constants.Key.BOTTOM, Constants.Key.RIGHT, Constants.Key.UP, Constants.Key.UP, Constants.Key.UP, Constants.Key.LEFT];
    actionStepCounter = 0;

    ai(_snake) {
      const action = this.actionsStep[this.actionStepCounter];
      this.actionStepCounter = (this.actionStepCounter + 1) % this.actionsStep.length;
      return action;
    }
  }

  const theGrid = new Grid(10, 10, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.BOTTOM, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.CUSTOM, false, "TheAI", new SnakeAICustom());
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();
  engine.paused = false;
  engine.started = true;

  for(let i = 0; i < theGrid.height * 2 * engine.aiStuckLimit + 1; i++) {
    engine.doTick();
  }

  expect(engine.gameOver).toBe(true);
  expect(theSnake.isAIStuck(engine.aiStuckLimit, engine.aiStuckLimit)).toBe(true);
});

test("eating fruit should reset the stuck counter", async () => {
  class SnakeAICustom extends SnakeAI {

    actionsStep = [Constants.Key.BOTTOM, Constants.Key.BOTTOM, Constants.Key.BOTTOM, Constants.Key.RIGHT, Constants.Key.UP, Constants.Key.UP, Constants.Key.UP, Constants.Key.LEFT];
    actionStepCounter = 0;

    ai(_snake) {
      const action = this.actionsStep[this.actionStepCounter];
      this.actionStepCounter = (this.actionStepCounter + 1) % this.actionsStep.length;
      return action;
    }
  }

  const theGrid = new Grid(10, 10, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.BOTTOM, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.CUSTOM, false, "TheAI", new SnakeAICustom());

  function allPositionsOccupied() {
    const restrictedArea = Array.from({ length: 2 }, (_, dx) => 
      Array.from({ length: 4 }, (_, dy) => new Position(5 + dx, 4 + dy))
    ).flat();

    return restrictedArea.every(pos =>
      theSnake.queue.some(sq => sq.equals(pos)) || theGrid.fruitPositions.some(fruitPos => pos.equals(fruitPos))
    );
  }

  const mockRandom = jest.fn();
  mockRandom.mockReturnValueOnce(new Position(5, 2)).mockImplementation(() => {
    if(allPositionsOccupied()) {
      return new Position(GameUtils.randRange(0, theGrid.width - 1), GameUtils.randRange(0, theGrid.height - 1));
    }
    
    return new Position(GameUtils.randRange(5, 6), GameUtils.randRange(4, 7));
  });

  jest.spyOn(Grid.prototype, "getRandomPosition").mockImplementation(mockRandom);

  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();
  engine.paused = false;
  engine.started = true;

  while(!allPositionsOccupied() && !engine.gameOver) {
    engine.doTick();
  }

  expect(engine.gameOver).toBe(false);
  expect(theSnake.isAIStuck(engine.aiStuckLimit, engine.aiStuckLimit)).toBe(false);
  expect(theSnake.stuckCounter).toBe(0);
});

test("snake stuck horizontally - stuck detection disabled", async () => {
  const theGrid = new Grid(5, 5, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.MOCK);
  const engine = new GameEngine(theGrid, [theSnake], null, null, null, null, null, true);
  await engine.init();
  engine.paused = false;
  engine.started = true;

  for(let i = 0; i < theGrid.width * 2 * engine.aiStuckLimit + 1; i++) {
    engine.doTick();
  }

  expect(engine.gameOver).toBe(false);
  expect(theSnake.isAIStuck(engine.aiStuckLimit, engine.aiStuckLimit)).toBe(true);
});

test("fruit eaten should increase score", async () => {
    const theGrid = new Grid(10, 5, false, false, false, null, false);

    const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid);

    const mockRandom = jest.fn();
    mockRandom.mockReturnValueOnce(new Position(5, 2)).mockReturnValueOnce(new Position(8, 2)).mockReturnValue(new Position(1, 1));
    jest.spyOn(Grid.prototype, "getRandomPosition").mockImplementation(mockRandom);
    
    const engine = new GameEngine(theGrid, [theSnake]);
    await engine.init();
    engine.paused = false;
    engine.started = true;

    expect(theSnake.errorInit).toBe(false);
    expect(theSnake.score).toBe(0);
    expect(theSnake.getHeadPosition()).toEqual({ x: 7, y: 2, direction: Constants.Direction.RIGHT });
    
    engine.doTick();

    expect(theSnake.gameOver).toBe(false);
    expect(engine.gameOver).toBe(false);
    expect(theSnake.score).toBe(1);
});

test("gold fruit eaten should increase score by 3", async () => {
    const theGrid = new Grid(10, 5, false, false, false, null, false);

    const theSnake = new Snake(Constants.Direction.LEFT, 3, theGrid);
    
    const mockRandom = jest.fn();
    mockRandom.mockReturnValueOnce(new Position(4, 1)).mockReturnValueOnce(new Position(4, 3)).mockReturnValue(new Position(2, 2)).mockReturnValue(new Position(1, 1));
    jest.spyOn(Grid.prototype, "getRandomPosition").mockImplementation(mockRandom);

    // Trigger gold fruit
    jest.spyOn(GameUtils, "randRange").mockImplementation(() => 1);
    
    const engine = new GameEngine(theGrid, [theSnake]);
    await engine.init();
    engine.paused = false;
    engine.started = true;

    expect(theSnake.errorInit).toBe(false);
    expect(theSnake.score).toBe(0);
    expect(theSnake.getHeadPosition()).toEqual({ x: 2, y: 1, direction: Constants.Direction.LEFT });
    
    engine.doTick();

    expect(theSnake.gameOver).toBe(false);
    expect(engine.gameOver).toBe(false);
    expect(theSnake.score).toBe(3);
});

test("wall should end game", async () => {
    const theGrid = new Grid(10, 5, false, true, false, null, false);

    const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid);

    const mockRandom = jest.fn();
    mockRandom.mockReturnValueOnce(new Position(5, 1)).mockReturnValueOnce(new Position(5, 3)).mockReturnValue(new Position(2, 2)).mockReturnValue(new Position(1, 1));
    jest.spyOn(Grid.prototype, "getRandomPosition").mockImplementation(mockRandom);

    const engine = new GameEngine(theGrid, [theSnake]);
    await engine.init();
    engine.paused = false;
    engine.started = true;

    expect(theSnake.errorInit).toBe(false);
    expect(theSnake.score).toBe(0);
    expect(theSnake.getHeadPosition()).toEqual({ x: 7, y: 1, direction: Constants.Direction.RIGHT });

    for(let i = 0; i < 2; i++) {
      engine.doTick();
    }

    expect(theSnake.gameOver).toBe(true);
    expect(engine.gameOver).toBe(true);
    expect(theSnake.score).toBe(0);
});

test("Grid constructor: seedGame should be independent from seedGrid", () => {
  const grid = new Grid(10, 10, false, false, false, null, false, 42, 99);
  expect(grid.seedGrid).toBe("42");
  expect(grid.seedGame).toBe("99");
  expect(grid.seedGrid).not.toBe(grid.seedGame);
});

test("Grid constructor: seedGame should be undefined when not provided", () => {
  const grid = new Grid(10, 10, false, false, false, null, false, 42);
  expect(grid.seedGrid).toBe("42");
  expect(grid.seedGame).toBeUndefined();
});

test("Grid constructor: both seeds independent after reset", () => {
  const grid = new Grid(10, 10, false, false, false, null, false, 42, 99);
  grid.reset();
  // After reset, rngGrid and rngGame should produce different sequences
  const valGrid = grid.rngGrid();
  const valGame = grid.rngGame();
  expect(valGrid).not.toBe(valGame);
});

test("SnakeAINormal.updatePath should not stack overflow when all fruits unreachable", async () => {
  // Create a grid where the fruit is walled off from the snake
  const customGrid = [
    [0, 0, 0, 3, 0],
    [0, 0, 0, 3, 0],
    [0, 0, 0, 3, 0],
    [0, 0, 0, 3, 0],
    [0, 0, 0, 3, 0],
  ];
  const theGrid = new Grid(5, 5, false, false, false, customGrid, false, 1, 2);
  theGrid.reset();
  theGrid.init();

  // Place snake manually on the left side
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.DEFAULT);
  theSnake.queue = [
    new Position(2, 0, Constants.Direction.RIGHT),
    new Position(1, 0, Constants.Direction.RIGHT),
    new Position(0, 0, Constants.Direction.RIGHT),
  ];
  for(const pos of theSnake.queue) {
    theGrid.set(Constants.CaseType.SNAKE, pos);
  }

  await theSnake.initAI();

  // Place a fruit on the unreachable right side (behind the wall)
  const unreachableFruit = new Position(4, 2);
  theGrid.set(Constants.CaseType.FRUIT, unreachableFruit);
  theGrid.fruitPositions = [unreachableFruit];

  // Call ai() which calls updatePath - should NOT throw or stack overflow
  expect(() => theSnake.ai()).not.toThrow();
  // updatePath should return null path since fruit is unreachable
  expect(theSnake.snakeAI.path).toEqual([]);
});

test("handleStuckFruits should process all stuck fruits without skipping", () => {
  // Create a grid with corridor positions for fruits
  // Position (1,1) has walls on top, left, right → 3 dead neighbors → corridor
  // Position (3,3) has walls on top, left, right → 3 dead neighbors → corridor
  const customGrid = [
    [3, 3, 3, 3, 3],
    [3, 0, 3, 0, 3],
    [3, 3, 0, 3, 3],
    [3, 0, 0, 0, 3],
    [3, 3, 3, 3, 3],
  ];

  const theGrid = new Grid(5, 5, false, false, false, customGrid, false, 1, 2);
  theGrid.reset();
  theGrid.init();

  // Place a snake to satisfy engine requirements
  const snake1 = new Snake(Constants.Direction.RIGHT, 2, theGrid, Constants.PlayerType.AI, Constants.AiLevel.MOCK);
  snake1.queue = [
    new Position(2, 3, Constants.Direction.RIGHT),
    new Position(1, 3, Constants.Direction.RIGHT),
  ];
  for(const pos of snake1.queue) {
    theGrid.set(Constants.CaseType.SNAKE, pos);
  }

  // Place two fruits in corridor positions
  const fruit1 = new Position(1, 1);
  const fruit2 = new Position(3, 1);
  theGrid.set(Constants.CaseType.FRUIT, fruit1);
  theGrid.set(Constants.CaseType.FRUIT, fruit2);
  theGrid.fruitPositions = [fruit1, fruit2];

  // Verify both are corridors
  expect(theGrid.detectCorridor(fruit1)).toBe(true);
  expect(theGrid.detectCorridor(fruit2)).toBe(true);

  // Create engine without full init to avoid fruit placement loops
  const engine = new GameEngine(theGrid, [snake1]);
  engine.grid = theGrid;
  engine.snakes = [snake1];

  // handleStuckFruits should process BOTH fruits (iterate over copy)
  engine.handleStuckFruits();

  // Both original corridor fruits should have been removed
  const hasOldFruit1 = theGrid.fruitPositions.some(p => p.equals(fruit1));
  const hasOldFruit2 = theGrid.fruitPositions.some(p => p.equals(fruit2));

  expect(hasOldFruit1).toBe(false);
  expect(hasOldFruit2).toBe(false);
});

test("Snake.copy() should preserve grid structure including walls", async () => {
  const theGrid = new Grid(10, 10, true, true, false, null, false, 1, 2);
  theGrid.reset();
  theGrid.init();

  const mockRandom = jest.fn();
  mockRandom.mockReturnValueOnce(new Position(5, 5)).mockReturnValue(new Position(5, 5));
  jest.spyOn(Grid.prototype, "getRandomPosition").mockImplementation(mockRandom);

  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.DEFAULT);
  await theSnake.init();

  const copiedSnake = theSnake.copy();

  // Verify grid dimensions
  expect(copiedSnake.grid.width).toBe(theGrid.width);
  expect(copiedSnake.grid.height).toBe(theGrid.height);

  // Verify walls are preserved
  expect(copiedSnake.grid.generateWalls).toBe(theGrid.generateWalls);
  expect(copiedSnake.grid.borderWalls).toBe(theGrid.borderWalls);
  expect(copiedSnake.grid.maze).toBe(theGrid.maze);

  // Verify grid cells match exactly
  for(let i = 0; i < theGrid.height; i++) {
    for(let j = 0; j < theGrid.width; j++) {
      expect(copiedSnake.grid.get(new Position(j, i))).toBe(theGrid.get(new Position(j, i)));
    }
  }

  // Verify snake queue is copied
  expect(copiedSnake.queue.length).toBe(theSnake.queue.length);

  // Verify the copied snake grid is independent (modifying copy doesn't affect original)
  copiedSnake.grid.set(Constants.CaseType.EMPTY, theSnake.getHeadPosition());
  expect(theGrid.get(theSnake.getHeadPosition())).toBe(Constants.CaseType.SNAKE);
});

test("Snake.copy() should preserve maze grid structure", async () => {
  const theGrid = new Grid(11, 11, false, false, true, null, false, 1, 2);
  theGrid.reset();
  theGrid.init();

  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.DEFAULT);
  await theSnake.init();

  const copiedSnake = theSnake.copy();

  // Verify maze property is preserved
  expect(copiedSnake.grid.maze).toBe(true);

  // Verify all wall/empty cells match
  for(let i = 0; i < theGrid.height; i++) {
    for(let j = 0; j < theGrid.width; j++) {
      expect(copiedSnake.grid.get(new Position(j, i))).toBe(theGrid.get(new Position(j, i)));
    }
  }
});
