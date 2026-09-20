'use strict';

const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const parts = [1,2,3,4,5].map(n => fs.readFileSync(path.join(root, 'app', 'part-0' + n + '.txt'), 'utf8'));
const combined = parts.join('');

if (!combined.startsWith('<!doctype html>')) throw new Error('Static assembly must start with <!doctype html>');
if (!combined.includes('<script src="app/i01.js"></script>')) throw new Error('B1-I01 runtime loader missing from assembled app');
if (!combined.endsWith('</body></html>')) throw new Error('Static assembly must close body/html');

const source = fs.readFileSync(path.join(root, 'app', 'i01.js'), 'utf8');
new vm.Script(source, { filename: 'app/i01.js' });

const api = require('../app/i01.js');
if (api.CONTENT.length < 6) throw new Error('Expected at least six limited-slice tasks');
if (new Set(api.CONTENT.map(x => x.id)).size !== api.CONTENT.length) throw new Error('Duplicate task IDs');
if (new Set(api.CONTENT.map(x => x.contentFingerprint)).size !== api.CONTENT.length) throw new Error('Duplicate content fingerprints');
if (new Set(api.CONTENT.map(x => x.stimulusId)).size !== api.CONTENT.length) throw new Error('Duplicate stimulus IDs');
if (new Set(api.CONTENT.map(x => x.variantGroupId)).size !== api.CONTENT.length) throw new Error('Duplicate variant groups');
if (new Set(api.CONTENT.map(x => x.skillNodeId)).size < 2) throw new Error('Need at least two frozen F01 Micro-skills');

console.log('B1-I01 BUILD PASS');
console.log('Static parts:', parts.length);
console.log('Runtime tasks:', api.CONTENT.length);
console.log('Micro-skills:', new Set(api.CONTENT.map(x => x.skillNodeId)).size);
