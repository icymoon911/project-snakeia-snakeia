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
import i18next from "i18next";
import GameController from "./GameController.js";
import Grid from "./Grid.js";
import Snake from "./Snake.js";
import Position from "./Position.js";
import GameConstants from "./Constants.js";
import { NotificationMessage } from "jsgametools";
import GameEngine from "./GameEngine.js";

// Maps socket event names to reactor event names — same convention as GameController._setupEventForwarding
const SOCKET_EVENT_MAP = {
  init: null, // handled specially
  reset: "onReset",
  start: "onStart",
  pause: "onPause",
  continue: "onContinue",
  stop: "onStop",
  exit: "onExit",
  kill: "onKill",
  scoreIncreased: "onScoreIncreased",
  update: "onUpdate",
  updateCounter: "onUpdateCounter"
};

export default class GameControllerSocket extends GameController {
  constructor(socket, ui, enableClientSidePredictions) {
    super(new GameEngine(), ui);
    this.enableClientSidePredictions = enableClientSidePredictions || false;
    this.socket = socket;
    this.pingLatency = -1;
  }

  parseData(key, data, updateEngine) {
    if(data) {
      let grid = this.grid;

      if(Object.prototype.hasOwnProperty.call(data, "grid") && data["grid"] != null && data["grid"]["grid"] != null) {
        grid = Object.assign(new Grid(), data["grid"]);
        data["grid"] = grid;
      }

      if(Object.prototype.hasOwnProperty.call(data, "snakes") && data["snakes"] != null) {
        for(let i = 0; i < data["snakes"].length; i++) {
          data["snakes"][i].grid = grid;
          data["snakes"][i] = Object.assign(new Snake(), data["snakes"][i]);

          for(let j = 0; j < data["snakes"][i].queue.length; j++) {
            data["snakes"][i].queue[j] = Object.assign(new Position(), data["snakes"][i].queue[j]);
          }
        }
      }

      this.update(key, data, updateEngine);
    }
  }

  _dispatchForSocketEvent(socketEventName) {
    const reactorEvent = SOCKET_EVENT_MAP[socketEventName];

    if(reactorEvent) {
      this.reactor.dispatchEvent(reactorEvent);
    }
  }

  async init() {
    // Each socket event follows the same path: parse data → update() (writes to engine via
    // setters + writes to UI) → dispatch reactor event. This mirrors GameController's
    // _setupEventForwarding, just with socket as the data source instead of local engine.
    this.socket.on("init", data => {
      this.parseData("init", data, this.enableClientSidePredictions);

      if(this.enableClientSidePredictions && this.gameEngine) {
        if(data && data["currentPlayer"])
          this.gameEngine.currentPlayer = data["currentPlayer"];
        if(data && data["countBeforePlay"] < 0)
          this.gameEngine.forceStart();
      }
    });

    this.socket.on("reset", data => {
      this.parseData("reset", data, this.enableClientSidePredictions);
      this._dispatchForSocketEvent("reset");
    });

    this.socket.on("start", data => {
      this.parseData("start", data);
      this._dispatchForSocketEvent("start");
    });

    this.socket.on("pause", data => {
      this.parseData("pause", data);
      this._dispatchForSocketEvent("pause");
    });

    this.socket.on("continue", data => {
      this.parseData("continue", data);
      this._dispatchForSocketEvent("continue");
    });

    this.socket.on("stop", data => {
      this.parseData("stop", data, this.enableClientSidePredictions);
      this._dispatchForSocketEvent("stop");
    });

    this.socket.on("exit", data => {
      this.parseData("exit", data);
      this.gameEngine.exit();
      this._dispatchForSocketEvent("exit");
    });

    this.socket.on("kill", data => {
      this.parseData("kill", data);
      this.gameEngine.kill();
      this._dispatchForSocketEvent("kill");
    });

    this.socket.on("scoreIncreased", data => {
      this.parseData("scoreIncreased", data);
      this._dispatchForSocketEvent("scoreIncreased");
    });

    this.socket.on("update", data => {
      this.parseData("update", data, this.enableClientSidePredictions);

      if(!this.gameEngine.clientSidePredictionsMode) {
        this.gameUI.offsetFrame = 0;
      }

      this._dispatchForSocketEvent("update");
    });

    this.socket.on("updateCounter", data => {
      this.parseData("updateCounter", data);

      if(data && data.countBeforePlay < 0) {
        if(this.enableClientSidePredictions) {
          this.gameEngine.forceStart();
        }
      }

      this._dispatchForSocketEvent("updateCounter");
    });

    this.socket.on("notification", (text, duration, textColor, backgroundColor, foreground) => {
      this.gameUI.setNotification(new NotificationMessage(text, textColor, backgroundColor, duration, null, null, null, foreground));
    });

    this.socket.once("error", () => {
      this.gameUI.setNotification(new NotificationMessage(i18next.t("engine.servers.errorConnection"), null, GameConstants.Setting.ERROR_NOTIF_COLOR, null, null, null, null, true));
    });

    this.socket.once("connect_error", () => {
      this.gameUI.setNotification(new NotificationMessage(i18next.t("engine.servers.errorConnection"), null, GameConstants.Setting.ERROR_NOTIF_COLOR, null, null, null, null, true));
    });

    this.socket.once("connect_timeout", () => {
      this.gameUI.setNotification(new NotificationMessage(i18next.t("engine.servers.errorConnection"), null, GameConstants.Setting.ERROR_NOTIF_COLOR, null, null, null, null, true));
    });

    this.socket.once("reconnect_error", () => {
      this.gameUI.setNotification(new NotificationMessage(i18next.t("engine.servers.errorConnection"), null, GameConstants.Setting.ERROR_NOTIF_COLOR, null, null, null, null, true));
    });

    await this.gameUI.startAfterEngineInit();
  }

  reset() {
    this.socket.emit("reset");
  }

  start() {
    this.socket.emit("start");
  }

  stop() {
    this.socket.emit("stop");
  }

  finish(finish) {
    this.socket.emit(finish ? "finish" : "stop");
  }

  pause() {
    this.socket.emit("pause");
  }

  kill() {
    this.socket.emit("kill");
  }

  tick() {
    this.socket.emit("tick");
  }

  exit() {
    this.socket.emit("exit");
  }

  key(key) {
    this.socket.emit("key", key);
    super.key(key);
    this.lastKey = this.gameEngine.lastKey;
  }

  forceStart() {
    this.socket.emit("forceStart");
  }
}
