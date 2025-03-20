import PropTypes from "prop-types";
import * as images from "@/assets";

export function PlayerScore({ ...props }) {
  return (
    <div
      className={`flex flex-row bg-primary rounded-2xl ${props.isWinner === true ? "border-2 border-green-500" : props.isWinner === false ? "border-2 border-red-500" : {}}`}
    >
      <div
        className={`flex flex-row rounded-md items-center justify-start w-80 h-20 ${props.isWinner === true ? "bg-green-500" : props.isWinner === false ? "bg-red-500" : "bg-secondary"}`}
      >
        <img
          src={images.playerIconPNG.default}
          className="w-16 h-16 ml-4"
          alt="User Icon"
        />
        <p className="text-2xl ml-4">{props.username}</p>
      </div>
      <p className=" flex items-center justify-center w-80 text-2xl">{`SCORE: ${props.score}`}</p>
    </div>
  );
}

PlayerScore.propTypes = {
  isWinner: PropTypes.bool,
  username: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,
};
