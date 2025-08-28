#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 GitHub Pages Deployment Trigger Script');
console.log('=====================================\n');

// Function to run shell commands
function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { encoding: 'utf8', cwd: __dirname });
    console.log(`✅ ${description} completed`);
    if (output.trim()) {
      console.log(`   Output: ${output.trim()}`);
    }
    return output;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

// Main execution
try {
  // Check if we're in the right directory
  if (!fs.existsSync('apps/web/src/app/page.tsx')) {
    throw new Error('This script must be run from the project root directory');
  }

  console.log('1. Adding deployment trigger comment...');
  const timestamp = new Date().toISOString();
  const triggerComment = `\n// Deployment trigger: ${timestamp}`;
  
  const pageFile = 'apps/web/src/app/page.tsx';
  const currentContent = fs.readFileSync(pageFile, 'utf8');
  fs.writeFileSync(pageFile, currentContent + triggerComment);
  console.log('✅ Trigger comment added to page.tsx');

  console.log('\n2. Staging changes...');
  runCommand('git add apps/web/src/app/page.tsx', 'Staging page.tsx changes');

  console.log('\n3. Committing changes...');
  runCommand(`git commit -m "Trigger deployment: ${timestamp}"`, 'Committing trigger changes');

  console.log('\n4. Pushing to GitHub...');
  runCommand('git push origin master', 'Pushing changes to GitHub');

  console.log('\n🎉 Deployment triggered successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Go to https://github.com/KingEndubis/Xbon/actions to check workflow status');
  console.log('2. Ensure GitHub Pages source is set to "GitHub Actions" in repository settings');
  console.log('3. Wait 5-10 minutes and check https://kingendubis.github.io/Xbon/');
  console.log('\n📖 For detailed troubleshooting, see: diagnose-github-pages.md');

} catch (error) {
  console.error('\n💥 Script failed:', error.message);
  console.log('\n📖 For manual troubleshooting, see: diagnose-github-pages.md');
  process.exit(1);
}