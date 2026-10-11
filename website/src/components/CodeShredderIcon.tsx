import React from 'react';

interface CodeShredderIconProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const CodeShredderIcon: React.FC<CodeShredderIconProps> = ({
  className = 'w-8 h-8',
  size,
  glow = false,
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${glow ? 'drop-shadow-[0_0_25px_rgba(255,112,43,0.6)]' : ''}`}
      style={style}
      aria-label="CodeShredder Icon"
      role="img"
    >
      <defs>
        {/* Document Outer Bevel & Body Gradient */}
        <linearGradient id="docOuterGrad" x1="22" y1="14" x2="65" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="45%" stopColor="#F8F9FA" />
          <stop offset="85%" stopColor="#E2E4E8" />
          <stop offset="100%" stopColor="#D0D3D8" />
        </linearGradient>

        {/* Document Inner Plate Gradient */}
        <linearGradient id="docInnerPlate" x1="30" y1="20" x2="60" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#151C22" />
          <stop offset="100%" stopColor="#0B0F13" />
        </linearGradient>

        {/* Orange Shredding Strips Gradient */}
        <linearGradient id="shredOrangeGrad" x1="50" y1="48" x2="50" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFBA3B" />
          <stop offset="35%" stopColor="#FF702B" />
          <stop offset="75%" stopColor="#F04218" />
          <stop offset="100%" stopColor="#C9280A" />
        </linearGradient>

        {/* Fold Flap Gradient */}
        <linearGradient id="foldFlapGrad" x1="58" y1="15" x2="80" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFC24D" />
          <stop offset="30%" stopColor="#FF8526" />
          <stop offset="70%" stopColor="#FF5A14" />
          <stop offset="100%" stopColor="#D4320C" />
        </linearGradient>

        {/* Ambient Drop Filter */}
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. Main Document Outer Frame (Thick, luminous white border) */}
      <path
        d="M 33 15
           C 24 15, 20 19, 20 27
           L 20 54
           L 30 54
           L 30 28
           C 30 23, 32 21, 36 21
           L 58 21
           L 58 36
           C 58 40, 61 43, 65 43
           L 78 43
           L 78 54
           L 82 54
           L 82 35
           L 61 15
           Z"
        fill="url(#docOuterGrad)"
      />

      {/* 2. Main Document Inner Charcoal Plate */}
      <path
        d="M 29 27
           C 29 22, 31 20, 36 20
           L 58 20
           L 58 35
           C 58 39, 61 42, 65 42
           L 78 42
           L 78 54
           L 29 54
           Z"
        fill="url(#docInnerPlate)"
      />

      {/* 3. Folded Dog-Ear Flap (Bright, glowing vibrant orange/amber) */}
      <path
        d="M 59 15
           L 80 36
           C 79 37.5, 77 39, 74 39.5
           C 70 40, 65 39, 63 36.5
           C 61 33.5, 60 29, 60 25
           C 60 20, 59 17, 59 15
           Z"
        fill="url(#foldFlapGrad)"
      />
      {/* Fold Flap Inner Bevel Highlight */}
      <path
        d="M 59 15
           Q 63 26, 73 36
           Q 67 32, 63 27
           Q 59 22, 59 15
           Z"
        fill="#FFE180"
        opacity="0.85"
      />

      {/* 4. Center Code Brackets Symbol < / > (Crisp White, thick and prominent) */}
      <g fill="#FFFFFF">
        {/* Left angle bracket < */}
        <path
          d="M 43.8 34.5
             L 34.8 42
             L 43.8 49.5
             L 45.8 47.5
             L 39 42
             L 45.8 36.5
             Z"
        />
        {/* Forward Slash / */}
        <path
          d="M 53.6 32
             L 46.8 52
             L 49.6 52
             L 56.4 32
             Z"
        />
        {/* Right angle bracket > */}
        <path
          d="M 57.2 34.5
             L 66.2 42
             L 57.2 49.5
             L 55.2 47.5
             L 62 42
             L 55.2 36.5
             Z"
        />
      </g>

      {/* 5. Shredding Vertical Strips (Thick, elongated vertical bars with rich gradient) */}
      {/* Strip 1 */}
      <rect x="28" y="52" width="5.5" height="17" rx="2" fill="url(#shredOrangeGrad)" />
      {/* Strip 2 */}
      <rect x="35.5" y="52" width="5.5" height="26" rx="2" fill="url(#shredOrangeGrad)" />
      {/* Strip 3 */}
      <rect x="43" y="52" width="5.5" height="34" rx="2" fill="url(#shredOrangeGrad)" />
      {/* Strip 4 (longest center strip) */}
      <rect x="50.5" y="52" width="5.5" height="39" rx="2" fill="url(#shredOrangeGrad)" />
      {/* Strip 5 */}
      <rect x="58" y="52" width="5.5" height="29" rx="2" fill="url(#shredOrangeGrad)" />
      {/* Strip 6 */}
      <rect x="65.5" y="52" width="5.5" height="20" rx="2" fill="url(#shredOrangeGrad)" />
      {/* Strip 7 */}
      <rect x="73" y="52" width="5.5" height="14" rx="2" fill="url(#shredOrangeGrad)" />

      {/* 6. Falling Pixel Embers & Blocks */}
      {/* Left side falling blocks */}
      <rect x="25" y="68" width="4.2" height="4.2" rx="1" fill="#FF702B" />
      <rect x="32" y="75" width="4.2" height="4.2" rx="1" fill="#FF8A24" />
      <rect x="39" y="83" width="4.2" height="4.2" rx="1" fill="#F04420" />
      <rect x="45" y="90" width="4.5" height="4.5" rx="1" fill="#FF702B" />
      <rect x="54" y="91" width="4.5" height="4.5" rx="1" fill="#FF8A24" />
      <rect x="60" y="82" width="4.2" height="4.2" rx="1" fill="#FF702B" />
      <rect x="69" y="73" width="4.2" height="4.2" rx="1" fill="#FF8A24" />

      {/* Right side trailing scatter pixels */}
      <rect x="76" y="63" width="4.2" height="4.2" rx="1" fill="#FF702B" />
      <rect x="82" y="57" width="3.8" height="3.8" rx="1" fill="#FF8A24" />
      <rect x="77" y="70" width="4.2" height="4.2" rx="1" fill="#F04420" />
      <rect x="84" y="65" width="3.8" height="3.8" rx="1" fill="#FF702B" />
    </svg>
  );
};
