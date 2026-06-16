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
import GameUtils from "./GameUtils.js";
import Reactor from "./Reactor.js";

// All events the engine can emit that the controller must forward to downstream listeners
const ENGINE_EVENT_NAMES = [
  "onStart", "onPause", "onContinue", "onReset", "onStop",
  "onExit", "onKill", "onScoreIncreased", "onUpdate", "onUpdateCounter"
];

// Engine fields that should be exposed directly on the controller (via getters/setters)
const ENGINE_PROXY_FIELDS = [
  "grid", "snakes", "paused", "isReseted", "exited", "gameOver",
  "starting", "scoreMax", "gameFinished", "errorOccurred",
  "clientSidePredictionsMode"
];

// Common UI-only fields that are reset on every game event (menus closing, etc.)
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

    // Controller's own state (NOT proxied to engine)
    this.lastKey = -1;
    this.currentPlayer = null;
    this.onlineMode = false;

    // Proxy engine state fields through getters/setters so the controller never holds
    // its own copy — reading always goes to the engine, writing always goes to the engine.
    for(let i = 0; i < ENGINE_PROXY_FIELDS.length; i++) {
      const field = ENGINE_PROXY_FIELDS[i];

      Object.defineProperty(this, field, {
        get() {
          return this.gameEngine[field];
        },
        set(value) {
          this.gameEngine[field] = value;
        },
        enumerable: true,
        configurable: true
      });
    }

    // Events
    this.reactor = new Reactor();

    for(let i = 0; i < ENGINE_EVENT_NAMES.length; i++) {
      this.reactor.registerEvent(ENGINE_EVENT_NAMES[i]);
    }

    this.onReset(() => {
      if(this.gameUI) {
        this.gameUI.resetState();
      }
    });
  }

  async init() {
    const engine = this.gameEngine;

    this.update("init", GameUtils.buildStateSnapshot(engine, {
      enablePause: engine.enablePause,
      enableRetry: engine.enableRetry,
      progressiveSpeed: engine.progressiveSpeed,
      offsetFrame: engine.speed * GameConstants.Setting.TIME_MULTIPLIER
    }));

    this._setupEventForwarding();

    if(!engine.isInit) {
      await engine.init();
      this.update("init", { "engineLoading": false });
      await this.gameUI.startAfterEngineInit();
    }
  }

  _setupEventForwarding() {
    const engine = this.gameEngine;
    const TIME_MULT = GameConstants.Setting.TIME_MULTIPLIER;

    // Define what extra fields to include in the UI sync for each event.
    // Returning null means "skip the update() call entirely" (just dispatch the event).
    const eventExtras = {
      onReset: () => ({
        ...UI_RESET_FIELDS,
        offsetFrame: engine.speed * TIME_MULT,
        precAiStuck: false
      }),
      onStart: () => ({ ...UI_RESET_FIELDS }),
      onPause: () => ({ ...UI_RESET_FIELDS }),
      onContinue: () => ({ ...UI_RESET_FIELDS }),
      onStop: () => ({ ...UI_RESET_FIELDS }),
      onExit: () => ({ ...UI_RESET_FIELDS }),
      onKill: () => ({ ...UI_RESET_FIELDS }),
      onScoreIncreased: null,
      onUpdate: () => ({ offsetFrame: 0 }),
      onUpdateCounter: () => ({})
    };

    for(let i = 0; i < ENGINE_EVENT_NAMES.length; i++) {
      const eventName = ENGINE_EVENT_NAMES[i];
      // "onStart" -> "start", "onScoreIncreased" -> "scoreIncreased"
      const messageName = eventName.charAt(2).toLowerCase() + eventName.slice(3);
      const extrasFn = eventExtras[eventName];

      engine.reactor.addEventListener(eventName, () => {
        if(extrasFn) {
          this.update(messageName, GameUtils.buildStateSnapshot(engine, extrasFn()));
        }

        this.reactor.dispatchEvent(eventName);
      });
    }
  }

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

  key(key) {
    this.gameEngine.lastKey = key;
    this.lastKey = key;

    const playerSnake = this.snakes[this.getCurrentPlayer()];

    if(playerSnake != null && playerSnake.lastKey != null) {
      playerSnake.lastKey = key;
    }
  }

  getCurrentPlayer() {
    if(this.snakes != null) {
      const nbPlayers = GameUtils.getNBPlayer(this.snakes, GameConstants.PlayerType.HUMAN);
      const nbPlayersHybrid = GameUtils.getNBPlayer(this.snakes, GameConstants.PlayerType.HYBRID_HUMAN_AI);

      for(let i = 0; i < this.snakes.length; i++) {
        if((this.currentPlayer == null && nbPlayers <= 1 && nbPlayersHybrid <= 1 && (this.snakes[i] && (this.snakes[i].player == GameConstants.PlayerType.HUMAN || this.snakes[i].player == GameConstants.PlayerType.HYBRID_HUMAN_AI)) || this.currentPlayer == (i + 1))) {
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

  update(message, data, updateEngine) {
    if(this.gameUI != null && data != null) {
      const dataKeys = Object.keys(data);

      for(let i = 0; i < dataKeys.length; i++) {
        if((!this.clientSidePredictionsMode && !this.onlineMode) || (this.clientSidePredictionsMode && (dataKeys[i] == "snakes" || dataKeys[i] == "grid" || dataKeys[i] == "offsetFrame" || dataKeys[i] == "gameOver") && this.onlineMode) || (!this.clientSidePredictionsMode && this.onlineMode)) {
          if(Object.prototype.hasOwnProperty.call(this.gameUI, dataKeys[i]) && typeof(data[dataKeys[i]]) !== "function" && typeof(this.gameUI[dataKeys[i]]) !== "function") {
            this.gameUI[dataKeys[i]] = data[dataKeys[i]];
          }

          if(updateEngine) {
            if(data.snakes && data.snakes[this.getCurrentPlayer()]) {
              data.snakes[this.getCurrentPlayer()].lastKey = this.lastKey;
              this.lastKey = -1;
            }

            if(data.grid) {
              data.grid.rngGame = null;
              data.grid.rngGrid = null;
            }

            this.updateEngine(dataKeys[i], data[dataKeys[i]]);
          }

          if(Object.prototype.hasOwnProperty.call(this, dataKeys[i]) && typeof(data[dataKeys[i]]) !== "function" && typeof(this[dataKeys[i]]) !== "function") {
            this[dataKeys[i]] = data[dataKeys[i]];
          }
        }
      }

      if(Object.prototype.hasOwnProperty.call(data, "killed") && data.killed && this.gameUI && this.gameUI.setKill) {
        this.gameUI.setKill();
      }
    }
  }

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
}
