import React from 'react';
import { Home, Dumbbell, Calendar, BarChart3, BookOpen, Upload, Target } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'exercises', label: 'Exercises', icon: Dumbbell },
    { id: 'templates', label: 'Templates', icon: BookOpen },
    { id: 'workout', label: 'Workout', icon: Calendar },
    { id: 'targets', label: 'Targets', icon: Target },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'import', label: 'Import', icon: Upload }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-solarized-base3 border-t border-solarized-base2 px-2 py-3 z-50">
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max px-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center py-3 px-3 rounded-lg transition-all duration-200 min-w-0 flex-shrink-0 ${
                activeTab === id
                  ? 'text-solarized-blue bg-solarized-blue/10'
                  : 'text-solarized-base01 hover:text-solarized-base00 hover:bg-solarized-base2'
              }`}
            >
              <Icon size={18} className="mb-1" />
              <span className="text-xs font-medium whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}