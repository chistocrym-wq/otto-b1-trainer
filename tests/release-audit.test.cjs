'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=['index.html','app.js','styles.css','guide-data.js','learning-bank.js','learning-v2.js','diagnostic-bank.js','diagnostic-engine.js','content-readiness.js','netlify.toml','netlify/functions/otto-chat.mjs','netlify/functions/transcribe.mjs'];
const secretPatterns=[
 ['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i],
 ['GitHub token',/gh[pousr]_[A-Za-z0-9]{20,}/],
 ['GitHub fine-grained token',/github_pat_[A-Za-z0-9_]{20,}/],
 ['Netlify token',/nfp_[A-Za-z0-9_-]{20,}/i],
 ['Bearer token',/Bearer\s+[A-Za-z0-9._-]{24,}/i],
 ['literal secret assignment',/(?:api[_-]?key|secret|access[_-]?token|private[_-]?token)\s*[:=]\s*['"][A-Za-z0-9_.\-]{16,}['"]/i]
];
for(const file of files){
 const c=fs.readFileSync(path.join(root,file),'utf8');
 for(const [label,re] of secretPatterns)assert.equal(re.test(c),false,file+' contains possible '+label);
}
const app=fs.readFileSync(path.join(root,'app.js'),'utf8'),index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal(/111111/.test(app),false,'fixed verification credential');
assert.equal(/console\.(?:log|debug|trace)\s*\(/.test(app),false,'debug console call');
assert.equal(/<span class="beta-badge">|Продолжить в Beta|Доступно в Beta|Профиль для тестовой версии|Otto Personal скоро будет доступен/.test(index+'\n'+app),false,'visible beta/placeholder copy remains');
assert.ok(/\.netlify\/functions\/otto-chat/.test(app),'real Otto endpoint not wired');
assert.ok(/\.netlify\/functions\/transcribe/.test(app),'transcription endpoint not wired');
assert.ok(/process\.env\.OPENAI_API_KEY/.test(fs.readFileSync(path.join(root,'netlify/functions/otto-chat.mjs'),'utf8')),'server key env lookup missing');
assert.equal(/OPENAI_API_KEY\s*=/.test(index+'\n'+app),false,'OpenAI key assignment in frontend');
assert.ok(/const data=\{url:location\.origin\+location\.pathname\}/.test(app),'Share must default to URL only');
console.log('release/no-secrets regression: PASS');
