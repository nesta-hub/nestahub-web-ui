/**
 * Stage emoji mapping based on age group slugs
 * Matches the nesting-essentials convention
 */
export const stageEmojis: Record<string, string> = {
  'tiny-tots': '👶',
  'wiggling-wonders': '🌟',
  'giggly-rollers': '🫧',
  'bouncy-buddies': '🦋',
  'steady-steps': '👣',
  'little-explorers': '🚀',
};

/**
 * Get the appropriate emoji for a stage slug
 * @param slug - The stage/age group slug
 * @returns Emoji string, defaults to 👶 if slug not found
 */
export function getStageEmoji(slug: string): string {
  return stageEmojis[slug] ?? '👶';
}
