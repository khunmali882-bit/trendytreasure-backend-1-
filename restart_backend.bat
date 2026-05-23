taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul
cd /d d:\Trendytreasure\BackEnd
start /B node server.js > backend.log 2>&1
