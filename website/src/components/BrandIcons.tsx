import React from 'react';
import {
  siNodedotjs,
  siNextdotjs,
  siRust,
  siPython,
  siDocker,
  siLinux,
  siUbuntu,
  siApple,
  siGithub,
  siX,
  siDiscord,
  siYoutube,
  siJavascript,
} from 'simple-icons';

interface IconProps {
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

// Helper component for Simple Icons 24x24 SVGs
const SimpleIconSvg: React.FC<{
  path: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
  defaultColor?: string;
}> = ({ path, className = 'w-5 h-5', size, style, defaultColor }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ ...(size ? { width: size, height: size } : {}), ...style }}
    aria-hidden="true"
  >
    <path d={path} />
  </svg>
);

// Official Microsoft Windows 4-Square SVG
export const WindowsIcon: React.FC<IconProps> = ({ className = 'w-4 h-4', size, style }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={{ ...(size ? { width: size, height: size } : {}), ...style }}
    aria-hidden="true"
  >
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.802" />
  </svg>
);

export const AppleIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siApple.path} {...props} />
);

export const LinuxIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siLinux.path} {...props} />
);

export const WslIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siUbuntu.path} {...props} />
);

export const RustIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siRust.path} {...props} />
);

export const NodeJsIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siNodedotjs.path} {...props} />
);

export const NextJsIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siNextdotjs.path} {...props} />
);

export const PythonIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siPython.path} {...props} />
);

export const DockerIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siDocker.path} {...props} />
);

export const JavaScriptIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siJavascript.path} {...props} />
);

export const GitHubIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siGithub.path} {...props} />
);

export const XTwitterIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siX.path} {...props} />
);

export const DiscordIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siDiscord.path} {...props} />
);

export const YouTubeIcon: React.FC<IconProps> = (props) => (
  <SimpleIconSvg path={siYoutube.path} {...props} />
);
