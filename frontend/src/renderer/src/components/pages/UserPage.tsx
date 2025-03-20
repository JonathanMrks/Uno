import Cookies from "js-cookie";
import {
  SecondaryButton,
  Content,
  RootLayout,
  SideBard,
  Image,
  UserForm,
} from "@/components";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAtom } from "jotai";
import { userAtom } from "@/store/atoms";
import * as images from "@/assets";

export const UserPage = () => {
  const context = window.context;
  const [, setUser] = useAtom(userAtom);
  const token = localStorage.getItem("token")?.toString();

  const navigate = useNavigate();

  const handleFormSubmit = async ({ token, id, username, password }) => {
    await context.playerUpdate({
      token,
      user: {
        id,
        username,
        password,
      },
    });
  };

  const handleCancelClick = () => {
    navigate("/home");
  };

  const handleLogoutClick = async () => {
    await toast
      .promise(async () => await context.send("player:logout", { token }), {
        pending: "Logging out...",
        success: "User logged out.",
        error:
          "Was not possible to log out the player, try to close and open the game!",
      })
      .then(() => {
        navigate("/");
        Cookies.remove("token");
        setUser(null);
      });
  };

  return (
    <RootLayout>
      <Content className="bg-white">
        <Image
          src={images.bgFlow.default}
          alt="Example Image"
          className="object-cover w-full h-full"
        />
      </Content>
      <SideBard className="p-20 bg-gradient-to-t from-secondary via-secondary to-primary">
        <div className="flex-col flex items-center justify-center h-full">
          <img src={images.playerIconPNG.default} className="w-20 mb-4"></img>
          <label className="mb-10 text-2xl text-center">MY PROFILE</label>
          <UserForm onSubmit={handleFormSubmit}>
            <SecondaryButton className="mb-5" onClick={handleCancelClick}>
              CANCEL
            </SecondaryButton>
          </UserForm>
          <SecondaryButton
            className="mt-16 w-full text-red-500 border-red-600 bg-red-800 hover:bg-red-700 hover:text-white"
            onClick={handleLogoutClick}
          >
            LOGOUT
          </SecondaryButton>
        </div>
      </SideBard>
    </RootLayout>
  );
};
