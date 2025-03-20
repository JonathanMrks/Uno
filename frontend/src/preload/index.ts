import {
  AuthInfo,
  AuthLogin,
  CardsCheck,
  CardsDraw,
  CardsHand,
  CardsLast,
  CardsPlay,
  GameGet,
  GameHost,
  GameJoin,
  GameStart,
  PlayerChallenge,
  PlayersList,
  PlayersStatus,
  PlayerUno,
  PlayerUpdate,
  UserRegister,
} from "@shared/types";
import { contextBridge, ipcRenderer } from "electron";
import IpcRendererEvent = Electron.IpcRendererEvent;

if (!process.contextIsolated) {
  throw new Error("contextIsolation must be enabled in the BrowserWindow");
}

try {
  contextBridge.exposeInMainWorld("context", {
    authLogin: (...args: Parameters<AuthLogin>) =>
      ipcRenderer.invoke("auth:login", ...args),
    authInfo: (...args: Parameters<AuthInfo>) =>
      ipcRenderer.invoke("auth:info", ...args),
    userRegister: (...args: Parameters<UserRegister>) =>
      ipcRenderer.invoke("user:register", ...args),
    gameHost: (...args: Parameters<GameHost>) =>
      ipcRenderer.invoke("game:host", ...args),
    gameGet: (...args: Parameters<GameGet>) =>
      ipcRenderer.invoke("game:get", ...args),
    gameJoin: (...args: Parameters<GameJoin>) =>
      ipcRenderer.invoke("game:join", ...args),
    gameStart: (...args: Parameters<GameStart>) =>
      ipcRenderer.invoke("game:start", ...args),
    playersList: (...args: Parameters<PlayersList>) =>
      ipcRenderer.invoke("players:list", ...args),
    playersStatus: (...args: Parameters<PlayersStatus>) =>
      ipcRenderer.invoke("players:status", ...args),
    playerUpdate: (...args: Parameters<PlayerUpdate>) =>
      ipcRenderer.invoke("player:update", ...args),
    cardsPlay: (...args: Parameters<CardsPlay>) =>
      ipcRenderer.invoke("cards:play", ...args),
    cardsCheck: (...args: Parameters<CardsCheck>) =>
      ipcRenderer.invoke("cards:check", ...args),
    cardsDraw: (...args: Parameters<CardsDraw>) =>
      ipcRenderer.invoke("cards:draw", ...args),
    cardsLast: (...args: Parameters<CardsLast>) =>
      ipcRenderer.invoke("cards:last", ...args),
    cardsHand: (...args: Parameters<CardsHand>) =>
      ipcRenderer.invoke("cards:hand", ...args),
    playerChallenge: (...args: Parameters<PlayerChallenge>) =>
      ipcRenderer.invoke("player:challenge", ...args),
    playerUno: (...args: Parameters<PlayerUno>) =>
      ipcRenderer.invoke("player:uno", ...args),
    removeEventListener: (
      channel: string,
      func: (event: IpcRendererEvent, ...args: any[]) => void,
    ) => {
      return ipcRenderer.removeListener(channel, func);
    },
    send: (channel: string, ...args: any[]) =>
      ipcRenderer.send(channel, ...args),
    on: (
      channel: string,
      func: (event: IpcRendererEvent, ...args: any[]) => void,
    ) => ipcRenderer.on(channel, func),
    removeAllListeners: (channel: string) =>
      ipcRenderer.removeAllListeners(channel),
  });
} catch (error) {
  console.error(error);
}
