'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Calendar, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Users, 
  Clock, 
  CalendarDays, 
  Building, 
  Search,
  Filter,
  MoreHorizontal,
  AlertCircle
} from 'lucide-react';

// Types pour les événements
type EventType = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  teamCount: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  color?: string;
};

// Données simulées pour la V1
const mockEvents: EventType[] = [
  {
    id: '1',
    title: 'Concert Rock - Les Indomptables',
    startDate: '2025-06-10T18:00:00',
    endDate: '2025-06-10T23:30:00',
    location: 'Salle Pleyel, Paris',
    teamCount: 8,
    status: 'upcoming',
    color: 'bg-primary-500'
  },
  {
    id: '2',
    title: 'Festival Électro - Nuit Digitale',
    startDate: '2025-06-15T20:00:00',
    endDate: '2025-06-16T06:00:00',
    location: 'Warehouse, Lyon',
    teamCount: 12,
    status: 'upcoming',
    color: 'bg-secondary-500'
  },
  {
    id: '3',
    title: 'Théâtre - Le Misanthrope',
    startDate: '2025-06-07T19:30:00',
    endDate: '2025-06-07T22:00:00',
    location: 'Théâtre de la Ville, Paris',
    teamCount: 5,
    status: 'upcoming',
    color: 'bg-tertiary-500'
  },
  {
    id: '4',
    title: 'Conférence Tech - Future Now',
    startDate: '2025-06-20T09:00:00',
    endDate: '2025-06-21T18:00:00',
    location: 'Palais des Congrès, Marseille',
    teamCount: 10,
    status: 'upcoming',
    color: 'bg-cyan-500'
  },
  {
    id: '5',
    title: 'Spectacle Jeunesse - Les Aventuriers',
    startDate: '2025-06-12T14:00:00',
    endDate: '2025-06-12T16:00:00',
    location: 'MJC Centre, Toulouse',
    teamCount: 3,
    status: 'upcoming',
    color: 'bg-amber-500'
  }
];

// Statistiques simulées
const mockStats = [
  { label: 'Événements', value: 5, icon: <CalendarDays className="h-5 w-5 text-primary-400" /> },
  { label: 'Équipes', value: 38, icon: <Users className="h-5 w-5 text-secondary-400" /> },
  { label: 'Heures planifiées', value: 127, icon: <Clock className="h-5 w-5 text-tertiary-400" /> },
  { label: 'Lieux', value: 4, icon: <Building className="h-5 w-5 text-cyan-400" /> }
];

// Fonction utilitaire pour obtenir la couleur de statut
const getStatusColor = (status: EventType['status']) => {
  switch (status) {
    case 'upcoming':
      return 'bg-primary-500/20 text-primary-300';
    case 'ongoing':
      return 'bg-green-500/20 text-green-300';
    case 'completed':
      return 'bg-gray-500/20 text-gray-300';
    case 'cancelled':
      return 'bg-red-500/20 text-red-300';
    default:
      return 'bg-gray-500/20 text-gray-300';
  }
};

// Fonction utilitaire pour obtenir le texte de statut en français
const getStatusText = (status: EventType['status']) => {
  switch (status) {
    case 'upcoming':
      return 'À venir';
    case 'ongoing':
      return 'En cours';
    case 'completed':
      return 'Terminé';
    case 'cancelled':
      return 'Annulé';
    default:
      return 'Inconnu';
  }
};

