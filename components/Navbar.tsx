import React from 'react';
import { Film, Upload, Search, MonitorPlay } from 'lucide-react';

interface NavbarProps {
  onUploadClick: () => void;
  onHomeClick: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onUploadClick, onHomeClick, searchQuery, setSearchQuery }) => {
  return (
    <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
      <div 
        className="flex items-center gap-2 cursor-pointer group" 
        onClick={onHomeClick}
      >
        <div className="bg-red-600 p-2 rounded-lg group-hover:bg-red-700 transition-colors">
          <MonitorPlay className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-bold tracking-tighter text-white">
          Stream<span className="text-red-600">LAN</span>
        </span>
      </div>

      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-red-500 transition-colors" />
          <input
            type="text"
            placeholder="Search titles, genres..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder:text-gray-600"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition-colors text-sm"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Upload Movie</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-orange-600 border border-white/20" />
      </div>
    </nav>
  );
};
