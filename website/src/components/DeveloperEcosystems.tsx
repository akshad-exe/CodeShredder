import React from 'react';
import {
  NodeJsIcon,
  NextJsIcon,
  RustIcon,
  PythonIcon,
  DockerIcon,
  WslIcon,
  LinuxIcon,
  AppleIcon,
  WindowsIcon,
} from './BrandIcons';

interface Ecosystem {
  name: string;
  icon: React.ReactNode;
}

export const DeveloperEcosystems: React.FC = () => {
  const ecosystems: Ecosystem[] = [
    {
      name: 'Node.js',
      icon: <NodeJsIcon className="w-11 h-11 text-[#5FA04E] drop-shadow-[0_2px_14px_rgba(95,160,78,0.35)] transition-transform duration-200 group-hover:scale-115" />,
    },
    {
      name: 'Next.js',
      icon: <NextJsIcon className="w-11 h-11 text-white drop-shadow-[0_2px_14px_rgba(255,255,255,0.25)] transition-transform duration-200 group-hover:scale-115" />,
    },
    {
      name: 'Rust',
      icon: <RustIcon className="w-11 h-11 text-[#FF702B] drop-shadow-[0_2px_14px_rgba(255,112,43,0.4)] transition-transform duration-200 group-hover:scale-115" />,
    },
    {
      name: 'Python',
      icon: <PythonIcon className="w-11 h-11 text-[#38BDF8] drop-shadow-[0_2px_14px_rgba(56,189,248,0.35)] transition-transform duration-200 group-hover:scale-115" />,
    },
    {
      name: 'Docker',
      icon: <DockerIcon className="w-11 h-11 text-[#2496ED] drop-shadow-[0_2px_14px_rgba(36,150,237,0.35)] transition-transform duration-200 group-hover:scale-115" />,
    },
    {
      name: 'WSL',
      icon: <WslIcon className="w-11 h-11 text-[#E95420] drop-shadow-[0_2px_14px_rgba(233,84,32,0.35)] transition-transform duration-200 group-hover:scale-115" />,
    },
    {
      name: 'macOS',
      icon: <AppleIcon className="w-11 h-11 text-white drop-shadow-[0_2px_14px_rgba(255,255,255,0.25)] transition-transform duration-200 group-hover:scale-115" />,
    },
    {
      name: 'Windows',
      icon: <WindowsIcon className="w-11 h-11 text-[#00A4EF] drop-shadow-[0_2px_14px_rgba(0,164,239,0.35)] transition-transform duration-200 group-hover:scale-115" />,
    },
    {
      name: 'Linux',
      icon: <LinuxIcon className="w-11 h-11 text-[#FCC624] drop-shadow-[0_2px_14px_rgba(252,198,36,0.35)] transition-transform duration-200 group-hover:scale-115" />,
    },
  ];

  return (
    <section className="py-20 md:py-28 border-t border-white/[0.05] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
          Built for every developer.
        </h2>
        <p className="text-base sm:text-lg text-[#A7ADB4] max-w-2xl mx-auto mb-16 leading-relaxed">
          Whether you work with JavaScript, TypeScript, Rust, Python, mobile, or just
          love building — CodeShredder helps you keep your machine clean and fast.
        </p>

        {/* 9 Free-Standing Tech Logos without confining border boxes */}
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-6 sm:gap-8 justify-center items-end">
          {ecosystems.map((eco, index) => (
            <div
              key={index}
              className="group flex flex-col items-center justify-center cursor-default p-2"
            >
              <div className="mb-3.5 flex items-center justify-center h-12">
                {eco.icon}
              </div>
              <span className="text-sm font-semibold text-[#A7ADB4] group-hover:text-white transition-colors tracking-tight">
                {eco.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
