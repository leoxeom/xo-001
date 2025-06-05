import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Types pour les réponses API
export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Configuration de base de l'API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
const API_TIMEOUT = 30000; // 30 secondes

// Création de l'instance axios
const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_URL}/${API_VERSION}`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Intercepteur pour les requêtes - Ajoute le token JWT et les informations tenant
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig): AxiosRequestConfig => {
    // Récupérer le token JWT du localStorage (ou autre stockage)
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    // Si un token existe, l'ajouter aux headers
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
    
    // Ajouter l'information de tenant basée sur le sous-domaine
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      // Format attendu: {tenant}.planner-suite.app
      if (hostname.includes('.') && !['www', 'app', 'api', 'admin'].includes(hostname.split('.')[0])) {
        const tenant = hostname.split('.')[0];
        config.headers = {
          ...config.headers,
          'X-Tenant-ID': tenant,
        };
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses - Gestion des erreurs
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError) => {
    const { response } = error;
    
    // Erreur de réseau ou timeout
    if (!response) {
      return Promise.reject({
        status: 0,
        message: 'Erreur de connexion au serveur. Veuillez vérifier votre connexion internet.',
      });
    }
    
    // Erreur d'authentification (401)
    if (response.status === 401) {
      // Si le token est expiré, on peut essayer de le rafraîchir
      // Pour la V1, on déconnecte simplement l'utilisateur
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        // Rediriger vers la page de connexion si on n'y est pas déjà
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login';
        }
      }
    }
    
    // Erreur d'autorisation (403)
    if (response.status === 403) {
      // On peut rediriger vers une page d'erreur 403 ou afficher un message
      console.error('Accès non autorisé');
    }
    
    // Formater l'erreur pour qu'elle soit plus facile à utiliser
    const apiError: ApiError = {
      status: response.status,
      message: response.data?.message || 'Une erreur est survenue',
      errors: response.data?.errors,
    };
    
    return Promise.reject(apiError);
  }
);

// Fonctions utilitaires pour les appels API
export const api = {
  /**
   * Effectue une requête GET
   * @param url - L'URL de la requête
   * @param config - Configuration additionnelle pour axios
   * @returns Promise avec les données de la réponse
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data.data;
  },
  
  /**
   * Effectue une requête POST
   * @param url - L'URL de la requête
   * @param data - Les données à envoyer
   * @param config - Configuration additionnelle pour axios
   * @returns Promise avec les données de la réponse
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },
  
  /**
   * Effectue une requête PUT
   * @param url - L'URL de la requête
   * @param data - Les données à envoyer
   * @param config - Configuration additionnelle pour axios
   * @returns Promise avec les données de la réponse
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },
  
  /**
   * Effectue une requête DELETE
   * @param url - L'URL de la requête
   * @param config - Configuration additionnelle pour axios
   * @returns Promise avec les données de la réponse
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  },
  
  /**
   * Effectue une requête PATCH
   * @param url - L'URL de la requête
   * @param data - Les données à envoyer
   * @param config - Configuration additionnelle pour axios
   * @returns Promise avec les données de la réponse
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },
  
  /**
   * Récupère l'instance axios configurée pour des cas d'utilisation avancés
   */
  getInstance(): AxiosInstance {
    return apiClient;
  },
};

// Services API spécifiques aux modules
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  register: (userData: any) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  resetPassword: (email: string) => api.post('/auth/reset-password', { email }),
  updatePassword: (token: string, password: string) => api.post('/auth/update-password', { token, password }),
};

export const stagePlannerApi = {
  getEvents: () => api.get('/stageplanner/events'),
  getEvent: (id: string) => api.get(`/stageplanner/events/${id}`),
  createEvent: (eventData: any) => api.post('/stageplanner/events', eventData),
  updateEvent: (id: string, eventData: any) => api.put(`/stageplanner/events/${id}`, eventData),
  deleteEvent: (id: string) => api.delete(`/stageplanner/events/${id}`),
  
  getTeams: (eventId: string) => api.get(`/stageplanner/events/${eventId}/teams`),
  getTeam: (eventId: string, teamId: string) => api.get(`/stageplanner/events/${eventId}/teams/${teamId}`),
  createTeam: (eventId: string, teamData: any) => api.post(`/stageplanner/events/${eventId}/teams`, teamData),
  updateTeam: (eventId: string, teamId: string, teamData: any) => api.put(`/stageplanner/events/${eventId}/teams/${teamId}`, teamData),
  deleteTeam: (eventId: string, teamId: string) => api.delete(`/stageplanner/events/${eventId}/teams/${teamId}`),
};

export default api;
