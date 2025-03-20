import { ReactElement } from "react";
import PropTypes from "prop-types";

export const HomeItem = ({ ...props }): ReactElement => {
  return (
    <div
      className="w-60 bg-primary flex flex-col items-center rounded-2xl cursor-pointer hover:opacity-50 shadow-[5px_5px_20px_2px_rgba(0,0,0,0.4)]"
      onClick={props.onClick}
    >
      <img src={props.img} className="rounded-2xl"></img>
      <p className="text-3xl p-3">{props.optionName}</p>
    </div>
  );
};

HomeItem.propTypes = {
  img: PropTypes.string.isRequired,
  optionName: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};
