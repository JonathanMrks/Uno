import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrimaryButton, Input, LoadingSpinner } from "@/components";
import { useAtom } from "jotai";
import { userAtom } from "@/store/atoms";
import { formProps } from "./index";
import { toast } from "react-toastify";

export const SignInForm = ({ onSubmit, children }) => {
  const [user, setUser] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await onSubmit({
        username: user?.username,
        password: user?.password,
      });
      navigate("/home");
    } catch (error) {
      toast.error("Username or Password is wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e) => {
    setUser((prevUser) => ({
      ...prevUser,
      username: e.target.value,
      id: prevUser?.id || "",
      email: prevUser?.email || "",
      password: prevUser?.password || "",
    }));
  };

  const handlePasswordChange = (e) => {
    setUser((prevUser) => ({
      ...prevUser,
      password: e.target.value,
      id: prevUser?.id || "",
      username: prevUser?.username || "",
      email: prevUser?.email || "",
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="h-full flex-col flex justify-between"
    >
      <div>
        <Input
          type="text"
          placeholder="username"
          maxLength={12}
          className="w-full p-4 max-w-md mb-4"
          value={user?.username || ""}
          onChange={handleUsernameChange}
        />
        <Input
          type="password"
          placeholder="password"
          className="w-full p-4 max-w-md"
          value={user?.password || ""}
          onChange={handlePasswordChange}
        />
      </div>
      <div className="w-full flex flex-col">
        <PrimaryButton className="mb-10 bg-primary" type="submit">
          SIGN IN
        </PrimaryButton>
        {children}
      </div>
      {isLoading && <LoadingSpinner />}
    </form>
  );
};

SignInForm.propTypes = formProps;
