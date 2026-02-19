const fs = require('fs');

const files = [
  'src/pages/night/[regionSlug]/[venueSlug].astro',
  'src/pages/club/[regionSlug]/[venueSlug].astro',
  'src/pages/lounge/[regionSlug]/[venueSlug].astro',
  'src/pages/guides/index.astro',
  'src/pages/guides/[guideSlug].astro',
];

let totalChanges = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // Match <a href="..." or <a href={...} that don't already have target="_blank"
  // and are NOT anchor links (href="#...")
  const newContent = content.replace(
    /(<a\s+)(href=(?:"[^"#][^"]*"|{[^}]+}))((?:\s+(?!target)[a-zA-Z-]+=(?:"[^"]*"|{[^}]*}))*\s*>)/g,
    (match, prefix, href, rest) => {
      // Skip if already has target
      if (match.includes('target=')) return match;
      // Skip anchor links
      if (match.includes('href="#')) return match;
      changes++;
      return `${prefix}${href} target="_blank" rel="noopener noreferrer"${rest}`;
    }
  );

  if (changes > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`${filePath}: ${changes} links updated`);
    totalChanges += changes;
  } else {
    console.log(`${filePath}: no changes needed`);
  }
});

console.log(`\nTotal: ${totalChanges} links updated`);
