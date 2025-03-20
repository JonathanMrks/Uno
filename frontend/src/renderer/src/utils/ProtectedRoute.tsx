import { Navigate } from "react-router-dom";
import { ComponentProps } from "react";
import Cookies from "js-cookie";

export const ProtectedRoute = ({ element }: ComponentProps<any>) => {
  const auth = localStorage.getItem("token")?.toString();

  if (!auth) {
    return <Navigate to="/" />;
  }

  return element;
};
