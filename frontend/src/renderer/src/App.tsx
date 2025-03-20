import { HashRouter, Route, Routes } from "react-router-dom";
import {
  SignInPage,
  NewAccountPage,
  HomePage,
  LobbyPage,
  GamePage,
  UserPage,
  ScorePage,
} from "@/components";
import { ProtectedRoute } from "@/utils";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SignInPage />} />
        <Route path="/newAccount" element={<NewAccountPage />} />
        <Route
          path="/home"
          element={<ProtectedRoute element={<HomePage />} />}
        />
        <Route
          path="/lobby"
          element={<ProtectedRoute element={<LobbyPage />} />}
        />
        <Route
          path="/user"
          element={<ProtectedRoute element={<UserPage />} />}
        />
        <Route
          path="/game"
          element={<ProtectedRoute element={<GamePage />} />}
        />
        <Route
          path="/scores"
          element={<ProtectedRoute element={<ScorePage />} />}
        />
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </HashRouter>
  );
}

export default App;
