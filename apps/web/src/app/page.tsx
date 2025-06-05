'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Shield, 
  ShoppingBag, 
  Music, 
  Calendar as CalendarIcon, 
  ChevronRight, 
  Clock, 
  Activity 
} from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

// Modules data
const modules = [
  {
    id: 'stageplanner',
    name: 'STAGE PLANNER',
    description: 'Planification d\'événements et gestion des équipes techniques pour spectacles',
    icon: <Calendar className="h-8 w-8 text-primary-400" />,
    color: 'from-primary-600/20 to-primary-900/30',
    textColor: 'text-primary-400',
    borderColor: 'border-primary-500/30',
    active: true,
    comingSoon: false,
    path: '/stageplanner'
  },
  {
    id: 'barplanner',
    name: 'BAR PLANNER',
    description: 'Gestion des équipes de bars, stocks et planning de service',
    icon: <BarChart3 className="h-8 w-8 text-secondary-400" />,
    color: 'from-secondary-600/20 to-secondary-900/30',
    textColor: 'text-secondary-400',
    borderColor: 'border-secondary-500/30',
    active: false,
    comingSoon: true,
    path: '/barplanner'
  },
  {
    id: 'secureplanner',
    name: 'SECURE PLANNER',
    description: 'Planification des équipes de sécurité et gestion des accréditations',
    icon: <Shield className="h-8 w-8 text-tertiary-400" />,
    color: 'from-tertiary-600/20 to-tertiary-900/30',
    textColor: 'text-tertiary-400',
    borderColor: 'border-tertiary-500/30',
    active: false,
    comingSoon: true,
    path: '/secureplanner'
  },
  {
    id: 'cleanplanner',
    name: 'CLEAN PLANNER',
    description: 'Organisation des équipes de nettoyage et suivi des zones',
    icon: <Users className="h-8 w-8 text-cyan-400" />,
    color: 'from-cyan-600/20 to-cyan-900/30',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    active: false,
    comingSoon: true,
    path: '/cleanplanner'
  },
  {
    id: 'commercantsplanner',
    name: 'COMMERÇANTS PLANNER',
    description: 'Gestion des emplacements et planning des commerçants',
    icon: <ShoppingBag className="h-8 w-8 text-amber-400" />,
    color: 'from-amber-600/20 to-amber-900/30',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    active: false,
    comingSoon: true,
    path: '/commercantsplanner'
  },
  {
    id: 'festivalplanner',
    name: 'FESTIVAL PLANNER',
    description: 'Solution complète pour la gestion des festivals multi-scènes',
    icon: <Music className="h-8 w-8 text-pink-400" />,
    color: 'from-pink-600/20 to-pink-900/30',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    active: false,
    comingSoon: true,
    path: '/festivalplanner'
  },
  {
    id: 'lifeplanner',
    name: 'LIFE PLANNER',
    description: 'Agenda personnel intégré avec tous les modules',
    icon: <CalendarIcon className="h-8 w-8 text-green-400" />,
    color: 'from-green-600/20 to-green-900/30',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    active: false,
    comingSoon: true,
    path: '/lifeplanner'
  }
];

// Stats data
const stats = [
  { 
    label: 'Événements planifiés', 
    value: 0, 
    target: 124, 
    icon: <Calendar className="h-5 w-5 text-primary-400" />,
    color: 'text-primary-400' 
  },
  { 
    label: 'Équipes gérées', 
    value: 0, 
    target: 37, 
    icon: <Users className="h-5 w-5 text-secondary-400" />,
    color: 'text-secondary-400' 
  },
  { 
    label: 'Heures planifiées', 
    value: 0, 
    target: 1458, 
    icon: <Clock className="h-5 w-5 text-tertiary-400" />,
    color: 'text-tertiary-400' 
  },
  { 
    label: 'Taux d\'activité', 
    value: 0, 
    target: 89, 
    suffix: '%', 
    icon: <Activity className="h-5 w-5 text-cyan-400" />,
    color: 'text-cyan-400' 
  }
];

export default function Home() {
  const [animatedStats, setAnimatedStats] = useState(stats.map(stat => ({ ...stat, value: 0 })));

  // Animation des statistiques
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedStats(prev => 
        prev.map((stat, i) => {
          if (stat.value < stats[i].target) {
            const increment = Math.max(1, Math.floor(stats[i].target / 30));
            return { 
              ...stat, 
              value: Math.min(stat.value + increment, stats[i].target) 
            };
          }
          return stat;
        })
      );
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero section avec effet néon */}
      <section className="w-full max-w-7xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-gradient-primary mb-4">
            PLANNER Suite
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Suite modulaire de planification pour différents secteurs d'activité
          </p>
          
          {/* Effet de ligne néon sous le titre */}
          <div className="h-0.5 w-32 bg-gradient-primary mx-auto mt-6 animate-pulse-slow rounded-full shadow-neon-purple"></div>
        </motion.div>
      </section>

      {/* Grille de modules */}
      <motion.section 
        className="w-full max-w-7xl mx-auto mb-16"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <h2 className="text-2xl font-bold mb-8 text-white">
          <span className="text-neon-purple">Modules</span> disponibles
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module) => (
            <motion.div
              key={module.id}
              variants={itemVariants}
              whileHover={{ 
                y: -5, 
                transition: { duration: 0.2 } 
              }}
              className="group relative"
            >
              {/* Effet de bordure animée */}
              <div className={`absolute -inset-0.5 rounded-lg bg-gradient-to-r ${module.color} opacity-50 group-hover:opacity-100 blur-sm group-hover:blur transition duration-300`}></div>
              
              {/* Carte avec effet glassmorphism */}
              <div className={`relative h-full glassmorphism-dark rounded-lg p-6 border ${module.borderColor} overflow-hidden`}>
                {/* Effet de lumière en arrière-plan */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${module.color} blur-2xl opacity-20`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className={`p-2 rounded-lg bg-background-card ${module.borderColor}`}>
                      {module.icon}
                    </div>
                    <h3 className={`ml-4 text-lg font-bold ${module.textColor}`}>
                      {module.name}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-300 mb-6">
                    {module.description}
                  </p>
                  
                  <div className="flex justify-between items-center mt-auto">
                    {module.active ? (
                      <Link href={module.path} className={`inline-flex items-center ${module.textColor} hover:underline text-sm font-medium`}>
                        Accéder
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-background-card text-gray-400 border border-gray-800">
                        Bientôt disponible
                      </span>
                    )}
                    
                    {/* Badge pour indiquer si le module est actif */}
                    {module.active && (
                      <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Section statistiques */}
      <motion.section 
        className="w-full max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        <h2 className="text-2xl font-bold mb-8 text-white">
          <span className="text-neon-blue">Statistiques</span> globales
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {animatedStats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
              className="glassmorphism rounded-lg p-6 border border-white/5"
            >
              <div className="flex items-center mb-2">
                <div className="p-1.5 rounded-md bg-background-card">
                  {stat.icon}
                </div>
                <p className="ml-3 text-sm text-gray-400">{stat.label}</p>
              </div>
              <div className={`text-3xl font-bold ${stat.color}`}>
                {stat.value.toLocaleString()}
                {stat.suffix}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Appel à l'action */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          <Link 
            href="/stageplanner" 
            className="btn-neon px-8 py-3 text-base rounded-full"
          >
            Commencer avec STAGE PLANNER
          </Link>
        </motion.div>
      </motion.section>
    </main>
  );
}
