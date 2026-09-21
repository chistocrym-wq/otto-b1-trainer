'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

const frontend=[
  'index.html','app.js','styles.css','guide-data.js','learning-bank.js',
  'diagnostic-bank.js','diagnostic-engine.js','content-readiness.js','netlify.toml'
];

const secretPatterns=[
  ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i],
  ['GitHub token',/gh[pousr]_[A-Za-z0-9]{20,}/],
  ['GitHub fine-grained token',/github_pat_[A-Za-z0-9_]{20,}/],
  ['Netlify token',/nfp_[A-Za-z0-9_-]{20,}/i],
  ['Bearer token',/Bearer\s+[A-Za-z0-9._-]{24,}/i],
  ['literal secret assignment',/(?:api[_-]?key|secret|access[_-]?token|private[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_.\-]{16,}['"]/i]
];

for(const file of frontend){
  const c=fs.readFileSync(path.join(root,file),'utf8');
  for(const [label,re] of secretPatterns){
    assert.equal(re.test(c),false,file+' contains possible '+label);
  }
  assert.equal(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/i.test(c),false,file+' contains localhost URL');
}

const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

assert.equal(/111111/.test(app),false,'fixed preview verification credential remains in frontend');
assert.equal(/console\.(?:log|debug|trace)\s*\(/.test(app),false,'debug console call remains in app.js');
assert.equal(/content QA pending|QA_PENDING|source_status/i.test(app),false,'technical pending language leaks to UI');
assert.equal(/CONTENT_READY/.test(index),false,'technical readiness term leaks to index');
assert.ok(/beta-badge/.test(index),'Beta badge missing');
assert.ok(/Otto Personal скоро будет доступен/.test(app),'Ask Otto must show honest Beta state');
assert.ok(/const data=\{url:location\.origin\+location\.pathname\}/.test(app),'Share must default to URL only');

console.log('release/no-secrets regression: PASS');
