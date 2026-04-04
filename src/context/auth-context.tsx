import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setUnauthorizedHandler } from "@/lib/api";

interface AuthContextValue {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "necko3_api_key";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(() =>
    sessionStorage.getItem(STORAGE_KEY),
  );

  const setApiKey = useCallback((key: string) => {
    sessionStorage.setItem(STORAGE_KEY, key);
    setApiKeyState(key);
  }, []);

  const clearApiKey = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setApiKeyState(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearApiKey);
    return () => setUnauthorizedHandler(null);
  }, [clearApiKey]);

  const value = useMemo(
    () => ({ apiKey, setApiKey, clearApiKey }),
    [apiKey, setApiKey, clearApiKey],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
