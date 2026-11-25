import React from 'react';
import {
  RustIcon,
  NextJsIcon,
  PythonIcon,
  LinuxIcon,
  JavaScriptIcon,
} from './BrandIcons';
import { Database, FileText, Layers, FolderArchive } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export const JunkCategories: React.FC = () => {
  const categories: CategoryItem[] = [
    {
      id: 'node_modules',
      name: 'node_modules',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-[#F7DF1E] flex items-center justify-center font-bold text-black text-xs shadow-xs">
          JS
        </div>
      ),
    },
    {
      id: 'next_nuxt',
      name: '.next / .nuxt',
      icon: (
        <div className="w-8 h-8 rounded-full bg-black border border-white/20 flex items-center justify-center font-bold text-white text-xs shadow-xs">
          N
        </div>
      ),
    },
    {
      id: 'target',
      name: 'target',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center text-accent p-1.5 shadow-xs">
          <RustIcon className="w-5 h-5 text-accent" />
        </div>
      ),
    },
    {
      id: 'dist_build',
      name: 'dist / build',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-[#9333EA]/15 border border-[#9333EA]/30 flex items-center justify-center text-[#C084FC] p-1.5 shadow-xs">
          <Layers className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'venv',
      name: '.venv',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] p-1.5 shadow-xs">
          <PythonIcon className="w-5 h-5 text-[#38BDF8]" />
        </div>
      ),
    },
    {
      id: 'pycache',
      name: '__pycache__',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/15 border border-[#F59E0B]/30 flex items-center justify-center text-[#FBBF24] p-1.5 shadow-xs">
          <FolderArchive className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'caches',
      name: 'Caches',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-[#818CF8]/15 border border-[#818CF8]/30 flex items-center justify-center text-[#A5B4FC] p-1.5 shadow-xs">
          <Database className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'wsl',
      name: 'WSL bloat',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-[#EC4899]/15 border border-[#EC4899]/30 flex items-center justify-center text-[#F472B6] p-1.5 shadow-xs">
          <LinuxIcon className="w-5 h-5" />
        </div>
      ),
    },
    {
      id: 'large_files',
      name: 'Large files',
      icon: (
        <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-white p-1.5 shadow-xs">
          <FileText className="w-5 h-5" />
        </div>
      ),
    },
  ];

  return (
    <section className="py-10 border-y border-white/[0.05] bg-background/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-lg font-bold text-white mb-5 tracking-tight">
          Find and remove
        </h2>

        {/* 9 Category Tiles matching the exact card curvature, typography, and styling */}
        <div className="grid grid-cols-3 lg:grid-cols-9 gap-3 sm:gap-3.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group flex flex-col items-center justify-center py-5 px-2 rounded-2xl bg-[#10161A] border border-white/[0.07] hover:border-accent/40 hover:bg-panel-2 transition-all duration-200 cursor-default"
            >
              <div className="mb-3 transform group-hover:scale-110 transition-transform duration-200">
                {cat.icon}
              </div>
              <span className="text-[11px] sm:text-xs font-mono font-medium text-muted group-hover:text-white transition-colors text-center leading-tight [overflow-wrap:anywhere]">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
