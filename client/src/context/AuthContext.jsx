import { createContext, useContext, useMemo, useState } from "react";
import { loginUser as loginService, registerUser as registerService, resendVerificationEmail as resendService } from "../services/authService";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = "furniva_user";
const LEGACY_STORAGE_KEY = "electromart_user"; // Legacy compatibility migration key

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser =
      localStorage.getItem(AUTH_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const saveUser = (userData) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
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

  const markVerified = () => {
    if (user) {
      const updated = { ...user, isVerified: true };
      saveUser(updated);
    }
  };

  const resendVerification = async () => {
    return await resendService();
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, login, register, markVerified, resendVerification, logout }),
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
