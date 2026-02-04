import React from 'react';
import { ViewState } from '../types';
import { Activity, BarChart2, User as UserIcon, Users } from 'lucide-react';

interface NavbarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Train', icon: Activity },
    { id: ViewState.STATS, label: 'Stats', icon: BarChart2 },
    { id: ViewState.CLAN, label: 'Clan', icon: Users },
    { id: ViewState.PROFILE, label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-slate-900/90 backdrop-blur-lg border-t border-slate-700 z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <item.icon size={24} className={isActive ? 'animate-bounce' : ''} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
