@echo off
title X Buddy — Master Startup
color 0D
set NODE=C:\Program Files\nodejs\node.exe
set NPM=C:\Program Files\nodejs\npm.cmd
set AGENT_DIR=C:\Users\Lokesh Thanala\OneDrive\Desktop\xbuddy-print-agent
set WEB_DIR=C:\Users\Lokesh Thanala\OneDrive\Desktop\xerox buddy
set API_FILE=C:\Users\Lokesh Thanala\OneDrive\Desktop\xerox buddy\src\utils\api.js
set CLOUDFLARED=%AGENT_DIR%\cloudflared.exe
set TUNNEL_LOG=%TEMP%\xbuddy_tunnel.log

echo.
echo  X Buddy Master Startup
echo  ======================
echo.

:: ── STEP 1: Start Cloudflare Tunnel ──────────────────────────────────────
echo [1/5] Starting Cloudflare Tunnel...
if exist "%TUNNEL_LOG%" del "%TUNNEL_LOG%"

start "" /min "%AGENT_DIR%\cloudflared.exe" tunnel --url http://localhost:3001 > "%TUNNEL_LOG%" 2>"%TEMP%\xbuddy_tunnel_err.log"

echo      Waiting for tunnel URL (up to 30 seconds)...
set TUNNEL_URL=
set /a COUNT=0

:WAIT_LOOP
timeout /t 2 /nobreak >nul
set /a COUNT+=1
if %COUNT% GTR 15 goto TUNNEL_FAILED

for /f "delims=" %%u in ('powershell -Command "try { $c = Get-Content '%TEMP%\xbuddy_tunnel_err.log' -ErrorAction Stop; $line = $c | Select-String 'trycloudflare.com'; if ($line) { if ($line -match 'https://[a-z0-9\-]+\.trycloudflare\.com') { $matches[0] } } } catch {}"') do set TUNNEL_URL=%%u

if "%TUNNEL_URL%"=="" goto WAIT_LOOP

echo      Tunnel URL: %TUNNEL_URL%
echo.
goto TUNNEL_OK

:TUNNEL_FAILED
echo      Could not get tunnel URL automatically.
set /p TUNNEL_URL=      Paste your tunnel URL manually: 
echo.

:TUNNEL_OK

:: ── STEP 2: Update api.js ────────────────────────────────────────────────
echo [2/5] Updating api.js...
powershell -Command "(Get-Content '%API_FILE%') -replace \"const LOCAL_AGENT = '.*'\", \"const LOCAL_AGENT = '%TUNNEL_URL%'\" | Set-Content '%API_FILE%'"
echo      api.js updated!
echo.

:: ── STEP 3: Push to GitHub ───────────────────────────────────────────────
echo [3/5] Pushing to GitHub...
cd /d "%WEB_DIR%"
git add src/utils/api.js >nul 2>&1
git commit -m "Auto-update Cloudflare tunnel URL" >nul 2>&1
git push origin main >nul 2>&1
echo      Pushed to GitHub!
echo.

:: ── STEP 4: Start Print Agent ────────────────────────────────────────────
echo [4/5] Starting Print Agent...
start "X Buddy Print Agent" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && cd /d "%AGENT_DIR%" && node index.js"
timeout /t 3 /nobreak >nul
echo      Print Agent started!
echo.

:: ── STEP 5: Start Website ────────────────────────────────────────────────
echo [5/5] Starting Website...
start "X Buddy Website" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && cd /d "%WEB_DIR%" && "%NPM%" run dev"
timeout /t 6 /nobreak >nul
start "" "http://localhost:5173"
echo      Website started!
echo.

echo  ==========================================
echo  Everything is running!
echo.
echo  Website:    http://localhost:5173
echo  Tunnel URL: %TUNNEL_URL%
echo  ==========================================
echo.
pause
