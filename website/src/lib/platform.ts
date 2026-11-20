export type Platform = 'Windows' | 'macOS' | 'Linux';

export const PLATFORMS: Platform[] = ['Windows', 'macOS', 'Linux'];

/** The visitor's desktop OS, or null on phones/tablets and anything unknown. */
export function detectPlatform(): Platform | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  // Android reports "Linux" and iPadOS reports "Macintosh"; neither can run the app.
  if (/Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    return null;
  }
  const hint = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
  const s = `${hint ?? ''} ${navigator.platform ?? ''} ${ua}`;
  if (/Win/i.test(s)) return 'Windows';
  if (/Mac/i.test(s)) return 'macOS';
  if (/Linux|X11/i.test(s)) return 'Linux';
  return null;
}
