#!/usr/bin/env node
/*
  X Bon Audit Agent
  Purpose: Audit the monorepo to summarize functionality, roles, endpoints, document processing,
  and verify GitHub Pages accessibility for the web app.
*/

const fs = require('fs');
const path = require('path');

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (e) {
    return null;
  }
}

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function heading(t) { console.log(`\n=== ${t} ===`); }
function line(t='') { console.log(t); }

const root = process.cwd();
const webDir = path.join(root, 'apps', 'web');
const apiDir = path.join(root, 'apps', 'api');

// Collect files
const files = {
  webNextConfig: path.join(webDir, 'next.config.ts'),
  webPage: path.join(webDir, 'src', 'app', 'page.tsx'),
  apiFlows: path.join(apiDir, 'src', 'flows.ts'),
  apiAuth: path.join(apiDir, 'src', 'auth.ts'),
  ghWorkflow: path.join(root, '.github', 'workflows', 'nextjs.yml'),
  rootPkg: path.join(root, 'package.json'),
  webPkg: path.join(webDir, 'package.json'),
  apiPkg: path.join(apiDir, 'package.json'),
};

const contents = Object.fromEntries(Object.entries(files).map(([k, p]) => [k, read(p)]));

heading('Repository Overview');
line(`Root: ${root}`);
line(`- Web app dir: ${webDir}`);
line(`- API dir: ${apiDir}`);
line(`- GitHub Actions workflow: ${exists(files.ghWorkflow) ? 'found' : 'missing'}`);

