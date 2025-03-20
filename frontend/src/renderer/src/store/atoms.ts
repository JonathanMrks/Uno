import { atom } from "jotai";
import { Card, Game, Player, User } from "@shared/models";

export const userAtom = atom<User | null>(null);
export const playersAtom = atom<Player[] | null>(null);
export const gameAtom = atom<Game | null>(null);
export const playerCardsAtom = atom<Card[] | null>(null);
export const lastCardAtom = atom<Card | null>(null);
