import React from 'react';
import { CodeShredderIcon } from './CodeShredderIcon';

interface CodeShredderWordmarkProps {
  iconSize?: number;
  textSize?: string;
  showTagline?: boolean;
  className?: string;
}

export const CodeShredderWordmark: React.FC<CodeShredderWordmarkProps> = ({
  iconSize = 32,
  textSize = 'text-xl',
  showTagline = false,
  className = '',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <CodeShredderIcon size={iconSize} className="shrink-0" />
      <div className="flex flex-col">
        <div className={`font-extrabold tracking-tight leading-none ${textSize}`}>
          <span className="text-white">Code</span>
          <span className="text-[#FF702B]">Shredder</span>
        </div>
        {showTagline && (
          <div className="text-[9px] font-medium tracking-[0.2em] text-[#A7ADB4] uppercase mt-1">
            Clean · Reclaim · Code More
          </div>
        )}
      </div>
    </div>
  );
};
