import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

// Types pour l'utilisateur et les permissions
export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  tenantId?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (token: string, password: string) => Promise<void>;
  clearError: () => void;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (permission: string | string[]) => boolean;
}

// Valeurs par défaut pour le contexte
const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  resetPassword: async () => {},
  updatePassword: async () => {},
  clearError: () => {},
  hasRole: () => false,
  hasPermission: () => false,
};

// Création du contexte d'authentification
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Provider pour le contexte d'authentification
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Vérifier si un token existe dans le localStorage
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Récupérer les informations de l'utilisateur depuis l'API
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (err: any) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
        // En cas d'erreur, on supprime le token qui pourrait être invalide
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Fonction de connexion
  const login = async (email: string, password: string, rememberMe = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Appel à l'API pour se connecter
      const response = await authApi.login(email, password);
      
      // Stocker le token JWT dans le localStorage
      if (response && response.token) {
        localStorage.setItem('auth_token', response.token);
        
        // Si "se souvenir de moi" est activé, on peut définir une date d'expiration plus longue
        if (rememberMe) {
          // Logique pour prolonger la session (à implémenter côté serveur)
        }
        
        // Récupérer les informations de l'utilisateur
        setUser(response.user);
        
        // Rediriger vers la page d'accueil ou la dernière page visitée
        router.push('/');
      } else {
        throw new Error('Token d\'authentification manquant dans la réponse');
      }
    } catch (err: any) {
      console.error('Erreur lors de la connexion:', err);
      setError(err.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Appel à l'API pour se déconnecter (invalidation du token côté serveur)
      await authApi.logout();
    } catch (err) {
      console.error('Erreur lors de la déconnexion:', err);
    } finally {
      // Même en cas d'erreur, on supprime le token et l'utilisateur localement
      localStorage.removeItem('auth_token');
      setUser(null);
      setIsLoading(false);
      
      // Rediriger vers la page de connexion
      router.push('/auth/login');
    }
  };

  // Fonction d'inscription
  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Appel à l'API pour créer un compte
      const response = await authApi.register(userData);
      
      // Si l'inscription réussit et renvoie un token, connecter automatiquement l'utilisateur
      if (response && response.token) {
        localStorage.setItem('auth_token', response.token);
        setUser(response.user);
        router.push('/');
      } else {
        // Sinon, rediriger vers la page de connexion
        router.push('/auth/login');
      }
    } catch (err: any) {
      console.error('Erreur lors de l\'inscription:', err);
      setError(err.message || 'Erreur lors de la création du compte. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de réinitialisation de mot de passe
  const resetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Appel à l'API pour demander une réinitialisation de mot de passe
      await authApi.resetPassword(email);
    } catch (err: any) {
      console.error('Erreur lors de la demande de réinitialisation:', err);
      setError(err.message || 'Erreur lors de la demande de réinitialisation. Veuillez réessayer.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de mise à jour du mot de passe
  const updatePassword = async (token: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Appel à l'API pour mettre à jour le mot de passe
      await authApi.updatePassword(token, password);
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du mot de passe:', err);
      setError(err.message || 'Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour effacer les erreurs
  const clearError = () => {
    setError(null);
  };

  // Vérifier si l'utilisateur a un rôle spécifique
  const hasRole = (role: string | string[]): boolean => {
    if (!user || !user.roles || user.roles.length === 0) return false;
    
    if (Array.isArray(role)) {
      return role.some(r => user.roles.includes(r));
    }
    
    return user.roles.includes(role);
  };

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permission: string | string[]): boolean => {
    if (!user || !user.permissions || user.permissions.length === 0) return false;
    
    if (Array.isArray(permission)) {
      return permission.some(p => user.permissions.includes(p));
    }
    
    return user.permissions.includes(permission);
  };

  // Valeur du contexte
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    register,
    resetPassword,
    updatePassword,
    clearError,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

export default useAuth;
