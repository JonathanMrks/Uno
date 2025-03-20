import { useAtom } from "jotai";
import { userAtom } from "@/store/atoms";
import { useState } from "react";
import { LoadingSpinner, Input, PrimaryButton } from "@/components";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Cookies from "js-cookie";
import { formProps } from "./index";

export const UserForm = ({ onSubmit, children }) => {
  const [user, setUser] = useAtom(userAtom);
  const token = localStorage.getItem("token")?.toString();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      if (user?.password === "") {
        toast.warning("The passwords cannot be empty.");
        return;
      } else if (user?.password !== confirmPassword) {
        toast.warning("The passwords are not equal.");
        return;
      }
      await toast
        .promise(
          async () =>
            await onSubmit({
              token,
              id: user?.id,
              username: user?.username,
              email: user?.email,
              password: user?.password,
            }),
          {
            pending: "Updating the user...",
            success: "User updated successfully!",
            error: "Username or Email is already in use.",
          },
        )
        .then(() => {
          setUser((prevUser) => ({
            ...prevUser,
            password: "",
            id: prevUser?.id || "",
            username: prevUser?.username || "",
            email: prevUser?.email || "",
          }));
          setConfirmPassword("");
        });
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

  const handleEmailChange = (e) => {
    setUser((prevUser) => ({
      ...prevUser,
      email: e.target.value,
      id: prevUser?.id || "",
      username: prevUser?.username || "",
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
          className="w-full p-4 max-w-md mb-4"
          maxLength={12}
          placeholder="username"
          value={user?.username}
          onChange={handleUsernameChange}
        />
        <Input
          type="email"
          placeholder="email"
          className="w-full p-4 max-w-md mb-4"
          value={user?.email}
          onChange={handleEmailChange}
        />
        <Input
          type="password"
          placeholder="new password"
          className="w-full p-4 max-w-md mb-4"
          value={user?.password}
          onChange={handlePasswordChange}
        />
        <Input
          type="password"
          placeholder="confirm new password"
          className="w-full p-4 max-w-md"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <div className="w-full flex flex-col">
        <PrimaryButton className="mb-5" type="submit">
          UPDATE
        </PrimaryButton>
        {children}
      </div>
      {isLoading && <LoadingSpinner />}
    </form>
  );
};

UserForm.propTypes = formProps;
