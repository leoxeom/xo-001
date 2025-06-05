'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, LogIn, ChevronRight, Lock, Mail } from 'lucide-react';

// Schéma de validation Zod
const loginSchema = z.object({
  email: z.string().email('Email invalide').min(1, 'Email requis'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      // Simuler un appel API pour la V1
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Dans une implémentation réelle, on ferait un appel à l'API
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      
      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'Erreur de connexion');
      // }
      
      // Pour la V1, on simule une connexion réussie
      // et on stocke les données utilisateur dans localStorage
      const mockUserData = {
        id: '1',
        email: data.email,
        name: 'Utilisateur Test',
        roles: ['user'],
        permissions: ['stageplanner:read', 'stageplanner:write'],
      };
      
      localStorage.setItem('user', JSON.stringify(mockUserData));
      
      // Redirection vers la page d'accueil
      router.push('/');
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      setAuthError(error.message || 'Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Effet de lumière d'ambiance */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background-lighter" />
        <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-primary-900/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-secondary-900/20 rounded-full blur-3xl" />
      </div>
      
      {/* Logo et titre */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-bold text-gradient-primary mb-2">PLANNER Suite</h1>
        <p className="text-gray-400">Connexion à votre espace</p>
      </motion.div>
      
      {/* Carte de connexion avec effet glassmorphism */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md"
      >
        <div className="relative">
          {/* Effet de bordure néon */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg opacity-50 blur-sm"></div>
          
          {/* Carte principale */}
          <div className="glassmorphism-dark relative rounded-lg shadow-xl p-8 border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-900/20 rounded-full blur-xl -z-10"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-900/20 rounded-full blur-xl -z-10"></div>
            
            {/* Formulaire */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Affichage des erreurs d'authentification */}
              {authError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-md bg-red-900/30 border border-red-500/50 text-red-200 text-sm"
                >
                  <p>{authError}</p>
                </motion.div>
              )}
              
              {/* Champ Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-200">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                    className={`block w-full pl-10 glassmorphism border ${
                      errors.email ? 'border-red-500' : 'border-white/10'
                    } rounded-md py-3 text-white bg-white/5 focus:border-primary-500 focus:ring-primary-500`}
                    placeholder="votre@email.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>
              
              {/* Champ Mot de passe */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-200">
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...register('password')}
                    className={`block w-full pl-10 pr-10 glassmorphism border ${
                      errors.password ? 'border-red-500' : 'border-white/10'
                    } rounded-md py-3 text-white bg-white/5 focus:border-primary-500 focus:ring-primary-500`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-white focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>
              
              {/* Option Se souvenir de moi */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    {...register('rememberMe')}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-primary-500 focus:ring-primary-500"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-300">
                    Se souvenir de moi
                  </label>
                </div>
                <div className="text-sm">
                  <Link
                    href="/auth/reset-password"
                    className="text-primary-400 hover:text-primary-300 hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
              </div>
              
              {/* Bouton de connexion */}
              <div>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Se connecter
                    </>
                  )}
                </motion.button>
              </div>
            </form>
            
            {/* Lien vers l'inscription */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                Vous n'avez pas de compte ?{' '}
                <Link
                  href="/auth/register"
                  className="text-primary-400 hover:text-primary-300 hover:underline inline-flex items-center"
                >
                  S'inscrire
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
