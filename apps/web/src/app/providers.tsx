'use client';

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';

// Contexte pour le multi-tenant
type TenantContextType = {
  currentTenant: string;
  setCurrentTenant: (tenant: string) => void;
  availableModules: string[];
  isModuleAvailable: (moduleName: string) => boolean;
};

const defaultTenantContext: TenantContextType = {
  currentTenant: 'default',
  setCurrentTenant: () => {},
  availableModules: ['stageplanner'],
  isModuleAvailable: () => false,
};

const TenantContext = createContext<TenantContextType>(defaultTenantContext);

export const useTenant = () => useContext(TenantContext);

// Contexte pour l'authentification personnalisée
type AuthContextType = {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRoles: string[];
  hasPermission: (permission: string) => boolean;
};

const defaultAuthContext: AuthContextType = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  userRoles: [],
  hasPermission: () => false,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

// Provider pour l'authentification
function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des données utilisateur
    const loadUserData = async () => {
      try {
        // Dans une implémentation réelle, cela ferait un appel API
        // pour récupérer les données utilisateur
        setIsLoading(true);
        
        // Simulation d'un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Pour la V1, on utilise des données fictives
        // À remplacer par un vrai appel API
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        userRoles: user?.roles || [],
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Provider pour le multi-tenant
function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState('default');
  const [availableModules, setAvailableModules] = useState(['stageplanner']);

  useEffect(() => {
    // Détecter le tenant basé sur le sous-domaine
    const detectTenant = () => {
      if (typeof window === 'undefined') return;

      const hostname = window.location.hostname;
      
      // Logique pour extraire le tenant du sous-domaine
      // Format attendu: {tenant}.planner-suite.app
      if (hostname.includes('.')) {
        const subdomain = hostname.split('.')[0];
        
        // Ignorer les subdomains communs comme "www" ou "app"
        if (!['www', 'app', 'api', 'admin'].includes(subdomain)) {
          setCurrentTenant(subdomain);
          
          // Dans une implémentation réelle, on chargerait les modules disponibles
          // pour ce tenant depuis l'API
          // Pour la V1, on simule cela
          setAvailableModules(['stageplanner', 'barplanner']);
        }
      }
    };

    detectTenant();
  }, []);

  // Vérifier si un module est disponible pour le tenant actuel
  const isModuleAvailable = (moduleName: string): boolean => {
    return availableModules.includes(moduleName.toLowerCase());
  };

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        setCurrentTenant,
        availableModules,
        isModuleAvailable,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

// Composant principal qui regroupe tous les providers
export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem={false}
        themes={['light', 'dark']}
      >
        <TenantProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </TenantProvider>
      </NextThemesProvider>
    </SessionProvider>
  );
}
