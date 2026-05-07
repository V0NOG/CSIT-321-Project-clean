// frontend/src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { initUserKeypair } from "../crypto/asymmetric";
import { getMyKeys, rotateKeys } from "../api/keysApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  useEffect(() => {
    if (!token) return;
    axios
      .get("http://localhost:5050/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        // Ensure RSA keypair is initialized for ZK sharing
        initUserKeypair(getMyKeys, rotateKeys).catch((e) =>
          console.warn("[keypair init]", e)
        );
      })
      .catch((err) => {
        console.warn("Auth /me failed", err?.response?.status, err?.response?.data);
        localStorage.removeItem("token");
        setToken("");
        setUser(null);
      });
  }, [token]);

  const login = (newToken, newUser) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(newUser || null);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);