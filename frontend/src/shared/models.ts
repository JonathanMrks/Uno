export type Card = {
  value: string;
  color: string;
  imgSrc: string;
  alt: string;
};

export type Player = {
  user_id: string;
  username: string;
  score: number;
  give_up: boolean;
  uno: boolean;
  ready: boolean;
  cardsNum: number;
};

export type User = {
  id: string;
  username: string;
  email: string;
  password: string;
};

export type Game = {
  id: string;
  title: string;
  rules: string;
  status: "waiting" | "playing" | "finished";
  players: Player[];
  deck: Card[];
  last_card: Card;
  in_default_direction: boolean;
  current_player_id?: string;
  winner?: string;
  maxPlayers: number;
  createdAt: Date;
};
