// AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../../services/authService';

// Types pour notre contexte
type UserType = {
  id: string;
  username: string;
  isGuest?: boolean;
  roles: string[];
  permissions: string[];
} | null;

type AuthContextType = {
  currentUser: UserType;
  isLoggedIn: boolean;
  isGuestMode: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  login: (token: string, userId: string, username: string, roles: string[], permissions: string[]) => void;
  loginAsGuest: () => Promise<void>;
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
        const rolesString = localStorage.getItem('roles');
        const permissionsString = localStorage.getItem('permissions');

        if (token && userId && username) {
          // Vérifier si c'est un token visiteur
          const isGuest = token.startsWith('guest-');
          const roles = rolesString ? JSON.parse(rolesString) : [];
          const permissions = permissionsString ? JSON.parse(permissionsString) : [];
          
          if (isGuest) {
            // Visiteur, pas besoin de vérifier avec le serveur
            setCurrentUser({
              id: userId,
              username: username,
              isGuest: true,
              roles: ['guest'],
              permissions: ['board:view', 'pixel:view']
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
                isGuest: false,
                roles: 'roles' in response.user ? response.user.roles : roles,
                permissions: 'permissions' in response.user ? response.user.permissions : permissions
              });
              
              // Mettre à jour les rôles et permissions dans localStorage si fournis par le serveur
              if ('roles' in response.user && response.user.roles) {
                localStorage.setItem('roles', JSON.stringify(response.user.roles));
              }
              
              if (response.user.permissions) {
                localStorage.setItem('permissions', JSON.stringify(response.user.permissions));
              }
              
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
  const login = (
    token: string,
    userId: string,
    username: string,
    roles: string[] = [],
    permissions: string[] = []
  ) => {
    const isGuest = token.startsWith('guest-');
    
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('username', username);
    localStorage.setItem('roles', JSON.stringify(roles));
    localStorage.setItem('permissions', JSON.stringify(permissions));
    
    setCurrentUser({
      id: userId,
      username: username,
      isGuest: isGuest,
      roles,
      permissions
    });
    setIsLoggedIn(true);
    setIsGuestMode(isGuest);
  };

  // Fonction de connexion en tant que visiteur
  const loginAsGuest = async () => {
    try {
      const result = await authService.guestLogin();
      if (result.success) {
        login(
          result.token,
          result.userId,
          result.username,
          ['guest'],
          ['board:view', 'pixel:view']
        );
      } else {
        throw new Error('Échec de la connexion visiteur');
      }
    } catch (error) {
      console.error('Erreur de connexion visiteur:', error);
      throw error; // Propager l'erreur pour que la page de connexion puisse la gérer
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('roles');
    localStorage.removeItem('permissions');
    
    setCurrentUser(null);
    setIsLoggedIn(false);
    setIsGuestMode(false);
    
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  };

  // Fonction pour vérifier si l'utilisateur a une permission
  const hasPermission = (permission: string): boolean => {
    if (!currentUser || !currentUser.permissions) {
      return false;
    }
    return currentUser.permissions.includes(permission);
  };

  // Fonction pour vérifier si l'utilisateur a un rôle
  const hasRole = (role: string): boolean => {
    if (!currentUser || !currentUser.roles) {
      return false;
    }
    return currentUser.roles.includes(role);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isLoggedIn,
      isGuestMode,
      hasPermission,
      hasRole,
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

// Hooks spécifiques pour les permissions et rôles
export const usePermission = (permission: string) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

export const useRole = (role: string) => {
  const { hasRole } = useAuth();
  return hasRole(role);
};

export default AuthContext;