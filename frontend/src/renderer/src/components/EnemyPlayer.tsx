import { twMerge } from "tailwind-merge";
import PropTypes from "prop-types";
import { ReactElement } from "react";
import { toast } from "react-toastify";

export const EnemyPlayer = ({
  className,
  onSubmit,
  ...props
}): ReactElement => {
  const handleChallengePlayer = async (event) => {
    event.preventDefault();
    const { response, update } = await onSubmit({
      challengedPlayer: props.name,
    });
    if (response.error) {
      toast.error(response.error);
      return;
    }
    await update();
    toast.success("The player " + props.name + " is now challenged!");
  };

  return (
    <div
      className={twMerge(
        "flex flex-row items-center justify-center gap-5",
        className,
      )}
    >
      <div className="player-info flex flex-col items-center">
        <div className="flex flex-col items-center justify-center h-36 w-36 rounded-2xl bg-[#481CA7] shadow-[5px_5px_10px_2px_rgba(0,0,0,0.3)]">
          <img
            src={props.playerIcon}
            alt="Player Icon"
            className="absolute -mt-36 bg-[#1A0959] w-16 h-16 rounded-full "
          ></img>

          <p className="name">{props.name}</p>

          <div className="bg-[#1A0959] text-2xl mt-2 py-1 px-9 border rounded-full">
            {props.score}
          </div>
        </div>

        <button
          className="mt-4 px-4 py-2 bg-[#481CA7] border rounded-lg hover:bg-[#362EF2] shadow-[5px_5px_10px_2px_rgba(0,0,0,0.3)]"
          onClick={handleChallengePlayer}
        >
          CHALLENGE!
        </button>
      </div>

      <div className="player-cards flex items-center  ml-10 mb-16">
        <img
          src={props.backCard}
          alt="Card back"
          className="w-16 h-26 rotate-[160deg] absolute -m-6 "
        />
        <img
          src={props.backCard}
          alt="Card back"
          className="w-16 h-26 rotate-0 absolute mb-4"
        />
        <img
          src={props.backCard}
          alt="Card back"
          className="w-16 h-26 rotate-[205deg] absolute m-6"
        />
        <div className="absolute mt-24 bg-[#1A0959] p-7 rounded-full flex items-center justify-center">
          <p className="text-2xl absolute ">{props.cardsNum}</p>
        </div>
      </div>
    </div>
  );
};

EnemyPlayer.propTypes = {
  className: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  score: PropTypes.number.isRequired,
  backCard: PropTypes.string.isRequired,
  cardsNum: PropTypes.number.isRequired,
  playerIcon: PropTypes.string,
};
