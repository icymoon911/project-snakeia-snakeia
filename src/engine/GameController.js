/*
 * Copyright (C) 2019-2020 Eliastik (eliastiksofts.com)
 *
 * This file is part of "SnakeIA".
 *
 * "SnakeIA" is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * "SnakeIA" is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with "SnakeIA".  If not, see <http://www.gnu.org/licenses/>.
 */
import GameConstants from "./Constants.js";
import Reactor from "./Reactor.js";
import GameUtils from "./GameUtils.js";
import { ENGINE_EVENT_NAMES } from "./GameEngine.js";

// Engine state fields proxied via getters/setters – controller never stores
// its own copy; the engine is the single source of truth.
const ENGINE_STATE_FIELDS = [
  "grid", "snakes", "paused", "isReseted", "exited", "gameOver",
  "gameFinished", "gameMazeWin", "scoreMax", "starting", "killed",
  "errorOccurred", "engineLoading", "numFruit", "ticks",
  "initialSpeed", "speed", "countBeforePlay", "aiStuck",
  "enablePause", "enableRetry", "progressiveSpeed"
];

// Map from engine event name to the update() message key.
// null means no state sync is needed for that event.
const EVENT_TO_MESSAGE = {
  onStart: "start",
  onPause: "pause",
  onContinue: "continue",
  onReset: "reset",
  onStop: "stop",
  onExit: "exit",
  onKill: "kill",
  onScoreIncreased: null,
  onUpdate: "update",
  onUpdateCounter: "updateCounter"
};

// UI menu-state fields that are reset to false on every engine event.
const UI_RESET_FIELDS = {
  confirmReset: false,
  confirmExit: false,
  getInfos: false,
  getInfosGame: false,
  getInfosControls: false,
  getInfosGoal: false
};

