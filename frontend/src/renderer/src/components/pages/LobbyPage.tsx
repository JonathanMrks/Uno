import { useEffect, useState } from "react";
import {
  Background,
  LoadingSpinner,
  LobbyPlayer,
  Logo,
  PrimaryButton,
  RoomTitle,
  SecondaryButton,
} from "@/components";
import { useAtom } from "jotai";
import {
  gameAtom,
  playerCardsAtom,
  playersAtom,
  userAtom,
} from "@/store/atoms";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { assignCardsImg } from "@renderer/utils/CardsImgHelper";
import { playerIconPNG } from "@/assets";

export function LobbyPage() {
  const [game, setGame] = useAtom(gameAtom);
  const [gamePlayers, setPlayers] = useAtom(playersAtom);
  const [user] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [, setPlayerCards] = useAtom(playerCardsAtom);
  const token = localStorage.getItem("token")?.toString();

  const context = window.context;
  const navigate = useNavigate();

  const handleWebSocketMessage = async (_event, data) => {
    if (data && "gameStatus" in JSON.parse(data)) {
      await joinGame();
    } else {
      setPlayers(
        await context.playersStatus({
          token,
          gameId: game?.id,
        }),
      );
    }
  };

  useEffect(() => {
    context.send("connect-websocket", user?.id);

    context.on("websocket-message", handleWebSocketMessage);

    return () => context.removeAllListeners("websocket-message");
  }, []);

  const handleQuitGame = async () => {
    context.send("game:quit", {
      token,
      gameId: game?.id,
    });
    navigate("/home");
    context.send("disconnect-websocket");
  };

  const handleBeReady = async (event) => {
    event.preventDefault();
    try {
      context.send("player:ready", {
        token,
        gameId: game?.id,
      });
      setGame(await context.gameGet({ token, gameId: game?.id }));
      setPlayers(
        await context.playersStatus({
          token,
          gameId: game?.id,
        }),
      );
    } catch (error) {
      toast.error("Was not possible to be ready, something wrong happened.");
    }
  };

  const handleCopyGameId = () => {
    navigator.clipboard
      .writeText(game!.id)
      .then(() => {
        toast.success("Game ID copied to clipboard!");
      })
      .catch((err) => {
        toast.error("Failed to copy game ID:", err);
      });
  };

  const handleStartGame = async () => {
    if (gamePlayers?.length === 1) {
      toast.error("It's not possible to start the game with one player.");
      return;
    }
    const response = await context.gameStart({
      token,
      gameId: game?.id,
    });
    if (response && "error" in response) {
      toast.error(response.error);
      return;
    }
    await joinGame();
  };

  const joinGame = async () => {
    setIsLoading(true);

    let players = await context.playersList({
      token,
      gameId: game?.id,
    });

    players = players.filter(
      (player) => player.user_id !== user?.id.toString(),
    );
    setPlayers(players);

    const response = await context.cardsHand({
      token,
      gameId: game?.id,
    });
    const cards = response.cards;
    assignCardsImg(cards);
    setPlayerCards(cards);

    setGame(
      await context.gameGet({
        token,
        gameId: game?.id,
      }),
    );

    setIsLoading(false);
    navigate("/game");
  };

  return (
    <Background className="flex flex-col items-center">
      <header className="flex flex-row items-end justify-around w-full mt-32">
        <div className="w-96">
          <Logo />
          <RoomTitle roomName="WAITING ROOM" />
        </div>
        <div className="flex flex-row items-center justify-end w-96">
          <p className="text-2xl">ROOM:</p>
          <p
            className="flex justify-center bg-secondary p-3 ml-3 rounded-xl cursor-pointer"
            onClick={handleCopyGameId}
          >
            {game?.id}
          </p>
        </div>
      </header>

      <div className="flex flex-col items-center gap-20 p-16 mt-28 bg-secondary bg-opacity-60 rounded-2xl">
        <p className="text-3xl flex justify-center">
          {gamePlayers?.length + "/4"}
        </p>
        <div className="flex flex-row gap-10">
          {gamePlayers?.map((player, index) => (
            <LobbyPlayer
              key={index}
              playerIcon={playerIconPNG.default}
              playerName={player.username}
              playerStatus={player.ready}
              username={user?.username}
            ></LobbyPlayer>
          ))}
        </div>
      </div>

      <div className="flex flex-row w-full justify-around mt-20">
        <SecondaryButton className="w-60" onClick={handleQuitGame}>
          QUIT GAME
        </SecondaryButton>
        <div className="flex flex-row gap-4">
          <PrimaryButton className="w-60" onClick={handleBeReady}>
            I AM READY
          </PrimaryButton>
          <PrimaryButton className="w-60" onClick={handleStartGame}>
            START GAME
          </PrimaryButton>
        </div>
      </div>
      {isLoading && <LoadingSpinner />}
    </Background>
  );
}