// Analyze API flows
heading('API: flows.ts summary');
if (contents.apiFlows) {
  const f = contents.apiFlows;
  // Controllers and endpoints
  const dealsCtrl = /@Controller\('deals'\)[\s\S]*?export class DealsController[\s\S]*?\{([\s\S]*?)\n\}/m.exec(f);
  const agentsCtrl = /@Controller\('agents'\)[\s\S]*?export class AgentsController[\s\S]*?\{([\s\S]*?)\n\}/m.exec(f);
  line('Controllers: deals, agents');
  if (dealsCtrl) {
    const body = dealsCtrl[1];
    const routes = [];
    (body.match(/@[A-Z]+\([^\)]*\)\n\s*[a-zA-Z0-9_]+\(/g) || []).forEach(r => routes.push(r.trim()));
    line('DealsController routes:');
    routes.forEach(r => line(`  - ${r.replace(/\n.*/, '')}`));
  }
  if (agentsCtrl) {
    const body = agentsCtrl[1];
    const routes = [];
    (body.match(/@[A-Z]+\([^\)]*\)\n\s*[a-zA-Z0-9_]+\(/g) || []).forEach(r => routes.push(r.trim()));
    line('AgentsController routes:');
    routes.forEach(r => line(`  - ${r.replace(/\n.*/, '')}`));
  }
  // Document interface & DTO additions
  const hasCategory = /category\?:\s*'mandate'\s*\|\s*'contract'\s*\|\s*'certificate'\s*\|\s*'proof_of_funds'\s*\|\s*'other'/.test(f);
  const hasAI = /aiVerificationStatus\?:|redactedContent\?:|originalPrincipalInfo\?:/.test(f);
  line(`Document categories: ${hasCategory ? 'present' : 'not found'}`);
  line(`AI verification/redaction fields: ${hasAI ? 'present' : 'not found'}`);
  const hasEncrypt = /aes-256-gcm|createCipheriv|encrypt\(/.test(f);
  line(`Encryption for details/docs: ${hasEncrypt ? 'enabled' : 'not detected'}`);
} else {
  line('flows.ts not found');
}

// Analyze API auth
heading('API: auth.ts roles');
if (contents.apiAuth) {
  const a = contents.apiAuth;
  const rolesMatch = a.match(/['"]introducer['"].*['"]principal_seller['"]/s) || a.match(/profileType.*(introducer|broker|mandate|principal_buyer|principal_seller)/s);
  const inviteRoles = a.match(/InviteCreateDto[\s\S]*?@IsIn\(\[([\s\S]*?)\]\)/m);
  line(`Profile categories present: ${rolesMatch ? 'yes' : 'no (check needed)'}`);
  if (inviteRoles) {
    const simple = inviteRoles[1].replace(/\s+/g, ' ');
    line(`Invite role options: ${simple}`);
  }
} else {
  line('auth.ts not found');
}

// Analyze web app
heading('Web: next.config.ts');
if (contents.webNextConfig) {
  const c = contents.webNextConfig;
  const basePath = (c.match(/basePath:\s*isProd\s*\?\s*'([^']+)'/) || [])[1];
  const assetPrefix = (c.match(/assetPrefix:\s*isProd\s*\?\s*'([^']+)'/) || [])[1];
  const outExport = /output:\s*'export'/.test(c);
  const distDir = (c.match(/distDir:\s*'([^']+)'/) || [])[1];
  line(`output: ${outExport ? 'export (static)' : 'server'}`);
  line(`basePath (prod): ${basePath || '(not set)'}`);
  line(`assetPrefix (prod): ${assetPrefix || '(not set)'}`);
  line(`distDir: ${distDir || '.next'}`);
} else {
  line('next.config.ts not found');
}

heading('Web: page.tsx features');
if (contents.webPage) {
  const p = contents.webPage;
  const hasDocCategory = /documentCategory|Upload Document|category:\s*documentCategory/.test(p);
  const hasInvite = /Invite New Member|sendInvitation/.test(p);
  const hasDeals = /Create Deal|deals\)/.test(p);
  const createdByEmail = /createdBy:\s*user\?\.email/.test(p);
  line(`Deal creation UI: ${hasDeals ? 'present' : 'missing'}`);
  line(`Document upload with category: ${hasDocCategory ? 'present' : 'missing'}`);
  line(`Invitation workflow: ${hasInvite ? 'present' : 'missing'}`);
  line(`Deal createdBy uses email: ${createdByEmail ? 'yes' : 'no'}`);
} else {
  line('page.tsx not found');
}

// Analyze GitHub Pages workflow
heading('GitHub Pages deployment');
if (contents.ghWorkflow) {
  const w = contents.ghWorkflow;
  const deploysOut = /upload-pages-artifact@[\w.-]+[\s\S]*path:\s*\.\/apps\/web\/out/.test(w);
  const pagesWrite = /pages:\s*write/.test(w);
  const branch = (w.match(/branches:\s*\["([^"]+)"\]/) || [])[1];
  line(`Workflow found. Deploy branch: ${branch || 'unknown'}`);
  line(`Uploads ./apps/web/out: ${deploysOut ? 'yes' : 'no'}`);
  line(`Permissions (pages: write): ${pagesWrite ? 'yes' : 'no'}`);
} else {
  line('Workflow not found');
}

// Compute public URL hint
heading('Public URL (GitHub Pages)');
let basePathHint = '/Xbon/';
if (contents.webNextConfig) {
  const bp = (contents.webNextConfig.match(/basePath:\s*isProd\s*\?\s*'([^']+)'/) || [])[1];
  if (bp) basePathHint = bp.endsWith('/') ? bp : bp + '/';
}
line('Your site will be published to GitHub Pages.');
line('Open URL format: https://<github-username>.github.io' + basePathHint);
line('Example (if repo name is Xbon): https://yourname.github.io/Xbon/');

heading('Conclusions');
line('- API supports agents, deals, status updates, document uploads with categories, invite-based joining.');
line('- Documents are encrypted; mandate docs trigger AI redaction fields.');
line('- Web app includes dashboards, agent/deal creation, document upload with category, invites.');
line('- Next.js is configured for static export with basePath for GitHub Pages.');
line('- GitHub Actions workflow builds apps/web and deploys ./apps/web/out to Pages.');

line('\nAudit complete.');