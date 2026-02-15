import React, { createContext, useContext, useState, ReactNode } from "react";

interface DemoUser {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "doctor" | "user";
  doctor_id: string | null;
}

interface DemoAuthContextType {
  user: DemoUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string) => void;
  signOut: () => void;
}

const DemoAuthContext = createContext<DemoAuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  signIn: () => {},
  signOut: () => {},
});

const DEMO_USER: DemoUser = {
  id: "demo-user-1",
  email: "demo@perfectsmileglim.demo",
  display_name: "Utilizator Demo",
  role: "admin",
  doctor_id: "doc-1",
};

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);

  const signIn = (_username: string, _password: string) => {
    setUser(DEMO_USER);
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <DemoAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        signIn,
        signOut,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth() {
  return useContext(DemoAuthContext);
}
