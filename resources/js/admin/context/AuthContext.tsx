import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authService, AdminUser } from "@/api/authService";
import Login from "@/pages/Login";

type AuthContextValue = {
  user: AdminUser;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthGate");
  return ctx;
};

export function AuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    authService
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  // Any API call returning 401 (expired session) drops back to the login screen
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("admin:unauthorized", onUnauthorized);
    return () => window.removeEventListener("admin:unauthorized", onUnauthorized);
  }, []);

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>;
}
