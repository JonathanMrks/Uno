import { gameAtom, playersAtom, userAtom } from "@renderer/store/atoms";
import { useAtom } from "jotai";
import { Background } from "../Background";
import { Logo } from "../Logo";
import { RoomTitle } from "../RoomTitle";
import { PlayerScore } from "../score/PlayerScore";
import { PrimaryButton } from "../buttons/PrimaryButton";
import { useEffect, useState } from "react";
import { Player } from "@shared/models";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "../effects/LoadingSpinner";

export function ScorePage() {
  const [game, setGame] = useAtom(gameAtom);
  const [user] = useAtom(userAtom);
  const [gamePlayers, setPlayers] = useAtom(playersAtom);
  const [isWinner, setIsWinner] = useState(false);
  const [winner, setWinner] = useState<Player | undefined>(undefined);
  const navigate = useNavigate();
  const token = localStorage.getItem("token")?.toString();
  const context = window.context;

  const fetchData = async () => {
    if (winner) return;

    const gameResponse = await context.gameGet({
      token,
      gameId: game?.id,
    });
    const players = await context.playersList({
      token,
      gameId: game?.id,
    });

    if (gameResponse?.winner == user?.id) {
      setIsWinner(true);
    }

    const foundWinner = players?.find((p) => p.user_id == gameResponse?.winner);
    setWinner(foundWinner);

    setPlayers(players.filter((p) => p.user_id !== gameResponse?.winner));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExitClick = () => {
    setPlayers(null);
    setGame(null);
    navigate("/home");
  };

  return (
    <Background className="flex flex-col">
      <header className="flex flex-col mt-32 ml-72">
        <Logo />
        <RoomTitle roomName="SCORES" />
      </header>

      {winner && (
        <div className="flex flex-col items-center justify-center mt-4">
          <h1
            className={`text-6xl ${isWinner ? "text-transparent bg-clip-text bg-gradient-to-b from-green-100 via-green-300 to-green-600" : "text-transparent bg-clip-text bg-gradient-to-b from-red-500 via-red-700 to-red-900"}`}
          >
            {isWinner ? "VICTORY!" : "DEFEAT"}
          </h1>
          <div className="bg-secondary/40 p-5 rounded-3xl mt-4">
            <PlayerScore
              isWinner={isWinner}
              username={winner?.username}
              score={winner?.score}
            ></PlayerScore>
          </div>
          <div className="flex flex-col gap-4 bg-secondary/40 p-5 rounded-3xl mt-4 h-80">
            {gamePlayers?.map((player, index) => (
              <PlayerScore
                key={index}
                username={player.username}
                score={player.score}
              />
            ))}
          </div>
          <PrimaryButton
            className="w-72 text-xl mt-6"
            onClick={handleExitClick}
          >
            EXIT
          </PrimaryButton>
        </div>
      )}
      {!winner && <LoadingSpinner />}
    </Background>
  );
}
