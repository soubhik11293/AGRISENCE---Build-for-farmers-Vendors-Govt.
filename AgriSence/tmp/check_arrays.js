const fs = require('fs');

function checkArray(filepath, regex, varName) {
  if (!fs.existsSync(filepath)) return;
  const content = fs.readFileSync(filepath, 'utf8');
  const match = content.match(regex);
  if (match) {
    try {
      const arrStr = match[1];
      const items = Array.from(arrStr.matchAll(/['"]([^'"]+)['"]/g)).map(m => m[1]);
      const dups = items.filter((item, index) => items.indexOf(item) !== index);
      if (dups.length > 0) {
        console.log(`DUPLICATE IN ${varName} (${filepath}):`, dups);
      } else {
        console.log(`OK ${varName} (${filepath}):`, items.length, 'items');
      }
    } catch(e) {
      console.log(`Error parsing ${varName}:`, e.message);
    }
  }
}

checkArray('./src/lib/data/market.ts', /ALL_INDIAN_STATES_UTS\s*=\s*\[([\s\S]*?)\];/, 'ALL_INDIAN_STATES_UTS');
checkArray('./src/lib/data/market.ts', /MARKET_COMMODITY_CATEGORIES\s*=\s*\[([\s\S]*?)\];/, 'MARKET_COMMODITY_CATEGORIES');
checkArray('./src/components/profile-modal.tsx', /SPECIALIZATIONS\s*=\s*\[([\s\S]*?)\];/, 'SPECIALIZATIONS');
checkArray('./src/components/profile-modal.tsx', /COMMON_CROPS\s*=\s*\[([\s\S]*?)\];/, 'COMMON_CROPS');
checkArray('./src/components/profile-modal.tsx', /IRRIGATION_TYPES\s*=\s*\[([\s\S]*?)\];/, 'IRRIGATION_TYPES');
checkArray('./src/components/auth-gate-modal.tsx', /SPECIALIZATIONS\s*=\s*\[([\s\S]*?)\];/, 'SPECIALIZATIONS');
checkArray('./src/components/auth-gate-modal.tsx', /COMMON_CROPS\s*=\s*\[([\s\S]*?)\];/, 'COMMON_CROPS');
