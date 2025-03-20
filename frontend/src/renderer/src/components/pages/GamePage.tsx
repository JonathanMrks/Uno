import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import {
  gameAtom,
  lastCardAtom,
  playerCardsAtom,
  playersAtom,
  userAtom,
} from "@/store/atoms";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import {
  assignCardsImg,
  assignLastCardImg,
} from "@renderer/utils/CardsImgHelper";
import { Card } from "@shared/models";
import { Background } from "../Background";
import * as images from "@/assets";
import {
  EnemyPlayer,
  Popup,
  PrimaryButton,
  SecondaryButton,
} from "@/components";
import { useEffect, useState } from "react";

export function GamePage() {
  const [gamePlayers, setGamePlayers] = useAtom(playersAtom);
  const [user] = useAtom(userAtom);
  const [playerCards, setPlayerCards] = useAtom(playerCardsAtom);
  const [lastCard, setLastCard] = useAtom(lastCardAtom);
  const [isPopupEnable, setPopupEnable] = useState(false);
  const [isChoosingColor, setIsChoosingColor] = useState<boolean>(false);
  const [chooseCard, setChooseCard] = useState<Card | null>(null);
  const [score, setScore] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);
  const [game, setGame] = useAtom(gameAtom);

  const navigate = useNavigate();
  const token = localStorage.getItem("token")?.toString();

  const context = window.context;

  const handleWebSocketMessages = async (_event, data) => {
    const wsMessage = JSON.parse(data);
    if ("winner" in wsMessage) {
      await finishGame();
      return;
    }
    await update();
    if ("message" in wsMessage) {
      toast.info(wsMessage.message);
    }
    if ("nextPlayer" in wsMessage) {
      if (wsMessage.nextPlayer == user?.username) {
        setMessage("It's your turn!");
        await handlePlayerTurn();
      } else {
        setMessage("Next player is " + wsMessage.nextPlayer);
      }
    }
    if ("quittingPlayer" in wsMessage) {
      const players = gamePlayers?.filter(
        (player) => player.username !== wsMessage.quittingPlayer,
      );
      setGamePlayers(players);
      toast.info(wsMessage.quittingPlayer + " gave up!");
    }
  };

  useEffect(() => {
    context.on("websocket-message", handleWebSocketMessages);

    const currentPlayer = game?.players.find(
      (player) => player.user_id === game?.current_player_id,
    );
    if (currentPlayer?.user_id === user?.id) {
      setMessage(`YOU are the first to play!`);
    } else {
      const player = gamePlayers?.find((pl) => {
        return pl.user_id === game?.current_player_id;
      });
      setMessage(`${player?.username} is the first to play!`);
    }

    return () => {
      context.removeAllListeners("websocket-message");
    };
  }, []);

  const handleChallengeClick = async ({ challengedPlayer }) => {
    return {
      response: await context.playerChallenge({
        token,
        gameId: game?.id,
        challengedPlayer,
      }),
      update: update,
    };
  };

  const handlePlayerTurn = async () => {
    const response = await context.cardsCheck({
      token,
      gameId: game?.id,
    });
    if ("newCard" in response) {
      const hand = await context.cardsHand({
        token,
        gameId: game?.id,
      });
      const cards = hand.cards;
      assignCardsImg(cards);
      setPlayerCards(cards);
      toast.info("You couldn't play, so you drew a card");
      setMessage("Next player is " + response.nextPlayer);
    }
  };

  const handleCardClick = async (card) => {
    if (
      (card.value === "wild" && card.color == null) ||
      (card.value === "plus4" && card.color == null)
    ) {
      setChooseCard(card);
      setIsChoosingColor(true);
      await update();
      return;
    }

    const playedCard = { value: card.value, color: card.color };
    const response = await context.cardsPlay({
      card: playedCard,
      token,
      gameId: game?.id,
    });
    if (response.error) {
      toast.error(response.error);
      return;
    }
    if ("winner" in response) {
      await finishGame();
      return;
    }

    await update();
  };

  const handleDrawCard = async () => {
    const response = await context.cardsDraw({
      token,
      gameId: game?.id,
    });
    if (!("nextPlayer" in response)) {
      toast.error("It's not possible to draw a card right now!");
      return;
    }
    setMessage("Next player is " + response.nextPlayer);
    await update();
  };

  const handleUno = async () => {
    const response = await context.playerUno({
      token,
      gameId: game?.id,
    });
    if (response.error) {
      toast.error(response.error);
      return;
    }
    toast.success("You shout Uno for everyone!");
    await update();
  };

  const handleGiveUpClick = async () => {
    try {
      context.send("game:exit", { token, gameId: game?.id });
      context.send("disconnect-websocket");
      setGamePlayers(null);
      setGame(null);
      setLastCard(null);
      navigate("/home");
    } catch (err) {
      toast.error(
        "Was not possible to exit the game, try to close and open again.",
      );
    }
  };

  const finishGame = async () => {
    context.send("disconnect-websocket");
    setLastCard(null);
    navigate("/scores");
  };

  const update = async () => {
    let players = await context.playersList({
      token,
      gameId: game?.id,
    });

    const player = players.find(
      (player) => player.user_id === user?.id.toString(),
    );

    const enemiesList = players.filter(
      (player) => player.user_id !== user?.id.toString() && !player.give_up,
    );

    const response = await context.cardsHand({
      token,
      gameId: game?.id,
    });

    const cards = response.cards;

    const lastCard = await context.cardsLast({
      token,
      gameId: game?.id,
    });

    setScore(player.score);
    setGamePlayers(enemiesList);
    assignCardsImg(cards);
    setPlayerCards(cards);
    if (Object.keys(lastCard).length > 0) {
      assignLastCardImg(lastCard);
      setLastCard(lastCard);
    }
  };

  return (
    <Background className="grid grid-cols-3 grid-rows-3">
      <header className="text-center mt-20 mr-32">
        <h1 className="text-5xl">JUno</h1>
      </header>

      {gamePlayers?.map((player, index) => (
        <EnemyPlayer
          onSubmit={handleChallengeClick}
          key={player.username}
          className={`${index === 0 ? "row-start-1 col-start-2 mt-24" : index === 1 ? "row-start-2 col-start-1" : "row-start-2 col-start-3"}`}
          name={player.username}
          backCard={images.backCardPNG.default}
          score={player.score}
          cardsNum={player.cardsNum}
          playerIcon={images.playerIconPNG.default}
        />
      ))}

      <div className="flex flex-col items-center justify-center col-start-2 row-start-2">
        <div className="flex items-center justify-center w-96 bg-secondary rounded-2xl border-8 border-primary shadow-[5px_5px_10px_2px_rgba(0,0,0,0.4)] my-6 py-10 gap-4">
          {lastCard && (
            <img
              src={lastCard.imgSrc}
              alt={lastCard.alt}
              className={`w-20 h-28 shadow-3xl rounded-xl shadow-${
                lastCard.color === "red" ? "shadow-red" : ""
              } ${lastCard.color === "green" ? "shadow-green" : ""} ${
                lastCard.color === "blue" ? "shadow-blue" : ""
              } ${lastCard.color === "yellow" ? "shadow-yellow" : ""}`}
            />
          )}
          <img src={images.backCardPNG.default} alt="Card" className="w-20 h-28" />
        </div>
        {message && (
          <div className="text-xl bg-secondary/60 py-2 px-4 rounded-full">
            {message}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center items-center row-start-3 col-start-1">
        <div className="flex flex-row items-center">
          <p className="text-xl">SCORE:</p>
          <div className="bg-[#1A0959] w-40 h-12 ml-1 rounded-xl flex items-center justify-center text-lg">
            {score}
            /500
          </div>
        </div>
        <SecondaryButton
          className="mt-4 bg-[#1A0959] bg-opacity-30 border-[#481CA7] border-4 py-3 w-60 rounded-xl hover:bg-[#362EF2]"
          onClick={() => setPopupEnable(true)}
        >
          GIVE UP
        </SecondaryButton>
      </div>

      <div className="player-hand flex flex-wrap items-center justify-center row-start-3 col-start-2 max-w-3xl gap-2">
        {playerCards?.map((card, index) => (
          <div
            key={index}
            className="cursor-pointer"
            onClick={() => handleCardClick(card)}
          >
            <img
              src={card.imgSrc}
              alt={card.alt}
              className="w-20 h-28 hover:opacity-50"
            />
          </div>
        ))}
      </div>

      <div className="actions flex flex-col items-center justify-center row-start-3 col-start-3">
        <PrimaryButton
          className="w-60 py-3 bg-[#481CA7] rounded-xl hover:bg-[#362EF2]"
          onClick={() => handleDrawCard()}
        >
          DRAW CARD
        </PrimaryButton>
        <PrimaryButton
          className="mt-4 w-60 py-3 bg-[#481CA7] rounded-xl hover:bg-[#362EF2]"
          onClick={() => handleUno()}
        >
          UNO!
        </PrimaryButton>
      </div>

      {isPopupEnable && (
        <Popup>
          <div className="header text-white text-2xl mb-4 text-center">
            {" "}
            CONFIRM
          </div>
          <div className="content text-white mb-4">
            Are you sure you want to give up?
          </div>
          <div className="actions flex justify-center space-x-4">
            <SecondaryButton
              className="bg-red-500 border-red-500 py-3 px-6 rounded-xl hover:bg-red-600 w-full"
              onClick={() => setPopupEnable(false)}
            >
              NO
            </SecondaryButton>
            <SecondaryButton
              className="bg-blue-500 border-blue-500 py-3 px-6 rounded-xl hover:bg-blue-600 w-full"
              onClick={async () => {
                setPopupEnable(false);
                await handleGiveUpClick();
              }}
            >
              YES
            </SecondaryButton>
          </div>
        </Popup>
      )}

      {isChoosingColor && (
        <Popup>
          <div className="w-56 flex flex-col justify-center items-center gap-5">
            <p className="text-2xl">Choose a color!</p>
            <div className="flex flex-wrap items-center justify-between gap-5 w-full">
              <PrimaryButton
                className=" bg-red-500 border-red-500 hover:bg-red-700 w-24"
                onClick={async () => {
                  setIsChoosingColor(false);
                  chooseCard!.color = "red";
                  await handleCardClick(chooseCard);
                }}
              >
                RED
              </PrimaryButton>
              <PrimaryButton
                className="bg-blue-500 border-blue-500 w-24"
                onClick={async () => {
                  setIsChoosingColor(false);
                  chooseCard!.color = "blue";
                  await handleCardClick(chooseCard);
                }}
              >
                BLUE
              </PrimaryButton>
              <PrimaryButton
                className=" bg-green-500 border-green-500 hover:bg-green-700 w-24"
                onClick={async () => {
                  setIsChoosingColor(false);
                  chooseCard!.color = "green";
                  await handleCardClick(chooseCard);
                }}
              >
                GREEN
              </PrimaryButton>
              <PrimaryButton
                className="bg-yellow-500 border-yellow-500 hover:bg-yellow-600 w-24"
                onClick={async () => {
                  setIsChoosingColor(false);
                  chooseCard!.color = "yellow";
                  await handleCardClick(chooseCard);
                }}
              >
                YELLOW
              </PrimaryButton>
            </div>

            <SecondaryButton
              className="w-full mt-5"
              onClick={() => {
                setIsChoosingColor(false);
              }}
            >
              CANCEL
            </SecondaryButton>
          </div>
        </Popup>
      )}
    </Background>
  );
}
