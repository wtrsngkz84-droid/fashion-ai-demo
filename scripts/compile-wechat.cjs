// Compile templates/styles with the user's installed WeChat Developer Tools.
// This is a compiler check, not a simulator, preview upload, or device test.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const project = path.resolve(__dirname, '../miniprogram');
const install = process.argv[2] || process.env.WECHAT_DEVTOOLS_PATH;
if (!install) {
  console.error('Usage: node scripts/compile-wechat.cjs "<WeChat Developer Tools installation directory>"');
  process.exit(1);
}
const compiler = path.join(install, 'resources/app.asar.unpacked/node_modules/wcc-exec');
function files(dir, extension) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? files(file, extension) : file.endsWith(extension) ? [path.relative(project, file)] : [];
  }).sort();
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'fashion-wechat-compile-'));
const outputs = [];
try {
  for (const [binary, extension] of [['wcc.exe', '.wxml'], ['wcsc.exe', '.wxss']]) {
    const executable = path.join(compiler, binary);
    if (!fs.existsSync(executable)) throw new Error('Compiler not found: ' + executable);
    const sources = files(project, extension);
    if (!sources.length) throw new Error('No source files: ' + extension);
    // Each stylesheet must be compiled as a root, not just supplied as an import.
    const batches = binary === 'wcsc.exe' ? sources.map(source => [source]) : [sources];
    for (const [index, batch] of batches.entries()) {
      const output = path.join(temp, binary + '-' + index + '.js');
      outputs.push(output);
      const result = spawnSync(executable, ['-o', output, ...batch], { cwd: project, encoding: 'utf8', timeout: 60000, windowsHide: true });
      if (result.error) throw result.error;
      if (result.status !== 0) throw new Error(binary + ': ' + (result.stderr || result.stdout || result.status));
      if (!fs.existsSync(output) || fs.statSync(output).size === 0) throw new Error('Compiler produced no output: ' + binary);
      if (result.stderr.trim()) console.error(result.stderr.trim());
      console.log('PASS', binary, batch.join(', '), ';', fs.statSync(output).size, 'output bytes');
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  for (const output of outputs) if (fs.existsSync(output)) fs.unlinkSync(output);
  fs.rmdirSync(temp);
}
