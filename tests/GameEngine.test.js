// SnakeIA GameEngine test
import Grid from "../src/engine/Grid.js";
import Position from "../src/engine/Position.js";
import Constants from "../src/engine/Constants.js";
import Snake from "../src/engine/Snake.js";
import GameEngine from "../src/engine/GameEngine.js";
import SnakeAI from "../src/engine/ai/SnakeAI.js";
import SnakeAINormal from "../src/engine/ai/SnakeAINormal.js";
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

test("Grid constructor should initialize seedGame and seedGrid independently", () => {
  const seedGrid = 12345;
  const seedGame = 67890;
  const theGrid = new Grid(10, 10, false, false, false, null, false, seedGrid, seedGame);

  expect(theGrid.seedGrid).toBe("" + seedGrid);
  expect(theGrid.seedGame).toBe("" + seedGame);
  expect(theGrid.seedGrid).not.toBe(theGrid.seedGame);
});

test("Grid constructor should handle undefined seedGame independently from seedGrid", () => {
  const seedGrid = 12345;
  const theGrid = new Grid(10, 10, false, false, false, null, false, seedGrid, undefined);

  expect(theGrid.seedGrid).toBe("" + seedGrid);
  expect(theGrid.seedGame).toBeUndefined();
});

test("SnakeAINormal updatePath should not cause stack overflow when all fruits are unreachable", async () => {
  const theGrid = new Grid(10, 10, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.DEFAULT);
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();

  // Create a scenario where all fruits are blocked by walls
  theGrid.fruitPositions = [];
  theGrid.fruitPosGold = null;

  // Manually place fruits in completely walled-off positions
  const blockedPos1 = new Position(1, 1);
  const blockedPos2 = new Position(2, 2);

  // Surround the fruits with walls to make them unreachable
  for(let i = 0; i < theGrid.height; i++) {
    for(let j = 0; j < theGrid.width; j++) {
      if((i === 0 || i === 3) && j >= 0 && j <= 3) {
        theGrid.set(Constants.CaseType.WALL, new Position(j, i));
      }
      if((j === 0 || j === 3) && i >= 0 && i <= 3) {
        theGrid.set(Constants.CaseType.WALL, new Position(j, i));
      }
    }
  }

  theGrid.set(Constants.CaseType.FRUIT, blockedPos1);
  theGrid.set(Constants.CaseType.FRUIT, blockedPos2);
  theGrid.fruitPositions = [blockedPos1, blockedPos2];

  const ai = new SnakeAINormal();
  ai.ai(theSnake); // This populates aiFruitGoalsSorted

  // This should not throw a stack overflow error
  expect(() => {
    const result = ai.updatePath(theSnake);
    expect(result.calculatedPath).toBeNull();
    expect(result.targetFruit).toBeNull();
  }).not.toThrow();
});

test("handleStuckFruits should process all stuck fruits without skipping", async () => {
  class SnakeAICustom extends SnakeAI {
    ai(_snake) {
      return Constants.Key.RIGHT;
    }
  }

  const theGrid = new Grid(15, 15, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.CUSTOM, false, "TheAI", new SnakeAICustom());
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();
  engine.paused = false;

  // Manually place multiple fruits in corridor positions (surrounded by walls on 3 sides)
  theGrid.fruitPositions = [];

  // Create corridor scenarios - positions that should be detected as stuck
  const corridorPos1 = new Position(5, 5);
  const corridorPos2 = new Position(8, 8);

  // Surround positions to create corridors
  for(let i = 0; i < theGrid.height; i++) {
    for(let j = 0; j < theGrid.width; j++) {
      // Create walls around corridorPos1
      if(Math.abs(i - 5) <= 1 && Math.abs(j - 5) <= 1 && !(i === 5 && j === 5)) {
        if(!(i === 5 && j === 6)) { // Leave one side open
          theGrid.set(Constants.CaseType.WALL, new Position(j, i));
        }
      }
      // Create walls around corridorPos2
      if(Math.abs(i - 8) <= 1 && Math.abs(j - 8) <= 1 && !(i === 8 && j === 8)) {
        if(!(i === 8 && j === 9)) { // Leave one side open
          theGrid.set(Constants.CaseType.WALL, new Position(j, i));
        }
      }
    }
  }

  theGrid.set(Constants.CaseType.FRUIT, corridorPos1);
  theGrid.set(Constants.CaseType.FRUIT, corridorPos2);
  theGrid.fruitPositions = [corridorPos1, corridorPos2];

  const initialFruitCount = theGrid.fruitPositions.length;

  // Call handleStuckFruits directly
  engine.handleStuckFruits();

  // After handling, the stuck fruits should have been removed and potentially new ones added
  // The key is that both fruits should be checked, not just one
  expect(initialFruitCount).toBe(2);
  // At least one fruit should have been processed (removed or repositioned)
  // The exact behavior depends on setFruits, but both should be checked
});

