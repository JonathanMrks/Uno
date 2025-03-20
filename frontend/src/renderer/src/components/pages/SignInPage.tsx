import Cookies from "js-cookie";
import {
  SecondaryButton,
  Logo,
  SignInForm,
  Image,
  Content,
  RootLayout,
  SideBard,
} from "@/components";
import { useNavigate } from "react-router-dom";
import { useAtom } from "jotai";
import { userAtom } from "@/store/atoms";
import * as images from "@/assets";

export const SignInPage = () => {
  const [, setUser] = useAtom(userAtom);
  const context = window.context;

  const handleFormSubmit = async ({ username, password }) => {
    const response = await context.authLogin({ username, password });
    const { token } = response;
    localStorage.setItem("token", token);

    const userInfo = await context.authInfo({ token });
    setUser((prevUser) => ({
      ...prevUser,
      id: userInfo.id,
      username: userInfo.username,
      email: userInfo.email,
      password: "",
    }));
  };

  const navigate = useNavigate();

  const handleNewAccountClick = () => {
    navigate("/newAccount");
  };

  return (
    <RootLayout>
      <SideBard className="p-20 bg-gradient-to-t from-secondary via-secondary to-primary">
        <div className="flex-col flex content-center h-full">
          <Logo className="text-center mb-[5rem]" />
          <label className="mb-10 text-2xl text-center">SIGN IN</label>
          <SignInForm onSubmit={handleFormSubmit}>
            <SecondaryButton className="mb-10" onClick={handleNewAccountClick}>
              NEW ACCOUNT
            </SecondaryButton>
          </SignInForm>
        </div>
      </SideBard>
      <Content className="bg-white">
        <Image
          src={images.bgFlow.default}
          alt="Example Image"
          className="object-cover w-full h-full"
        />
      </Content>
    </RootLayout>
  );
};
