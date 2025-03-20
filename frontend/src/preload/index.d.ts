import {
    AuthLogin,
    AuthInfo,
    UserRegister,
    GameHost,
    GameGet,
    GameJoin,
    GameStart,
    PlayersList,
    PlayersStatus,
    PlayerUpdate,
    CardsPlay,
    CardsCheck,
    CardsDraw,
    CardsLast,
    CardsHand,
    PlayerChallenge,
    PlayerUno,
    RemoveListener,
    RemoveAllListeners,
    Send,
    On
} from '@shared/types';

declare global {
    interface Window {
        context: {
            locale: string;
            authLogin: AuthLogin;
            authInfo: AuthInfo;
            userRegister: UserRegister;
            gameHost: GameHost;
            gameGet: GameGet;
            gameJoin: GameJoin;
            gameStart: GameStart;
            playersList: PlayersList;
            playersStatus: PlayersStatus;
            playerUpdate: PlayerUpdate;
            cardsPlay: CardsPlay;
            cardsCheck: CardsCheck;
            cardsDraw: CardsDraw;
            cardsLast: CardsLast;
            cardsHand: CardsHand;
            playerChallenge: PlayerChallenge;
            playerUno: PlayerUno;
            removeEventListener: RemoveListener
            removeAllListeners: RemoveAllListeners
            send: Send;
            on: On;
        };
    }
}
