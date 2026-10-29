// Structural checks only: not a substitute for WeChat Developer Tools rendering.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../miniprogram');
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
assert.equal(app.pages.length, 5);
assert.deepEqual(app.tabBar.list.map(x => x.pagePath), app.pages);
for (const page of app.pages) {
  for (const ext of ['.js', '.json', '.wxml', '.wxss']) assert(fs.existsSync(path.join(root, page + ext)), page + ext);
  const registered = {};
  const source = fs.readFileSync(path.join(root, page + '.js'), 'utf8');
  const createRequire = require('node:module').createRequire;
  vm.runInNewContext(source, { Page: config => Object.assign(registered, config), require: createRequire(path.join(root, page + '.js')) });
  const wxml = fs.readFileSync(path.join(root, page + '.wxml'), 'utf8');
  for (const match of wxml.matchAll(/(?:bind|catch):?[a-z]+="([A-Za-z_$][\w$]*)"/g)) {
    assert.equal(typeof registered[match[1]], 'function', `${page}: missing handler ${match[1]}`);
  }
  assert(!/<(?:div|span|img|select)\b/.test(wxml), `${page}: web-only element`);
  console.log('PASS', page, 'files + event handlers');
}
function check(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) check(file);
    else if (file.endsWith('.json')) JSON.parse(fs.readFileSync(file, 'utf8'));
    else if (file.endsWith('.js')) new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  }
}
check(root);
console.log('PASS JSON + JavaScript syntax');
