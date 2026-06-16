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

// Declarative mapping: socket event → controller event name, whether to sync
// the engine (client-side predictions), and optional side-effect hooks.
const SOCKET_EVENT_MAP = {
  init:           { controllerEvent: null,           syncEngine: true  },
  reset:          { controllerEvent: "onReset",      syncEngine: true  },
  start:          { controllerEvent: "onStart",      syncEngine: false },
  pause:          { controllerEvent: "onPause",      syncEngine: false },
  continue:       { controllerEvent: "onContinue",   syncEngine: false },
  stop:           { controllerEvent: "onStop",       syncEngine: true  },
  exit:           { controllerEvent: "onExit",       syncEngine: false, after: "exit"  },
  kill:           { controllerEvent: "onKill",       syncEngine: false, after: "kill"  },
  scoreIncreased: { controllerEvent: "onScoreIncreased", syncEngine: false },
  update:         { controllerEvent: "onUpdate",     syncEngine: true  },
  updateCounter:  { controllerEvent: "onUpdateCounter", syncEngine: false }
};

export default class GameControllerSocket extends GameController {
  constructor(socket, ui, enableClientSidePredictions) {
    super(new GameEngine(), ui);
    this.enableClientSidePredictions = enableClientSidePredictions || false;
    this.socket = socket;
    this.pingLatency = -1;
  }

  parseData(key, data, syncEngine) {
    if (data) {
      let grid = this.grid;

      if (Object.prototype.hasOwnProperty.call(data, "grid") && data["grid"] != null && data["grid"]["grid"] != null) {
        grid = Object.assign(new Grid(), data["grid"]);
        data["grid"] = grid;
      }

      if (Object.prototype.hasOwnProperty.call(data, "snakes") && data["snakes"] != null) {
        for (let i = 0; i < data["snakes"].length; i++) {
          data["snakes"][i].grid = grid;
          data["snakes"][i] = Object.assign(new Snake(), data["snakes"][i]);

          for (let j = 0; j < data["snakes"][i].queue.length; j++) {
            data["snakes"][i].queue[j] = Object.assign(new Position(), data["snakes"][i].queue[j]);
          }
        }
      }

      this.update(key, data, syncEngine);
    }
  }

  async init() {
    // Generic socket event handling – one listener per event, all following the
    // same pattern: parse data → optional side-effect → dispatch controller event.
    for (const [socketEvent, config] of Object.entries(SOCKET_EVENT_MAP)) {
      this.socket.on(socketEvent, data => {
        const shouldSync = config.syncEngine && this.enableClientSidePredictions;
        this.parseData(socketEvent, data, shouldSync);

        // Event-specific side effects
        if (socketEvent === "init") {
          if (this.enableClientSidePredictions && this.gameEngine) {
            if (data && data["currentPlayer"])
              this.gameEngine.currentPlayer = data["currentPlayer"];
            if (data && data["countBeforePlay"] < 0)
              this.gameEngine.forceStart();
          }
        }

        if (socketEvent === "update") {
          if (!this.gameEngine.clientSidePredictionsMode) {
            this.gameUI.offsetFrame = 0;
          }
        }

        if (socketEvent === "updateCounter") {
          if (data && data.countBeforePlay < 0) {
            if (this.enableClientSidePredictions) {
              this.gameEngine.forceStart();
            }
          }
        }

        // Execute engine action if configured (exit, kill)
        if (config.after === "exit") {
          this.gameEngine.exit();
        } else if (config.after === "kill") {
          this.gameEngine.kill();
        }

        // Dispatch on controller reactor
        if (config.controllerEvent) {
          this.reactor.dispatchEvent(config.controllerEvent);
        }
      });
    }

    this.socket.on("notification", (text, duration, textColor, backgroundColor, foreground) => {
      this.gameUI.setNotification(new NotificationMessage(text, textColor, backgroundColor, duration, null, null, null, foreground));
    });

    const connectionErrorHandler = () => {
      this.gameUI.setNotification(new NotificationMessage(i18next.t("engine.servers.errorConnection"), null, GameConstants.Setting.ERROR_NOTIF_COLOR, null, null, null, null, true));
    };

    this.socket.once("error", connectionErrorHandler);
    this.socket.once("connect_error", connectionErrorHandler);
    this.socket.once("connect_timeout", connectionErrorHandler);
    this.socket.once("reconnect_error", connectionErrorHandler);

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
