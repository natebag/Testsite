// Fix literal \n sequences in the voting system file
const fs = require('fs');

try {
  // Read the file
  const content = fs.readFileSync('src/voting/solana-voting-system.js', 'utf8');
  
  // Replace all literal \n with actual newlines
  const fixed = content.replace(/\\n/g, '\n');
  
  // Write back the fixed content
  fs.writeFileSync('src/voting/solana-voting-system.js', fixed, 'utf8');
  
  console.log('✅ Fixed literal newlines in solana-voting-system.js');
  
  // Test the syntax
  const { execSync } = require('child_process');
  try {
    execSync('node --check src/voting/solana-voting-system.js', { stdio: 'pipe' });
    console.log('✅ Syntax is now valid');
  } catch (error) {
    console.log('❌ Still has syntax errors');
  }
  
} catch (error) {
  console.error('Error:', error.message);
}