export default function StagePlannerPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<EventType[]>(mockEvents);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>(events);

  // Effet pour simuler le chargement des données
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Effet pour filtrer les événements en fonction de la recherche
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = events.filter(
        event => 
          event.title.toLowerCase().includes(query) || 
          event.location.toLowerCase().includes(query)
      );
      setFilteredEvents(filtered);
    }
  }, [searchQuery, events]);

  // Obtenir les jours de la semaine actuelle
  const startOfCurrentWeek = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(currentDate, { weekStartsOn: 1 });
  const daysOfWeek = eachDayOfInterval({ start: startOfCurrentWeek, end: endOfCurrentWeek });

  // Obtenir les événements pour un jour spécifique
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStartDate = parseISO(event.startDate);
      return isSameDay(eventStartDate, day);
    });
  };

  // Navigation dans le calendrier
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Créer un nouvel événement
  const createNewEvent = () => {
    // Dans une implémentation réelle, cela ouvrirait un modal ou redirigerait vers un formulaire
    alert('Fonctionnalité de création d\'événement à venir dans la prochaine version!');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec navigation et actions */}
      <header className="glassmorphism-dark border-b border-white/5 py-4 px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-primary-400 mr-3" />
            <h1 className="text-2xl font-bold text-gradient-primary">STAGE PLANNER</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher un événement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 glassmorphism border border-white/10 rounded-full text-sm focus:border-primary-500 focus:ring-primary-500 w-full sm:w-64"
              />
            </div>

            <button 
              className="btn-glass rounded-full p-2"
              title="Filtrer"
            >
              <Filter className="h-5 w-5" />
            </button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={createNewEvent}
              className="btn-neon rounded-full flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span>Nouvel événement</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panneau latéral avec événements à venir */}
          <div className="lg:col-span-1">
            <div className="glassmorphism-dark rounded-lg border border-white/5 p-4 h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Événements à venir</h2>
                <button className="text-gray-400 hover:text-white">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
                <AnimatePresence>
                  {isLoading ? (
                    // Skeleton loader pour les événements
                    Array.from({ length: 5 }).map((_, index) => (
                      <motion.div
                        key={`skeleton-${index}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="glassmorphism border border-white/5 rounded-lg p-4 animate-pulse"
                      >
                        <div className="h-5 w-3/4 bg-white/10 rounded mb-2"></div>
                        <div className="h-4 w-1/2 bg-white/10 rounded mb-2"></div>
                        <div className="h-4 w-1/3 bg-white/10 rounded"></div>
                      </motion.div>
                    ))
                  ) : filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        whileHover={{ scale: 1.02 }}
                        className="glassmorphism border border-white/5 rounded-lg p-4 cursor-pointer hover:border-primary-500/50 transition-colors"
                        onClick={() => alert(`Détails de l'événement ${event.title} à venir dans la prochaine version!`)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-white truncate">{event.title}</h3>
                          <div className={`h-3 w-3 rounded-full ${event.color || 'bg-primary-500'}`}></div>
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          {format(parseISO(event.startDate), 'dd MMM yyyy - HH:mm', { locale: fr })}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">{event.location}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(event.status)}`}>
                            {getStatusText(event.status)}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    // État vide
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-10 text-center"
                    >
                      <AlertCircle className="h-12 w-12 text-gray-500 mb-3" />
                      <p className="text-gray-400 mb-2">Aucun événement trouvé</p>
                      <p className="text-sm text-gray-500">
                        {searchQuery ? 'Essayez une autre recherche' : 'Créez votre premier événement'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Calendrier interactif et statistiques */}
          <div className="lg:col-span-3 space-y-6">
            {/* Contrôles du calendrier */}
            <div className="glassmorphism-dark rounded-lg border border-white/5 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <button
                    onClick={goToPreviousWeek}
                    className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  <h2 className="text-lg font-medium">
                    {format(startOfCurrentWeek, 'dd MMM', { locale: fr })} - {format(endOfCurrentWeek, 'dd MMM yyyy', { locale: fr })}
                  </h2>
                  
                  <button
                    onClick={goToNextWeek}
                    className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToToday}
                    className="px-4 py-2 rounded-md border border-white/10 hover:bg-white/5 text-sm transition-colors"
                  >
                    Aujourd'hui
                  </button>
                  
                  <div className="border-l border-white/10 h-6 mx-2"></div>
                  
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-4 py-2 rounded-md text-sm ${
                      viewMode === 'week' ? 'bg-primary-500/20 text-primary-300' : 'hover:bg-white/5'
                    }`}
                  >
                    Semaine
                  </button>
                  
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-4 py-2 rounded-md text-sm ${
                      viewMode === 'month' ? 'bg-primary-500/20 text-primary-300' : 'hover:bg-white/5'
                    }`}
                  >
                    Mois
                  </button>
                </div>
              </div>
              
              {/* Vue calendrier hebdomadaire */}
              <div className="grid grid-cols-7 gap-2">
                {/* En-têtes des jours */}
                {daysOfWeek.map((day, index) => (
                  <div key={index} className="text-center py-2">
                    <div className="text-xs text-gray-400 mb-1">
                      {format(day, 'EEEE', { locale: fr })}
                    </div>
                    <div className={`text-lg font-medium rounded-full w-10 h-10 flex items-center justify-center mx-auto ${
                      isSameDay(day, new Date()) ? 'bg-primary-500 text-white' : 'text-white'
                    }`}>
                      {format(day, 'd')}
                    </div>
                  </div>
                ))}
                
                {/* Cellules des jours avec événements */}
                {daysOfWeek.map((day, dayIndex) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div 
                      key={`cell-${dayIndex}`} 
                      className={`border border-white/5 rounded-lg p-2 min-h-[150px] ${
                        isSameDay(day, new Date()) ? 'bg-primary-900/20' : 'hover:bg-white/5'
                      } transition-colors`}
                    >
                      {isLoading ? (
                        // Skeleton loader pour les événements du calendrier
                        <div className="space-y-2">
                          <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                          <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse"></div>
                        </div>
                      ) : dayEvents.length > 0 ? (
                        <div className="space-y-1">
                          {dayEvents.map((event) => (
                            <motion.div
                              key={event.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              whileHover={{ scale: 1.02 }}
                              className={`p-2 rounded-md ${event.color || 'bg-primary-500'} bg-opacity-20 border-l-2 ${event.color || 'border-primary-500'} text-white cursor-pointer`}
                              onClick={() => alert(`Détails de l'événement ${event.title} à venir dans la prochaine version!`)}
                            >
                              <div className="text-xs font-medium truncate">{event.title}</div>
                              <div className="text-xs opacity-70">
                                {format(parseISO(event.startDate), 'HH:mm', { locale: fr })}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <span className="text-xs text-gray-500">Aucun événement</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: index * 0.1 }
                  }}
                  className="glassmorphism-dark rounded-lg border border-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                    <div className="p-3 rounded-full bg-background-card">
                      {stat.icon}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
