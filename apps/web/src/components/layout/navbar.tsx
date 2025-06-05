'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  BarChart3, 
  Shield, 
  Users, 
  ShoppingBag, 
  Music, 
  CalendarDays,
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown,
  Search
} from 'lucide-react';
import { useTenant } from '@/app/providers';

// Types pour les modules
type ModuleType = {
  id: string;
  name: string;
  path: string;
  icon: React.ReactNode;
  isActive: boolean;
};

// Données des modules
const modules: ModuleType[] = [
  {
    id: 'stageplanner',
    name: 'STAGE',
    path: '/stageplanner',
    icon: <Calendar className="h-5 w-5" />,
    isActive: true
  },
  {
    id: 'barplanner',
    name: 'BAR',
    path: '/barplanner',
    icon: <BarChart3 className="h-5 w-5" />,
    isActive: false
  },
  {
    id: 'secureplanner',
    name: 'SÉCURITÉ',
    path: '/secureplanner',
    icon: <Shield className="h-5 w-5" />,
    isActive: false
  },
  {
    id: 'cleanplanner',
    name: 'NETTOYAGE',
    path: '/cleanplanner',
    icon: <Users className="h-5 w-5" />,
    isActive: false
  },
  {
    id: 'commercantsplanner',
    name: 'COMMERÇANTS',
    path: '/commercantsplanner',
    icon: <ShoppingBag className="h-5 w-5" />,
    isActive: false
  },
  {
    id: 'festivalplanner',
    name: 'FESTIVAL',
    path: '/festivalplanner',
    icon: <Music className="h-5 w-5" />,
    isActive: false
  },
  {
    id: 'lifeplanner',
    name: 'LIFE',
    path: '/lifeplanner',
    icon: <CalendarDays className="h-5 w-5" />,
    isActive: false
  }
];

// Notifications fictives
const mockNotifications = [
  {
    id: '1',
    title: 'Nouvel événement assigné',
    message: 'Vous avez été assigné à l\'événement "Concert Rock - Les Indomptables"',
    time: '5 min',
    isRead: false
  },
  {
    id: '2',
    title: 'Changement de planning',
    message: 'Le planning de l\'événement "Festival Électro" a été modifié',
    time: '1 heure',
    isRead: false
  },
  {
    id: '3',
    title: 'Rappel',
    message: 'Événement "Théâtre - Le Misanthrope" commence dans 2 jours',
    time: '3 heures',
    isRead: true
  }
];

export default function Navbar() {
  const pathname = usePathname();
  const { isModuleAvailable } = useTenant();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const [searchQuery, setSearchQuery] = useState('');

  // Effet pour détecter le scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Fermer les menus lorsque l'utilisateur clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#user-menu') && !target.closest('#user-menu-button')) {
        setIsUserMenuOpen(false);
      }
      if (!target.closest('#notifications-menu') && !target.closest('#notifications-button')) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Marquer une notification comme lue
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  // Nombre de notifications non lues
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      {/* Navbar principale */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'glassmorphism-dark border-b border-white/10 py-2' 
            : 'bg-transparent py-4'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo et nom */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative w-10 h-10 bg-gradient-primary rounded-lg shadow-neon-purple flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 opacity-50 blur-sm -z-10"></div>
              </div>
              <span className="text-xl font-bold text-gradient-primary hidden sm:inline-block">PLANNER Suite</span>
            </Link>

            {/* Navigation - version desktop */}
            <div className="hidden md:flex items-center space-x-1">
              {modules.map((module) => {
                const isActive = pathname.includes(module.path);
                const isAvailable = module.isActive && isModuleAvailable(module.id);
                
                return (
                  <Link
                    key={module.id}
                    href={isAvailable ? module.path : '#'}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                      isActive 
                        ? 'bg-primary-900/50 text-primary-300 shadow-neon-purple' 
                        : 'text-gray-300 hover:bg-white/5'
                    } ${!isAvailable && 'opacity-50 cursor-not-allowed'}`}
                    onClick={(e) => !isAvailable && e.preventDefault()}
                  >
                    {module.icon}
                    <span className="ml-2">{module.name}</span>
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-primary"
                        layoutId="navbar-active-indicator"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Actions - version desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Recherche */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 glassmorphism border border-white/10 rounded-full text-sm focus:border-primary-500 focus:ring-primary-500 w-48"
                />
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  id="notifications-button"
                  className="p-2 rounded-full hover:bg-white/5 text-gray-300 hover:text-white relative"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
                  )}
                </button>

                {/* Menu notifications */}
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      id="notifications-menu"
                      className="absolute right-0 mt-2 w-80 glassmorphism-dark border border-white/10 rounded-lg shadow-lg py-1 z-50"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-4 py-2 border-b border-white/10">
                        <h3 className="text-sm font-medium text-white">Notifications</h3>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-white/5 cursor-pointer ${
                                !notification.isRead ? 'bg-primary-900/20' : ''
                              }`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-white">{notification.title}</p>
                                <p className="text-xs text-gray-400">{notification.time}</p>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-400">Aucune notification</p>
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-white/10">
                        <button className="text-xs text-primary-400 hover:text-primary-300 w-full text-center">
                          Voir toutes les notifications
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menu utilisateur */}
              <div className="relative">
                <button
                  id="user-menu-button"
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-white/5"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-white text-sm font-medium">DM</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* Menu déroulant utilisateur */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      id="user-menu"
                      className="absolute right-0 mt-2 w-48 glassmorphism-dark border border-white/10 rounded-lg shadow-lg py-1 z-50"
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-medium text-white">David Marchand</p>
                        <p className="text-xs text-gray-400 truncate">david@example.com</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profil
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Paramètres
                      </Link>
                      <button
                        className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                        onClick={() => {
                          // Logique de déconnexion
                          localStorage.removeItem('user');
                          window.location.href = '/auth/login';
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Menu hamburger - version mobile */}
            <div className="md:hidden">
              <button
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="md:hidden glassmorphism-dark border-t border-white/10"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {modules.map((module) => {
                  const isActive = pathname.includes(module.path);
                  const isAvailable = module.isActive && isModuleAvailable(module.id);
                  
                  return (
                    <Link
                      key={module.id}
                      href={isAvailable ? module.path : '#'}
                      className={`block px-3 py-2 rounded-md text-base font-medium ${
                        isActive 
                          ? 'bg-primary-900/50 text-primary-300' 
                          : 'text-gray-300 hover:bg-white/5'
                      } ${!isAvailable && 'opacity-50 cursor-not-allowed'}`}
                      onClick={(e) => !isAvailable && e.preventDefault()}
                    >
                      <div className="flex items-center">
                        {module.icon}
                        <span className="ml-3">{module.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              
              <div className="pt-4 pb-3 border-t border-white/10">
                <div className="flex items-center px-5">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-white text-sm font-medium">DM</span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">David Marchand</div>
                    <div className="text-sm text-gray-400">david@example.com</div>
                  </div>
                  <button
                    className="ml-auto p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/5"
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-background"></span>
                    )}
                  </button>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link
                    href="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5"
                  >
                    Profil
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-white/5"
                  >
                    Paramètres
                  </Link>
                  <button
                    className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-white/5"
                    onClick={() => {
                      // Logique de déconnexion
                      localStorage.removeItem('user');
                      window.location.href = '/auth/login';
                    }}
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      
      {/* Espace pour éviter que le contenu ne soit caché sous la navbar */}
      <div className={`h-16 ${isScrolled ? 'h-14' : 'h-20'}`}></div>
    </>
  );
}
