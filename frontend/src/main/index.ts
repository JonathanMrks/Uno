import { app, BrowserWindow, ipcMain, shell } from "electron";
import { join } from "path";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import axios from "axios";
import WebSocket from "ws";

let ws;
const API_URL =
  is.dev && process.env.ELECTRON_RENDERER_URL
    ? "localhost:3000"
    : "unodunite.onrender.com";
const httpOrHttps =
  is.dev && process.env.ELECTRON_RENDERER_URL ? "http://" : "https://";
const wsOrWss =
  is.dev && process.env.ELECTRON_RENDERER_URL ? "ws://" : "wss://";

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    width: 1920,
    height: 1080,
    minWidth: 1260,
    minHeight: 900,
    center: true,
    title: "JUno",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      nodeIntegration: true,
      contextIsolation: true,
      devTools: is.dev,
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      input.key === "F5" ||
      ((input.key === "r" || input.key === "R") && input.control)
    ) {
      event.preventDefault();
    }
  });

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  ipcMain.handle("auth:login", async (_event, { username, password }) => {
    const response = await axios.post(
      `${httpOrHttps}${API_URL}/api/auth/login`,
      {
        username,
        password,
      },
    );
    return response.data;
  });

  ipcMain.handle("auth:info", async (_event, { token }) => {
    const response = await axios.get(`${httpOrHttps}${API_URL}/api/auth/info`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  });

  ipcMain.handle(
    "user:register",
    async (_event, { username, email, password }) => {
      try {
        const response = await axios.post(
          `${httpOrHttps}${API_URL}/api/users`,
          {
            username,
            email,
            password,
          },
        );
        return response.data;
      } catch (err) {
        return err.response.data;
      }
    },
  );

  ipcMain.handle("game:host", async (_event, { token }) => {
    const response = await axios.post(
      `${httpOrHttps}${API_URL}/api/games`,
      {
        title: "UNO game",
        rules: "Default Rules",
        maxPlayers: 4,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  });

  ipcMain.handle("game:get", async (_event, { token, gameId }) => {
    const response = await axios.get(
      `${httpOrHttps}${API_URL}/api/games/${gameId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  });

  ipcMain.handle("game:join", async (_event, { token, gameId }) => {
    try {
      const response = await axios.post(
        `${httpOrHttps}${API_URL}/api/games/${gameId}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (err) {
      return err.response.data;
    }
  });

  ipcMain.handle("game:start", async (_event, { token, gameId }) => {
    try {
      await axios.patch(
        `${httpOrHttps}${API_URL}/api/games/${gameId}/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
    } catch (err) {
      return err.response.data;
    }
  });

  ipcMain.on("game:quit", async (_event, { token, gameId }) => {
    await axios.patch(
      `${httpOrHttps}${API_URL}/api/players/exit/game/${gameId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  });

  ipcMain.handle("players:list", async (_event, { token, gameId }) => {
    const response = await axios.get(
      `${httpOrHttps}${API_URL}/api/players/game/${gameId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  });

  ipcMain.handle("players:status", async (_event, { token, gameId }) => {
    const response = await axios.get(
      `${httpOrHttps}${API_URL}/api/players/status/game/${gameId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  });

  ipcMain.on("player:ready", async (_event, { token, gameId }) => {
    await axios.patch(
      `${httpOrHttps}${API_URL}/api/players/ready/game/${gameId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  });

  ipcMain.on("player:logout", async (_event, { token }) => {
    await axios.delete(`${httpOrHttps}${API_URL}/api/auth/logout/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  ipcMain.handle("player:update", async (_event, { token, user }) => {
    const response = await axios.put(
      `${httpOrHttps}${API_URL}/api/users/${user.id}`,
      {
        username: user.username,
        email: user.email,
        password: user.password,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data;
  });

  ipcMain.on("game:exit", async (_event, { token, gameId }) => {
    await axios.patch(
      `${httpOrHttps}${API_URL}/api/players/exit/game/${gameId}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  });

  ipcMain.handle("cards:play", async (event, { card, token, gameId }) => {
    try {
      const response = await axios.post(
        `${httpOrHttps}${API_URL}/api/cards/play/game/${gameId}`,
        card,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (err) {
      return err.response.data;
    }
  });

  ipcMain.handle("cards:check", async (_event, { token, gameId }) => {
    try {
      const response = await axios.get(
        `${httpOrHttps}${API_URL}/api/cards/check/game/${gameId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (err) {
      return err.response.data;
    }
  });

  ipcMain.handle("cards:draw", async (_event, { token, gameId }) => {
    try {
      const response = await axios.get(
        `${httpOrHttps}${API_URL}/api/cards/draw/game/${gameId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (err) {
      return err.response.data;
    }
  });

  ipcMain.handle("cards:last", async (_event, { token, gameId }) => {
    const response = await axios.get(
      `${httpOrHttps}${API_URL}/api/cards/last/game/${gameId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  });

  ipcMain.handle("cards:hand", async (_event, { token, gameId }) => {
    const response = await axios.get(
      `${httpOrHttps}${API_URL}/api/cards/hand/game/${gameId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    return response.data;
  });

  ipcMain.handle(
    "player:challenge",
    async (_event, { token, gameId, challengedPlayer }) => {
      try {
        const response = await axios.post(
          `${httpOrHttps}${API_URL}/api/players/challenge/game/${gameId}`,
          {
            challengedPlayer,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        return response.data;
      } catch (err) {
        return err.response.data;
      }
    },
  );

  ipcMain.handle("player:uno", async (_event, { token, gameId }) => {
    try {
      const response = await axios.patch(
        `${httpOrHttps}${API_URL}/api/players/uno/game/${gameId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    } catch (err) {
      return err.response.data;
    }
  });

  ipcMain.on("connect-websocket", (_event, userId) => {
    ws = new WebSocket(`${wsOrWss}${API_URL}?playerId=` + userId);

    ws.on("open", () => {
      _event.reply("websocket-connected");
    });

    ws.on("message", (data) => {
      const message = data.toString();
      _event.reply("websocket-message", message);
    });
  });

  ipcMain.on("disconnect-websocket", () => {
    if (ws) {
      ws.close();
    }
  });

  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
