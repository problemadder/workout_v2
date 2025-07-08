import React from 'react';
import { Activity } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-solarized-base02 to-solarized-base03 text-solarized-base2 p-6 pb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-solarized-blue/20 rounded-lg">
          <Activity size={24} className="text-solarized-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-solarized-base3">{title}</h1>
          {subtitle && <p className="text-solarized-base1 text-sm">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}