export default class GameController {
  constructor(engine, ui) {
    this.gameUI = ui;
    this.gameEngine = engine;

    // Proxy every engine state field so the controller never stores its own
    // copy – reads and writes go straight to the engine.
    for (const field of ENGINE_STATE_FIELDS) {
      Object.defineProperty(this, field, {
        get() { return this.gameEngine[field]; },
        set(value) { this.gameEngine[field] = value; },
        enumerable: true,
        configurable: true
      });
    }

    // Controller-specific state (not mirrored on the engine)
    this.lastKey = -1;
    this.currentPlayer = null;
    this.clientSidePredictionsMode = false;
    this.onlineMode = false;

    // Events – same set of names as the engine reactor.
    this.reactor = new Reactor();
    this.reactor.registerEvents(ENGINE_EVENT_NAMES);

    this.onReset(() => {
      if (this.gameUI) {
        this.gameUI.resetState();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Engine event forwarding
  // ---------------------------------------------------------------------------

  /**
   * Build a full state snapshot from the engine, merged with UI reset fields
   * and any event-specific overrides.
   */
  buildStateSnapshot(extras) {
    const engine = this.gameEngine;
    return {
      snakes: engine.snakes,
      grid: engine.grid,
      paused: engine.paused,
      isReseted: engine.isReseted,
      exited: engine.exited,
      gameOver: engine.gameOver,
      gameFinished: engine.gameFinished,
      gameMazeWin: engine.gameMazeWin,
      scoreMax: engine.scoreMax,
      starting: engine.starting,
      killed: engine.killed,
      errorOccurred: engine.errorOccurred,
      engineLoading: engine.engineLoading,
      numFruit: engine.numFruit,
      ticks: engine.ticks,
      initialSpeed: engine.initialSpeed,
      speed: engine.speed,
      countBeforePlay: engine.countBeforePlay,
      aiStuck: engine.aiStuck,
      enablePause: engine.enablePause,
      enableRetry: engine.enableRetry,
      progressiveSpeed: engine.progressiveSpeed,
      offsetFrame: engine.speed * GameConstants.Setting.TIME_MULTIPLIER,
      precAiStuck: false,
      ...UI_RESET_FIELDS,
      ...extras
    };
  }

  /**
   * Register forwarding listeners on the engine reactor so that every engine
   * event is automatically synced to the UI and re-dispatched on the
   * controller reactor.  Replaces ~150 lines of copy-paste callbacks.
   */
  setupEventForwarding() {
    for (const eventName of ENGINE_EVENT_NAMES) {
      const message = EVENT_TO_MESSAGE[eventName];

      this.gameEngine.reactor.addEventListener(eventName, () => {
        if (message != null) {
          // Event-specific extras
          let extras;
          if (eventName === "onUpdate") {
            extras = { offsetFrame: 0 };
          }
          this.update(message, this.buildStateSnapshot(extras));
        }

        this.reactor.dispatchEvent(eventName);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async init() {
    // Initial state sync
    this.update("init", this.buildStateSnapshot());

    // Wire up automatic event forwarding
    this.setupEventForwarding();

    if (!this.gameEngine.isInit) {
      await this.gameEngine.init();
      this.update("init", { engineLoading: false });
      await this.gameUI.startAfterEngineInit();
    }
  }

  // ---------------------------------------------------------------------------
  // Delegated actions
  // ---------------------------------------------------------------------------

  reset() {
    this.gameEngine.reset();
  }

  async start() {
    this.gameEngine.start();
  }

  stop() {
    this.gameEngine.stop();
  }

  finish(finish) {
    this.gameEngine.stop(finish);
  }

  pause() {
    this.gameEngine.pause();
  }

  kill() {
    this.gameEngine.kill();
  }

  tick() {
    this.gameEngine.paused = false;
    this.gameEngine.countBeforePlay = -1;
    this.gameEngine.tick();
  }

  exit() {
    this.gameEngine.exit();
  }

  forceStart() {
    this.gameEngine.forceStart();
  }

  updateEngine(key, data) {
    this.gameEngine[key] = data;
  }

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------

  setDisplayFPS(display) {
    this.gameUI.setDisplayFPS(display);
  }

  setDebugMode(display) {
    this.gameUI.setDebugMode(display);
  }

  setNotification(notification) {
    this.gameUI.setNotification(notification);
  }

  setGoal(goal) {
    this.gameUI.setGoal(goal);
  }

  closeRanking() {
    this.gameUI.gameRanking && this.gameUI.gameRanking.forceClose();
  }

  setTimeToDisplay(time) {
    this.gameUI.setTimeToDisplay(time);
  }

  setBestScore(score) {
    this.gameUI.setBestScore(score);
  }

  destroySnakes(exceptionIds, types) {
    this.gameEngine.destroySnakes(exceptionIds, types);
  }

  // ---------------------------------------------------------------------------
  // Player queries – delegate to GameUtils
  // ---------------------------------------------------------------------------

  key(key) {
    this.gameEngine.lastKey = key;
    this.lastKey = key;

    const playerSnake = this.snakes[this.getCurrentPlayer()];

    if (playerSnake != null && playerSnake.lastKey != null) {
      playerSnake.lastKey = key;
    }
  }

  getCurrentPlayer() {
    if (this.snakes != null) {
      const nbPlayers = this.getNBPlayer(GameConstants.PlayerType.HUMAN);
      const nbPlayersHybrid = this.getNBPlayer(GameConstants.PlayerType.HYBRID_HUMAN_AI);

      for (let i = 0; i < this.snakes.length; i++) {
        if ((this.currentPlayer == null && nbPlayers <= 1 && nbPlayersHybrid <= 1 && (this.snakes[i] && (this.snakes[i].player == GameConstants.PlayerType.HUMAN || this.snakes[i].player == GameConstants.PlayerType.HYBRID_HUMAN_AI)) || this.currentPlayer == (i + 1))) {
          return i;
        }
      }
    }

    return -1;
  }

  getNBPlayer(type) {
    return GameUtils.getNBPlayer(this.snakes, type);
  }

  getPlayer(num, type) {
    return GameUtils.getPlayer(this.snakes, num, type);
  }

  // ---------------------------------------------------------------------------
  // State sync to UI
  // ---------------------------------------------------------------------------

  /**
   * Push state data to the game UI and optionally synchronise the engine.
   *
   * Because the controller's engine-state fields are now getter/setter proxies
   * to the engine, writing to `this[key]` automatically writes through to the
   * engine – no separate `updateEngine` pass is needed for the simple case.
   *
   * @param {string} message  - Event label (used for logging/debugging).
   * @param {object} data     - Key/value pairs to push.
   * @param {boolean} syncEngine - When true, apply server-origin data
   *   corrections (lastKey injection, rng nullification).
   */
  update(message, data, syncEngine) {
    if (this.gameUI != null && data != null) {
      const dataKeys = Object.keys(data);

      for (let i = 0; i < dataKeys.length; i++) {
        const key = dataKeys[i];
        const value = data[key];

        if ((!this.clientSidePredictionsMode && !this.onlineMode) ||
            (this.clientSidePredictionsMode && (key == "snakes" || key == "grid" || key == "offsetFrame" || key == "gameOver") && this.onlineMode) ||
            (!this.clientSidePredictionsMode && this.onlineMode)) {

          // Server-origin corrections (lastKey injection, rng cleanup)
          if (syncEngine) {
            if (data.snakes && data.snakes[this.getCurrentPlayer()]) {
              data.snakes[this.getCurrentPlayer()].lastKey = this.lastKey;
              this.lastKey = -1;
            }

            if (data.grid) {
              data.grid.rngGame = null;
              data.grid.rngGrid = null;
            }
          }

          // Write to UI
          if (Object.prototype.hasOwnProperty.call(this.gameUI, key) && typeof value !== "function" && typeof this.gameUI[key] !== "function") {
            this.gameUI[key] = value;
          }

          // Write to controller (setter proxies to engine for engine-state fields)
          if (Object.prototype.hasOwnProperty.call(this, key) && typeof value !== "function" && typeof this[key] !== "function") {
            this[key] = value;
          }
        }
      }

      if (Object.prototype.hasOwnProperty.call(data, "killed") && data.killed && this.gameUI && this.gameUI.setKill) {
        this.gameUI.setKill();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Controller reactor – convenience listener registration
  // ---------------------------------------------------------------------------

  onReset(callback) {
    this.reactor.addEventListener("onReset", callback);
  }

  onStart(callback) {
    this.reactor.addEventListener("onStart", callback);
  }

  onContinue(callback) {
    this.reactor.addEventListener("onContinue", callback);
  }

  onStop(callback) {
    this.reactor.addEventListener("onStop", callback);
  }

  onPause(callback) {
    this.reactor.addEventListener("onPause", callback);
  }

  onExit(callback) {
    this.reactor.addEventListener("onExit", callback);
  }

  onKill(callback) {
    this.reactor.addEventListener("onKill", callback);
  }

  onScoreIncreased(callback) {
    this.reactor.addEventListener("onScoreIncreased", callback);
  }

  onUpdate(callback) {
    this.reactor.addEventListener("onUpdate", callback);
  }

  onUpdateCounter(callback) {
    this.reactor.addEventListener("onUpdateCounter", callback);
  }
}
