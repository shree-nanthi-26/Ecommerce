import { createContext, useContext, useMemo, useState } from "react";
import {
  loginUser as loginService,
  registerUser as registerService,
  resendVerificationEmail as resendService,
  validate2FALogin as validate2FALoginService,
} from "../services/authService";

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = "furniva_user";
const LEGACY_STORAGE_KEY = "electromart_user";

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    let storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedUser) {
      storedUser = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (storedUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, storedUser);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const saveUser = (userData) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setUser(userData);
  };

  const login = async (email, password) => {
    const data = await loginService(email, password);
    if (!data.require2FA) {
      saveUser(data);
    }
    return data;
  };

  const complete2FALogin = async (tempToken, code, recoveryCode) => {
    const data = await validate2FALoginService(tempToken, code, recoveryCode);
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
    () => ({
      user,
      login,
      complete2FALogin,
      saveUser,
      register,
      markVerified,
      resendVerification,
      logout,
    }),
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
