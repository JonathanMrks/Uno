import PropTypes from "prop-types";

export const RoomTitle = ({ roomName }) => {
  return <h1 className="text-4xl">{roomName}</h1>;
};

RoomTitle.propTypes = {
  roomName: PropTypes.string.isRequired,
};
