const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const publicRoot = path.join(projectRoot, 'public');
const read = relativePath => fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

const html = read('public/index.html');
const projects = read('public/projects.js');
const logic = read('public/logic.js');
const main = read('public/main.js');

check(html.includes('<html lang="zh-CN">'), '页面缺少中文语言声明');
check(html.includes('<title>宇宙回形针</title>'), '页面标题不是中文');
check(!/plugins\/(Debug|BetterSimPrestige|PerformanceMonitor)\.js/.test(html), '正式入口仍加载调试或扩展插件');
check((projects.match(/^\s*title:\s*/gm) || []).length === 96, '项目标题数量异常');
check((projects.match(/^\s*description:\s*/gm) || []).length === 96, '项目说明数量异常');
check((projects.match(/displayMessage\(/g) || []).length === 94, '项目消息数量异常');

const forbiddenVisibleText = [
  '"A100"', '"B100"', '"GREEDY"', '"GENEROUS"', '"MINIMAX"',
  '"TIT FOR TAT"', '"BEAT LAST"', 'sextillion', 'nonillion',
  '5 oct 回形针', 'a game by', 'combat programming by', 'release the'
];
for (const fragment of forbiddenVisibleText) {
  check(!projects.includes(fragment) && !main.includes(fragment), `仍有可见英文：${fragment}`);
}
check(logic.includes('placeValue[placeValue.length - 1] = "百康";'), '最高级大数单位未汉化');

const scripts = fs.readdirSync(publicRoot, { recursive: true })
  .filter(file => file.endsWith('.js'))
  .map(file => path.join(publicRoot, file));
for (const script of scripts) {
  const result = spawnSync(process.execPath, ['--check', script], { encoding: 'utf8' });
  check(result.status === 0, `${path.relative(projectRoot, script)} 语法检查失败：${result.stderr.trim()}`);
}

if (failures.length > 0) {
  console.error(failures.map(message => `失败：${message}`).join('\n'));
  process.exit(1);
}

console.log(`检查通过：96 个项目、94 条项目消息、${scripts.length} 个脚本语法正常。`);
