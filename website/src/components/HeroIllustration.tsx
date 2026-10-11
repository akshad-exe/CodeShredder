import React from 'react';
import { CodeShredderIcon } from './CodeShredderIcon';
import volcanicRidgeImg from '../assets/images/hero_volcanic_ridge_1791701362419.jpg';

export const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-[600px] h-[520px] sm:h-[580px] lg:h-[620px] flex items-center justify-center select-none pointer-events-none overflow-visible">
      {/* 1. Base Layer: Dark Rugged Volcanic Mountain Ridge across bottom third */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] flex items-end justify-center overflow-hidden">
        <div className="relative w-full h-full">
          <img
            src={volcanicRidgeImg}
            alt="Dark volcanic mountain ridge with central molten orange fissure"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-bottom"
          />
          {/* Subtle edge feathering to seamlessly blend into the dark page background */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#080A0B] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080A0B]/80 via-transparent to-[#080A0B]/80" />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-[#080A0B]" />
        </div>
      </div>

      {/* 2. Floating Diamond Sparks around the Icon (Crisp, sharp diamonds matching reference image) */}
      {/* Spark 1: Top-Left above document */}
      <div className="absolute top-[10%] left-[18%] w-3 h-3 bg-[#FFA633] rotate-45 opacity-90 shadow-[0_0_10px_#FFA633]" />
      {/* Spark 2: Top-Right above folded flap */}
      <div className="absolute top-[14%] right-[14%] w-3.5 h-3.5 bg-[#FF8A24] rotate-45 opacity-95 shadow-[0_0_12px_#FF8A24]" />
      {/* Spark 3: Mid-Left */}
      <div className="absolute top-[38%] left-[7%] w-3.5 h-3.5 bg-[#FFA234] rotate-45 opacity-90 shadow-[0_0_12px_#FFA234]" />
      {/* Spark 4: Mid-Right */}
      <div className="absolute top-[42%] right-[7%] w-4 h-4 bg-[#FF702B] rotate-45 opacity-95 shadow-[0_0_14px_#FF702B]" />
      {/* Spark 5: Lower-Left near mountain */}
      <div className="absolute top-[56%] left-[13%] w-2.5 h-2.5 bg-[#F04420] rotate-45 opacity-85 shadow-[0_0_8px_#F04420]" />
      {/* Spark 6: Far-Right */}
      <div className="absolute top-[50%] right-[2%] w-2.5 h-2.5 bg-[#FFA633] rotate-45 opacity-80 shadow-[0_0_8px_#FFA633]" />

      {/* 3. Authentic Large CodeShredder Document Icon */}
      <div className="relative z-10 flex flex-col items-center -translate-y-6 sm:-translate-y-8">
        {/* Tilted Document Icon Container matching reference -7.5deg tilt */}
        <div className="relative transform -rotate-[7.5deg] transition-transform duration-500 hover:scale-102">
          {/* Authentic CodeShredder Vector Icon */}
          <div className="w-[310px] sm:w-[360px] lg:w-[400px] aspect-square flex items-center justify-center">
            <CodeShredderIcon
              className="w-full h-full filter drop-shadow-[0_15px_30px_rgba(255,112,43,0.55)] drop-shadow-[0_0_15px_rgba(255,112,43,0.3)]"
            />
          </div>

          {/* Cascading Vertical Shred Bars continuing downward toward the mountain fissure */}
          <div className="absolute left-[22%] -bottom-8 flex items-start gap-2.5 pointer-events-none">
            {/* Extended Shred Bar 1 */}
            <div className="w-[5.5px] h-9 rounded-xs bg-gradient-to-b from-[#FF702B] to-[#F04420] shadow-[0_0_8px_#FF702B]" />
            {/* Extended Shred Bar 2 */}
            <div className="w-[5.5px] h-14 rounded-xs bg-gradient-to-b from-[#FFA633] via-[#FF702B] to-[#E23E15] shadow-[0_0_10px_#FFA633] translate-y-2" />
            {/* Extended Shred Bar 3 (Center Longest) */}
            <div className="w-[5.5px] h-20 rounded-xs bg-gradient-to-b from-[#FFB03A] via-[#FF702B] to-[#F04420] shadow-[0_0_12px_#FFB03A] translate-y-3" />
            {/* Extended Shred Bar 4 */}
            <div className="w-[5.5px] h-13 rounded-xs bg-gradient-to-b from-[#FF702B] to-[#E23E15] shadow-[0_0_8px_#FF702B] translate-y-1" />
            {/* Extended Shred Bar 5 */}
            <div className="w-[5.5px] h-8 rounded-xs bg-gradient-to-b from-[#FF8A24] to-[#F04420] shadow-[0_0_8px_#FF8A24] translate-y-2" />
          </div>

          {/* Detached Falling Ember Blocks descending into the molten crater */}
          <div className="absolute left-[18%] -bottom-16 w-3 h-3 bg-[#FF702B] rounded-xs shadow-[0_0_8px_#FF702B]" />
          <div className="absolute left-[33%] -bottom-20 w-3.5 h-3.5 bg-[#FFA633] rounded-xs shadow-[0_0_10px_#FFA633]" />
          <div className="absolute left-[46%] -bottom-24 w-3.5 h-3.5 bg-[#FF8A24] rounded-xs shadow-[0_0_10px_#FF8A24]" />
          <div className="absolute left-[60%] -bottom-18 w-3 h-3 bg-[#F04420] rounded-xs shadow-[0_0_8px_#F04420]" />
          <div className="absolute left-[72%] -bottom-14 w-2.5 h-2.5 bg-[#FFA234] rounded-xs shadow-[0_0_8px_#FFA234]" />
        </div>
      </div>

      {/* 4. Brand Signature Phrase on the Lower-Right over the Mountain Rocks */}
      <div className="absolute bottom-6 right-2 sm:right-6 transform -rotate-12 z-20 pointer-events-none select-none">
        <div className="font-handwriting text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#FFA234] leading-[1.05] tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.98)]">
          <span>LESS JUNK</span>
          <br />
          <span className="relative inline-block">
            MORE BUILDING
            <span
              className="absolute -bottom-1 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFA234] to-transparent opacity-85"
              aria-hidden="true"
            />
          </span>
        </div>
      </div>
    </div>
  );
};
