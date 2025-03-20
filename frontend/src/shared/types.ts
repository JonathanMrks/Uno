import { Card, User } from "./models";
import IpcRendererEvent = Electron.IpcRendererEvent;
import * as Electron from "electron";

export type AuthLogin = (username: string, password: string) => Promise<any>;
export type AuthInfo = (token: string) => Promise<any>;
export type GameHost = (token: string) => Promise<any>;
export type GameGet = (token: string, gameId: string) => Promise<any>;
export type GameJoin = (token: string, gameId: string) => Promise<any>;
export type GameStart = (token: string, gameId: string) => Promise<any>;
export type PlayersList = (token: string, gameId: string) => Promise<any>;
export type PlayersStatus = (token: string, gameId: string) => Promise<any>;
export type PlayerUpdate = (token: string, user: User) => Promise<any>;
export type CardsCheck = (token: string, gameId: string) => Promise<any>;
export type CardsDraw = (token: string, gameId: string) => Promise<any>;
export type CardsLast = (token: string, gameId: string) => Promise<any>;
export type CardsHand = (token: string, gameId: string) => Promise<any>;
export type PlayerUno = (token: string, gameId: string) => Promise<any>;
export type Send = (channel: string, ...args: any[]) => void;
export type UserRegister = (
  username: string,
  email: string,
  password: string,
) => Promise<any>;
export type CardsPlay = (
  card: Card,
  token: string,
  gameId: string,
) => Promise<any>;
export type PlayerChallenge = (
  token: string,
  gameId: string,
  challengedPlayer: string,
) => Promise<any>;
export type RemoveListener = (
  channel: string,
  func: (event: IpcRendererEvent, ...args: any[]) => void,
) => void;
export type On = (
  channel: string,
  func: (event: IpcRendererEvent, ...args: any[]) => void,
) => void;
export type RemoveAllListeners = (channel: string) => void;