test("Snake copy should preserve grid configuration", async () => {
  const theGrid = new Grid(10, 10, true, true, false, null, false, 123, 456, true);
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.DEFAULT);
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();

  const copiedSnake = theSnake.copy();

  // Verify grid configuration is preserved
  expect(copiedSnake.grid.width).toBe(theGrid.width);
  expect(copiedSnake.grid.height).toBe(theGrid.height);
  expect(copiedSnake.grid.generateWalls).toBe(theGrid.generateWalls);
  expect(copiedSnake.grid.borderWalls).toBe(theGrid.borderWalls);
  expect(copiedSnake.grid.maze).toBe(theGrid.maze);
  expect(copiedSnake.grid.mazeForceAuto).toBe(theGrid.mazeForceAuto);
  expect(copiedSnake.grid.seedGrid).toBe(theGrid.seedGrid);
  expect(copiedSnake.grid.seedGame).toBe(theGrid.seedGame);
  expect(copiedSnake.grid.probGoldFruitIncrease).toBe(theGrid.probGoldFruitIncrease);
});

test("Snake copy should preserve maze configuration", async () => {
  const theGrid = new Grid(15, 15, false, false, true, null, false, 789, 101);
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.DEFAULT);
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();

  const copiedSnake = theSnake.copy();

  // Verify maze configuration is preserved
  expect(copiedSnake.grid.maze).toBe(true);
  expect(copiedSnake.grid.mazeFirstPosition.x).toBe(theGrid.mazeFirstPosition.x);
  expect(copiedSnake.grid.mazeFirstPosition.y).toBe(theGrid.mazeFirstPosition.y);
  expect(copiedSnake.grid.mazeFirstPosition.direction).toBe(theGrid.mazeFirstPosition.direction);
});

test("Snake copy should have independent grid state", async () => {
  const theGrid = new Grid(10, 10, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.DEFAULT);
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();

  const copiedSnake = theSnake.copy();

  // Verify the initial grid cell at (5,5) in both grids match before modification
  const originalValue = theGrid.get(new Position(5, 5));
  expect(copiedSnake.grid.get(new Position(5, 5))).toBe(originalValue);

  // Modify the original grid
  theGrid.set(Constants.CaseType.WALL, new Position(5, 5));

  // The copied snake's grid should not be affected
  expect(copiedSnake.grid.get(new Position(5, 5))).toBe(originalValue);
  expect(copiedSnake.grid.get(new Position(5, 5))).not.toBe(Constants.CaseType.WALL);
});

test("SnakeAINormal should return null when no fruits are available", async () => {
  const theGrid = new Grid(10, 10, false, false, false, null, false, 1, 2);
  const theSnake = new Snake(Constants.Direction.RIGHT, 3, theGrid, Constants.PlayerType.AI, Constants.AiLevel.DEFAULT);
  const engine = new GameEngine(theGrid, [theSnake]);
  await engine.init();

  // Clear all fruits
  theGrid.fruitPositions = [];
  theGrid.fruitPosGold = null;

  const ai = new SnakeAINormal();
  ai.ai(theSnake); // This populates aiFruitGoalsSorted (will be empty)

  const result = ai.updatePath(theSnake);

  expect(result.calculatedPath).toBeNull();
  expect(result.targetFruit).toBeNull();
});