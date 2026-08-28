const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const host = '127.0.0.1';
const port = Number(process.env.PAPERCLIPS_PORT || 1234);
const root = path.resolve(__dirname, 'public');
const address = `http://${host}:${port}/`;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function openBrowser() {
  if (process.env.PAPERCLIPS_OPEN !== '1') return;
  const child = spawn('cmd.exe', ['/d', '/s', '/c', 'start', '', address], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
}

const server = http.createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('仅支持读取游戏文件');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, address).pathname);
  } catch {
    response.writeHead(400);
    response.end('请求地址无效');
    return;
  }

  if (pathname === '/') pathname = '/index.html';
  const filePath = path.resolve(root, `.${pathname}`);
  if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    response.end('拒绝访问');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      response.writeHead(404);
      response.end('未找到文件');
      return;
    }

    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
    });
    if (request.method === 'HEAD') {
      response.end();
      return;
    }
    fs.createReadStream(filePath).pipe(response);
  });
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.log(`本地游戏已经在运行：${address}`);
    openBrowser();
    process.exit(0);
  }
  console.error('本地服务器启动失败：', error.message);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log('宇宙回形针纯中文版已启动。');
  console.log(`游戏地址：${address}`);
  console.log('关闭此窗口即可停止本地服务器。');
  openBrowser();
});
