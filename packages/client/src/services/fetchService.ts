/**
 * Service pour effectuer des requêtes fetch avec authentification
 * Utile si vous utilisez fetch plutôt qu'axios dans certaines parties de votre application
 */

// Fonction helper pour ajouter le token d'authentification aux requêtes fetch
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'La requête a échoué');
  }

  return response.json();
};

// Méthodes HTTP courantes
const fetchService = {
  get: (url: string) => fetchWithAuth(url),

  post: (url: string, data: any) => fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  put: (url: string, data: any) => fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (url: string) => fetchWithAuth(url, {
    method: 'DELETE'
  })
};

export default fetchService;
