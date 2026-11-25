export type Platform = 'Windows' | 'macOS' | 'Linux';

export const PLATFORMS: Platform[] = ['Windows', 'macOS', 'Linux'];

/** Phones and tablets, which cannot run the app. */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPadOS reports "Macintosh" but has touch points.
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

/** The visitor's desktop OS, or null on phones/tablets and anything unknown. */
export function detectPlatform(): Platform | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  // Android also reports "Linux", so rule mobile out first.
  if (isMobileDevice()) return null;
  const hint = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
  const s = `${hint ?? ''} ${navigator.platform ?? ''} ${ua}`;
  if (/Win/i.test(s)) return 'Windows';
  if (/Mac/i.test(s)) return 'macOS';
  if (/Linux|X11/i.test(s)) return 'Linux';
  return null;
}
