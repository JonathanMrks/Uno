import PropTypes from "prop-types";
import { twMerge } from "tailwind-merge";

export function LobbyPlayer({
  playerIcon,
  playerName,
  playerStatus,
  username,
}) {
  return (
    <div className="player-info flex flex-col items-center">
      <div className="flex flex-col items-center justify-center h-36 w-60 rounded-2xl bg-[#481CA7] shadow-[5px_5px_10px_2px_rgba(0,0,0,0.3)]">
        <img
          src={playerIcon}
          alt="Player Icon"
          className="absolute -mt-36 bg-[#1A0959] w-16 h-16 rounded-full "
        ></img>
        <p className="text-xl mt-6">{playerName}</p>
        <div
          className={twMerge(
            "bg-[#1A0959] text-xl flex justify-center mt-2 py-2 w-48 border rounded-xl",
            playerName === username ? "text-purple-500" : "",
          )}
        >
          {playerStatus ? "READY" : "NOT READY"}
        </div>
      </div>
    </div>
  );
}

LobbyPlayer.propTypes = {
  playerIcon: PropTypes.string,
  playerName: PropTypes.string.isRequired,
  playerStatus: PropTypes.bool.isRequired,
  username: PropTypes.string,
};
