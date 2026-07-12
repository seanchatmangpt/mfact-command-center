const fs = require('fs');

let autoContent = fs.readFileSync('AutonomicPlatform.jsx', 'utf8');

autoContent = autoContent.replace(/export const PALETTE = \{[\s\S]*?\};/, `export const PALETTE = {
  bg: '#ffffff',
  panel: 'transparent',
  panel2: 'transparent',
  line: '#cccccc',
  line2: '#999999',
  cyan: '#000000',
  emerald: '#000000',
  amber: '#000000',
  magenta: '#000000',
  violet: '#000000',
  hi: '#000000',
  mid: '#333333',
  dim: '#666666',
};`);

autoContent = autoContent.replace(/background:\s*'linear-gradient[^']*'/g, "background: 'transparent'");
autoContent = autoContent.replace(/background:\s*\`linear-gradient[^`]*\`/g, "background: 'transparent'");
autoContent = autoContent.replace(/boxShadow:[^,}]+/g, "boxShadow: 'none'");
autoContent = autoContent.replace(/borderRadius:\s*\d+/g, "borderRadius: 0");
autoContent = autoContent.replace(/background:\s*`radial-gradient[^`]*`/g, "background: PALETTE.bg");

// No loot boxes: replace specific string
autoContent = autoContent.replace(/reward:\s*'[^']*'/g, "reward: 'DATA EXTRACT'");

fs.writeFileSync('AutonomicPlatform.jsx', autoContent);

let tenFour = fs.readFileSync('TenFourApp.jsx', 'utf8');

tenFour = tenFour.replace(/const C = \{[\s\S]*?\};/, `const C = {
  bg: '#ffffff', surface: '#ffffff', surfaceAlt: '#ffffff', surface3: '#ffffff',
  line: '#000000', line2: '#000000',
  text: '#000000', dim: '#333333', faint: '#666666',
  amber: '#000000', green: '#000000', red: '#000000',
  blue: '#000000', violet: '#000000', cyan: '#000000',
  pink: '#000000', orange: '#000000', teal: '#000000',
};`);

tenFour = tenFour.replace(/borderRadius:\s*\d+/g, "borderRadius: 0");
tenFour = tenFour.replace(/borderWidth:\s*0/g, "borderWidth: 1");

fs.writeFileSync('TenFourApp.jsx', tenFour);
