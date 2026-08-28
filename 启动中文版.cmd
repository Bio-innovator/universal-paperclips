@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo 未检测到 Node.js，无法启动本地游戏。
  echo 请安装 Node.js 后重新双击本文件。
  pause
  exit /b 1
)

set "PAPERCLIPS_OPEN=1"
node server.cjs

if errorlevel 1 pause
