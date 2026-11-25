export const IS_WINDOWS = navigator.userAgent.includes('Windows')
export const IS_MAC = navigator.userAgent.includes('Mac')

/** What the OS calls its deleted-items folder. */
export const TRASH_NAME = IS_WINDOWS ? 'Recycle Bin' : 'Trash'
