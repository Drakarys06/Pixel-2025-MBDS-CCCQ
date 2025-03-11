import React, { createContext, useState, useEffect, useContext } from 'react';

// Types pour notre contexte
type UserType = {
  id: string;
  username: string;
} | null;

type AuthContextType = {
  currentUser: UserType;
  isLoggedIn: boolean;
  login: (token: string, userId: string, username: string) => void;
  logout: () => void;
  loading: boolean;
};

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Composant Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserType>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Vérifier si l'utilisateur est connecté au chargement initial
  useEffect(() => {
    const checkLoggedIn = () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const username = localStorage.getItem('username');

      if (token && userId && username) {
        setCurrentUser({
          id: userId,
          username: username
        });
        setIsLoggedIn(true);
      }
      
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Fonction de connexion
  const login = (token: string, userId: string, username: string) => {
    console.log('Login called with:', { token, userId, username });
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    
    setCurrentUser({
      id: userId,
      username: username
    });
    setIsLoggedIn(true);
    
    console.log('Auth state after login:', { isLoggedIn: true, currentUser: { id: userId, username } });
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoggedIn, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export default AuthContext;