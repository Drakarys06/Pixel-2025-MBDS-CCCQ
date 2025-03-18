import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  userId: string;
  username: string;
}

export interface AuthCheckResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    pixelsPlaced: number;
    boardsCreated: number;
    isGuest?: boolean;
  };
}

// Flag pour éviter d'ajouter les intercepteurs plusieurs fois
let interceptorsSetup = false;

/**
 * Service d'authentification pour gérer les appels API liés à l'authentification
 */
const authService = {
  /**
   * Vérifie la validité du token de l'utilisateur auprès du serveur
   */
  checkAuthStatus: async (): Promise<AuthCheckResponse> => {
    const token = localStorage.getItem('token');

    if (!token) {
      return { success: false, message: 'No token found' };
    }

    try {
      const response = await axios.get(`${API_URL}/auth/verify`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data as AuthCheckResponse;
    } catch (error: any) {
      // Si le token est invalide ou expiré, nettoyer le localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');

      return { success: false, message: 'Invalid or expired token' };
    }
  },

  /**
   * Connecte un utilisateur et retourne les données de connexion
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      return response.data as LoginResponse;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Erreur de connexion');
      }
      throw new Error('Erreur de connexion au serveur');
    }
  },

  /**
   * Connecte l'utilisateur en tant que visiteur
   */
  guestLogin: async (): Promise<LoginResponse> => {
    const guestToken = 'guest-' + Math.random().toString(36).substring(2, 15);
    const guestId = guestToken;
    return {
      success: true,
      message: 'Connecté en tant que visiteur',
      token: guestToken,
      userId: guestId,
      username: 'Visiteur'
    };
  },

  /**
   * Vérifie si l'utilisateur est en mode visiteur
   */
  isGuestMode: (): boolean => {
    const token = localStorage.getItem('token');
    return token ? token.startsWith('guest-') : false;
  },
  /**
   * Inscrit un nouvel utilisateur
   */
  signup: async (username: string, email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post(`${API_URL}/auth/signup`, {
        username,
        email,
        password
      });
      return response.data as LoginResponse;
    } catch (error: any) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Erreur d\'inscription');
      }
      throw new Error('Erreur de connexion au serveur');
    }
  },
  /**
   * Ajoute les headers d'authentification aux requêtes axios
   */
  getAuthHeader: () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
  /**
   * Configure axios avec un intercepteur pour ajouter automatiquement 
   * le token d'authentification à toutes les requêtes
   */
  setupAxiosInterceptors: () => {
    // Éviter d'ajouter les intercepteurs plusieurs fois
    if (interceptorsSetup) return;
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    // Intercepteur pour gérer automatiquement les erreurs 401 (non autorisé)
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Si le serveur répond avec 401, le token est invalide ou expiré
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          // Rediriger vers la page de connexion
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
    interceptorsSetup = true;
  }
};

export default authService;