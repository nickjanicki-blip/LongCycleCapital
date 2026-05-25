'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isObserver, setIsObserver] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsObserver(localStorage.getItem('lcc_observer') === 'true');
    setIsAuthenticated(localStorage.getItem('lcc_authed') === 'true');
  }, []);

  const subscribe = () => {
    setIsObserver(true);
    localStorage.setItem('lcc_observer', 'true');
  };

  const login = () => {
    setIsAuthenticated(true);
    setIsObserver(true);
    localStorage.setItem('lcc_authed', 'true');
    localStorage.setItem('lcc_observer', 'true');
  };

  return (
    <AuthContext.Provider value={{ isObserver, isAuthenticated, subscribe, login }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
