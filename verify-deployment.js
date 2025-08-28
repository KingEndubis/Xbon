#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying deployment setup...');

// Check if required files exist
const requiredFiles = [
  'apps/web/package.json',
  'apps/web/next.config.ts',
  '.github/workflows/nextjs.yml'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    process.exit(1);
  }
});

// Test build process
console.log('\n🏗️  Testing build process...');
try {
  execSync('npm run build -w apps/web', { stdio: 'inherit' });
  console.log('✅ Build successful');
} catch (error) {
  console.log('❌ Build failed');
  process.exit(1);
}

// Check output directory
const outDir = 'apps/web/out';
if (fs.existsSync(outDir)) {
  console.log(`✅ Output directory ${outDir} exists`);
  
  // Check for index.html
  const indexPath = path.join(outDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log('✅ index.html exists in output');
    
    // Check if index.html contains expected content
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    if (indexContent.includes('<html') && indexContent.includes('</html>')) {
      console.log('✅ index.html appears to be valid HTML');
    } else {
      console.log('⚠️  index.html may not be valid HTML');
    }
  } else {
    console.log('❌ index.html missing from output');
    process.exit(1);
  }
  
  // List output files
  console.log('\n📁 Output files:');
  const files = fs.readdirSync(outDir);
  files.forEach(file => {
    console.log(`   - ${file}`);
  });
} else {
  console.log(`❌ Output directory ${outDir} missing`);
  process.exit(1);
}

console.log('\n🎉 All deployment checks passed!');
console.log('\n📋 Next steps:');
console.log('1. Go to https://github.com/KingEndubis/Xbon/actions');
console.log('2. Check if workflows are enabled');
console.log('3. Look for any failed workflow runs');
console.log('4. If needed, manually trigger the workflow');
console.log('5. Once deployed, visit https://kingendubis.github.io/Xbon/');