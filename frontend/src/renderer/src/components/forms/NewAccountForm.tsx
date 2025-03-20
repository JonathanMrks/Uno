import { useState } from "react";
import { LoadingSpinner, PrimaryButton, Input } from "@/components";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { atom, useAtom } from "jotai";
import { formProps } from "./index";

const usernameAtom = atom("");
const emailAtom = atom("");
const passwordAtom = atom("");
const confirmPasswordAtom = atom("");

export const NewAccountForm = ({ onSubmit, children }) => {
  const [username, setUsername] = useAtom(usernameAtom);
  const [email, setEmail] = useAtom(emailAtom);
  const [password, setPassword] = useAtom(passwordAtom);
  const [confirmPassword, setConfirmPassword] = useAtom(confirmPasswordAtom);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.warning("The passwords are not equal.");
      return;
    }

    const response = await onSubmit({ username, email, password });

    if ("error" in response) {
      setIsLoading(false);
      toast.error(response.error);
      return;
    }

    setIsLoading(false);
    toast.success("User registered sucefully!");
    navigate("/");
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
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          type="email"
          placeholder="email"
          className="w-full p-4 max-w-md mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          placeholder="password"
          className="w-full p-4 max-w-md mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          type="password"
          placeholder="confirm password"
          className="w-full p-4 max-w-md"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <div className="w-full flex flex-col">
        <PrimaryButton className="mb-10" type="submit">
          CREATE ACCOUNT
        </PrimaryButton>
        {children}
      </div>
      {isLoading && <LoadingSpinner />}
    </form>
  );
};

NewAccountForm.propTypes = formProps;
