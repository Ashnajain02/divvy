// Divvy design tokens. Raw RGB strings so they can be used both in CSS (via
// globals.css @theme) and as inline styles (the share card is rendered to PNG
// by html2canvas, which does not reliably resolve CSS variables — inline rgb is
// safest there).

export const colors = {
  // Primary brand (deep indigo-purple)
  primary: 'rgb(46, 31, 97)', // #2E1F61
  primaryLight: 'rgb(89, 56, 166)', // #5938A6
  // Gold accent (warm, dusty — NOT bright yellow)
  gold: 'rgb(199, 166, 97)', // #C7A661
  goldLight: 'rgb(230, 209, 148)', // #E6D194
  // Backgrounds (warm cream, not neutral gray)
  background: 'rgb(247, 242, 232)', // #F7F2E8
  backgroundDeep: 'rgb(240, 232, 219)', // #F0E8DB
  cardBg: 'rgb(253, 250, 242)', // #FDFAF2
  // Text
  textPrimary: 'rgb(36, 28, 20)', // #241C14
  textSecondary: 'rgb(117, 102, 87)', // #756657
  textTertiary: 'rgb(166, 153, 138)', // #A6998A
  textDisabled: 'rgb(199, 191, 179)', // #C7BFB3
  // Semantic
  success: 'rgb(64, 158, 122)', // #409E7A
  destructive: 'rgb(199, 71, 71)', // #C74747
  micRed: 'rgb(209, 56, 56)', // #D13838
} as const;

export const gradients = {
  primary: `linear-gradient(to bottom right, ${colors.primary}, ${colors.primaryLight})`,
  gold: `linear-gradient(to right, ${colors.gold}, ${colors.goldLight})`,
} as const;

export const radius = { small: 10, medium: 14, large: 20 } as const;
