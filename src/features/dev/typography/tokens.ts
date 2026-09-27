// Audition values only. Production tokens do not import this module.
export const tokens = {
  color: { black: '#000000', white: '#F3F0EA', secondary: '#AAA8A4', stellar: '#D3BD98', cool: '#9AAEC4', border: '#292725' },
  space: [4, 8, 12, 20, 28, 40, 64],
  radius: { square: 0, control: 6 },
  opacity: { primary: 1, secondary: 0.72, decorative: 0.16 },
  glow: { none: 0, trace: 0.06, focal: 0.14 },
  type: { display: 36, question: 30, body: 17, label: 12, control: 16 },
} as const;
