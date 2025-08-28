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
          body: data.substring(0, 500) // First 500 characters
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function main() {
  const url = 'https://kingendubis.github.io/Xbon/';
  
  console.log(`Checking deployment at: ${url}`);
  console.log('=' .repeat(50));
  
  try {
    const result = await checkWebsite(url);
    
    console.log(`Status Code: ${result.statusCode}`);
    console.log(`Content-Type: ${result.headers['content-type'] || 'Not specified'}`);
    console.log('\nFirst 500 characters of response:');
    console.log('-'.repeat(30));
    console.log(result.body);
    
    if (result.statusCode === 200) {
      if (result.body.includes('X Bon') || result.body.includes('Exclusive Commodities Exchange')) {
        console.log('\n✅ SUCCESS: X Bon application is deployed and accessible!');
      } else if (result.body.includes('README') || result.body.includes('markdown')) {
        console.log('\n⚠️  WARNING: Still showing README.md instead of the application');
      } else {
        console.log('\n❓ UNKNOWN: Website is accessible but content is unclear');
      }
    } else {
      console.log(`\n❌ ERROR: Website returned status code ${result.statusCode}`);
    }
    
  } catch (error) {
    console.log(`\n❌ ERROR: Failed to access website`);
    console.log(`Error: ${error.message}`);
  }
}

main();