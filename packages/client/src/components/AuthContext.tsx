import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// Types pour notre contexte
type UserType = {
  id: string;
  username: string;
  isGuest?: boolean;
} | null;

type AuthContextType = {
  currentUser: UserType;
  isLoggedIn: boolean;
  isGuestMode: boolean;
  login: (token: string, userId: string, username: string) => void;
  loginAsGuest: () => void;
  logout: () => void;
  loading: boolean;
};

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Composant Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserType>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Configurer les intercepteurs axios pour la gestion automatique des tokens
  useEffect(() => {
    authService.setupAxiosInterceptors();
  }, []);

  // Vérifier si l'utilisateur est connecté au chargement initial
  useEffect(() => {
    const checkLoggedIn = async () => {
      setLoading(true);
      
      try {
        // Vérifier le token stocké dans localStorage
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');

        if (token && userId && username) {
          // Vérifier si c'est un token visiteur
          const isGuest = token.startsWith('guest-');
          
          if (isGuest) {
            // Visiteur, pas besoin de vérifier avec le serveur
            setCurrentUser({
              id: userId,
              username: username,
              isGuest: true
            });
            setIsLoggedIn(true);
            setIsGuestMode(true);
          } else {
            // Utilisateur normal, vérifier le token
            const response = await authService.checkAuthStatus();
            
            if (response.success && response.user) {
              setCurrentUser({
                id: response.user.id,
                username: response.user.username,
                isGuest: false
              });
              setIsLoggedIn(true);
              setIsGuestMode(false);
            } else {
              // Token invalide
              logout();
            }
          }
        } else {
          setIsLoggedIn(false);
          setCurrentUser(null);
          setIsGuestMode(false);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
        setIsLoggedIn(false);
        setCurrentUser(null);
        setIsGuestMode(false);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Fonction de connexion
  const login = (token: string, userId: string, username: string) => {
    const isGuest = token.startsWith('guest-');
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    
    setCurrentUser({
      id: userId,
      username: username,
      isGuest: isGuest
    });
    setIsLoggedIn(true);
    setIsGuestMode(isGuest);
  };

  // Fonction de connexion en tant que visiteur
  const loginAsGuest = async () => {
    try {
      const result = await authService.guestLogin();
      if (result.success) {
        login(result.token, result.userId, result.username);
      }
    } catch (error) {
      console.error('Erreur de connexion visiteur:', error);
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsGuestMode(false);
    
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isLoggedIn,
      isGuestMode,
      login, 
      loginAsGuest,
      logout, 
      loading
    }}>
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