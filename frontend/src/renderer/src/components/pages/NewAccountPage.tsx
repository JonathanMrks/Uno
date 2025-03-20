import {
  Content,
  Image,
  Logo,
  NewAccountForm,
  RootLayout,
  SecondaryButton,
  SideBard,
} from "@/components";
import { useNavigate } from "react-router-dom";
import { bgFlow } from "@/assets";

export const NewAccountPage = () => {
  const context = window.context;

  const handleFormSubmit = async ({ username, email, password }) => {
    return await context.userRegister({
      username,
      email,
      password,
    });
  };

  const navigate = useNavigate();

  const handleCancelClick = () => {
    navigate("/");
  };

  return (
    <RootLayout>
      <SideBard className="p-20 bg-gradient-to-t from-secondary via-secondary to-primary">
        <div className="flex-col flex content-center h-full">
          <Logo className="text-center mb-[5rem]" />
          <label className="mb-10 text-2xl text-center">REGISTER</label>
          <NewAccountForm onSubmit={handleFormSubmit}>
            <SecondaryButton className="mb-10" onClick={handleCancelClick}>
              CANCEL
            </SecondaryButton>
          </NewAccountForm>
        </div>
      </SideBard>
      <Content className="bg-white">
        <Image
          src={bgFlow.default}
          alt="Example Image"
          className="object-cover w-full h-full"
        />
      </Content>
    </RootLayout>
  );
};
