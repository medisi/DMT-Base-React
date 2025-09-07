import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticate } from './api'; // Импортируйте функцию для авторизации

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('access');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username, password) => {
      const token = await authenticate(username, password);
      if (token) {
          setToken(token);
          setIsAuthenticated(true);
          localStorage.setItem('access', token);
      } else {
          throw new Error('Invalid credentials'); // Выбрасываем ошибку, если авторизация не удалась
      }
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('access');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};