// Utility to generate deterministic patterns based on a seed string (e.g. event ID)

export function generateEventPattern(seed: string): string {
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate colors based on hash
  const c1 = Math.abs(hash) % 360;
  const c2 = Math.abs(hash >> 8) % 360;
  const c3 = Math.abs(hash >> 16) % 360;

  const color1 = `hsl(${c1}, 70%, 60%)`;
  const color2 = `hsl(${c2}, 80%, 55%)`;
  const color3 = `hsl(${c3}, 60%, 45%)`;

  // Pattern types
  const patterns = [
    `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`,
    `radial-gradient(circle at top right, ${color1}, ${color2})`,
    `conic-gradient(from 0deg at 50% 50%, ${color1}, ${color2}, ${color3}, ${color1})`,
    `linear-gradient(45deg, ${color1} 25%, ${color2} 25%, ${color2} 50%, ${color1} 50%, ${color1} 75%, ${color2} 75%, ${color2} 100%)`,
    `repeating-linear-gradient(45deg, ${color1}, ${color1} 10px, ${color2} 10px, ${color2} 20px)`,
  ];

  const patternIndex = Math.abs(hash) % patterns.length;
  
  return patterns[patternIndex];
}

