import React, { createContext, useContext, useState } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
  signIn: () => Promise<void>;
}

const defaultUser: User = {
  id: '1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin'
};

const AuthContext = createContext<AuthContextType>({
  user: defaultUser,
  signOut: async () => {},
  signIn: async () => {}
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(defaultUser);

  const signOut = async () => {
    setUser(null);
  };

  const signIn = async () => {
    setUser(defaultUser);
  };

  return (
    <AuthContext.Provider value={{ user, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
