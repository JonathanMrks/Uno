import { gameAtom, playersAtom, userAtom } from "@/store/atoms";
import { useAtom } from "jotai";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Background,
  HomeItem,
  Input,
  LoadingSpinner,
  Logo,
  Popup,
  PrimaryButton,
  RoomTitle,
  SecondaryButton,
} from "@/components";
import { toast } from "react-toastify";
import { historyPNG, hostGamePNG, joinGamePNG, playerIconPNG } from "@/assets";

export function HomePage() {
  const token = localStorage.getItem("token")?.toString();
  const [user] = useAtom(userAtom);
  const [, setGame] = useAtom(gameAtom);
  const [, setPlayers] = useAtom(playersAtom);
  const [roomId, setRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPopupEnable, setPopupEnable] = useState(false);

  const context = window.context;

  const navigate = useNavigate();

  const handleHostClick = async () => {
    setIsLoading(true);
    try {
      const response = await context.gameHost({ token });
      await joinGame(response.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = async () => {
    navigate("/user");
  };

  const handleJoinClick = async () => {
    setPopupEnable(false);
    await joinGame(roomId);
  };

  const joinGame = async (gameId) => {
    setIsLoading(true);
    const response = await context.gameJoin({ token, gameId });
    if (response.error) {
      toast.error(response.error);
      setIsLoading(false);
      return;
    }
    setGame(await context.gameGet({ token, gameId }));
    setPlayers(
      await context.playersStatus({
        token,
        gameId,
      })
    );
    setIsLoading(false);
    navigate("/lobby");
  };

  return (
    <Background className="flex flex-col items-center">
      <header className="flex flex-row items-end justify-around w-full mt-32">
        <div className="flex flex-col w-96">
          <Logo />
          <RoomTitle roomName="HOME" />
        </div>

        <div className="flex flex-row justify-end items-center w-96">
          <p className="text-2xl">{user?.username}</p>
          <img
            src={playerIconPNG.default}
            className="w-20 h-20 ml-5 cursor-pointer hover:opacity-70"
            onClick={handleUserClick}
          />
        </div>
      </header>

      <div className="flex flex-row mt-56 gap-64">
        <HomeItem
          img={hostGamePNG.default}
          optionName="HOST GAME"
          onClick={handleHostClick}
        />
        <HomeItem
          img={joinGamePNG.default}
          optionName="JOIN GAME"
          onClick={async () => {
            setRoomId(roomId || (await navigator.clipboard.readText()));
            setPopupEnable(true);
          }}
        />
        <HomeItem
          img={historyPNG.default}
          optionName="HISTORY"
          onClick={() => {
            toast.info("This option is currently unavailable.");
          }}
        />
      </div>
      {isPopupEnable && (
        <Popup>
          <Input
            type="text"
            placeholder="Room ID"
            className="w-72"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <div className="flex flex-row items-center justify-between">
            <SecondaryButton
              className="w-32"
              onClick={() => {
                setPopupEnable(false);
              }}
            >
              CANCEL
            </SecondaryButton>
            <PrimaryButton className="w-32" onClick={handleJoinClick}>
              JOIN
            </PrimaryButton>
          </div>
        </Popup>
      )}
      {isLoading && <LoadingSpinner />}
    </Background>
  );
}
