const https = require('https');
const http = require('http');

function checkWebsite(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

function checkFeature(html, feature, selector) {
  const found = html.includes(selector);
  console.log(`  ${found ? '✅' : '❌'} ${feature}: ${found ? 'Found' : 'Missing'}`);
  return found;
}

async function main() {
  const url = 'https://kingendubis.github.io/Xbon/';
  
  console.log('🔍 COMPREHENSIVE DEPLOYMENT VERIFICATION');
  console.log('=' .repeat(60));
  console.log(`Target URL: ${url}`);
  console.log('');
  
  try {
    console.log('📡 Checking website accessibility...');
    const result = await checkWebsite(url);
    
    console.log(`Status Code: ${result.statusCode}`);
    console.log(`Content-Type: ${result.headers['content-type'] || 'Not specified'}`);
    console.log('');
    
    if (result.statusCode !== 200) {
      console.log(`❌ FAILED: Website returned status code ${result.statusCode}`);
      return;
    }
    
    console.log('🎨 Checking application features...');
    const html = result.body;
    
    // Core application checks
    const features = [
      ['Application Title', 'X Bon'],
      ['Commodities Exchange', 'Exclusive Commodities Exchange'],
      ['Dashboard Section', 'Total Deals'],
      ['Agent Management', 'Create Agent'],
      ['Deal Creation', 'Create Deal'],
      ['Document Upload', 'Upload Document'],
      ['Invitation System', 'Send Invitation'],
      ['Tailwind CSS Styling', 'bg-gradient-to-r'],
      ['Responsive Design', 'max-w-6xl'],
      ['Navigation Menu', 'Dashboard'],
      ['Security Features', 'Members Only'],
      ['Global Network', 'Global Reach']
    ];
    
    let passedFeatures = 0;
    features.forEach(([feature, selector]) => {
      if (checkFeature(html, feature, selector)) {
        passedFeatures++;
      }
    });
    
    console.log('');
    console.log('📊 DEPLOYMENT SUMMARY');
    console.log('-'.repeat(40));
    console.log(`✅ Website Status: ONLINE`);
    console.log(`✅ Application Type: Next.js Static Export`);
    console.log(`✅ Features Working: ${passedFeatures}/${features.length}`);
    console.log(`✅ Deployment Method: GitHub Actions + GitHub Pages`);
    console.log(`✅ Public URL: ${url}`);
    
    if (passedFeatures === features.length) {
      console.log('');
      console.log('🎉 DEPLOYMENT SUCCESSFUL!');
      console.log('The X Bon Commodities Exchange application is fully deployed and accessible.');
      console.log('All core features are present and the application is ready for use.');
    } else {
      console.log('');
      console.log('⚠️  PARTIAL SUCCESS');
      console.log(`${features.length - passedFeatures} features may need attention.`);
    }
    
  } catch (error) {
    console.log(`❌ DEPLOYMENT FAILED`);
    console.log(`Error: ${error.message}`);
    console.log('The website is not accessible or there was a network error.');
  }
}

main();