import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

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
          // Vérifier auprès du serveur si le token est valide
          const response = await authService.checkAuthStatus();
          
          if (response.success && response.user) {
            setCurrentUser({
              id: response.user.id,
              username: response.user.username
            });
            setIsLoggedIn(true);
          } else {
            // Token invalide ou expiré
            logout();
          }
        } else {
          setIsLoggedIn(false);
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
        setIsLoggedIn(false);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  // Fonction de connexion
  const login = (token: string, userId: string, username: string) => {
    console.log('Login called with:', { token: token.substring(0, 10) + '...', userId, username });
    
    // Utiliser localStorage pour stocker les informations d'authentification
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    
    setCurrentUser({
      id: userId,
      username: username
    });
    setIsLoggedIn(true);
  };

  // Fonction de déconnexion
  const logout = () => {
    console.log('Déconnexion de l\'utilisateur');
    
    // Supprimer les données de localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    
    // Mettre à jour l'état du contexte
    setCurrentUser(null);
    setIsLoggedIn(false);
    
    // Rediriger vers la page d'accueil ou de connexion
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isLoggedIn, 
      login, 
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