import { createContext, useContext, useMemo, useState } from "react";
import { loginUser as loginService, registerUser as registerService } from "../services/authService";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("electromart_user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const saveUser = (userData) => {
    localStorage.setItem("electromart_user", JSON.stringify(userData));
    setUser(userData);
  };

  const login = async (email, password) => {
    const data = await loginService(email, password);
    saveUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await registerService(name, email, password);
    saveUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("electromart_user");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthProvider, useAuth };
