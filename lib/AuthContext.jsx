'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function AuthProvider({ children }) {
  const [isObserver, setIsObserver] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authed = localStorage.getItem('lcc_authed') === 'true';
    const loginTime = parseInt(localStorage.getItem('lcc_login_time') || '0', 10);
    const expired = Date.now() - loginTime > SESSION_DURATION_MS;

    if (authed && expired) {
      // Session expired — clear everything
      localStorage.removeItem('lcc_authed');
      localStorage.removeItem('lcc_observer');
      localStorage.removeItem('lcc_login_time');
    } else {
      setIsObserver(localStorage.getItem('lcc_observer') === 'true');
      setIsAuthenticated(authed && !expired);
    }
  }, []);

  const subscribe = () => {
    setIsObserver(true);
    localStorage.setItem('lcc_observer', 'true');
  };

  const login = (email) => {
    setIsAuthenticated(true);
    setIsObserver(true);
    localStorage.setItem('lcc_authed', 'true');
    localStorage.setItem('lcc_observer', 'true');
    localStorage.setItem('lcc_login_time', Date.now().toString());
    // Tag in Observers audience
    if (email) {
      fetch('/api/observer-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {});
    }
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
