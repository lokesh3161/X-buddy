@echo off
title X Buddy — Master Startup
color 0D
set NPM=C:\Program Files\nodejs\npm.cmd
set AGENT_DIR=C:\Users\Lokesh Thanala\OneDrive\Desktop\xbuddy-print-agent
set WEB_DIR=C:\Users\Lokesh Thanala\OneDrive\Desktop\xerox buddy
set CLOUDFLARED=%AGENT_DIR%\cloudflared.exe
set TUNNEL_LOG=%AGENT_DIR%\tunnel.log
set TUNNEL_ERR=%AGENT_DIR%\tunnel_err.log
set GIT=C:\Program Files\Git\bin\git.exe
set GAS_URL=https://script.google.com/macros/s/AKfycbwDcsGng774iNQ9zNdBt-bdkIFGSg7_lvr5MRvIzzqE6s9bGex7ej1U1WChrY-KgOM/exec

echo.
echo  X Buddy Master Startup
echo  ======================
echo.

:: ── STEP 1: Start Cloudflare Tunnel ──────────────────────────────────────
echo [1/5] Starting Cloudflare Tunnel...
if exist "%TUNNEL_LOG%" del "%TUNNEL_LOG%"
if exist "%TUNNEL_ERR%" del "%TUNNEL_ERR%"

powershell -NoProfile -Command "Start-Process -FilePath '%CLOUDFLARED%' -ArgumentList 'tunnel','--url','http://localhost:3001' -RedirectStandardOutput '%TUNNEL_LOG%' -RedirectStandardError '%TUNNEL_ERR%' -WindowStyle Hidden"

echo      Waiting for tunnel URL...
set TUNNEL_URL=
set /a COUNT=0

:WAIT_LOOP
timeout /t 2 /nobreak >nul
set /a COUNT+=1
if %COUNT% GTR 25 goto TUNNEL_FAILED

for /f "delims=" %%u in ('powershell -NoProfile -Command "$f1='%TUNNEL_LOG%'; $f2='%TUNNEL_ERR%'; $c=''; if(Test-Path $f1){$c+=Get-Content $f1 -Raw -ErrorAction SilentlyContinue}; if(Test-Path $f2){$c+=Get-Content $f2 -Raw -ErrorAction SilentlyContinue}; if($c -match 'https://[a-z0-9-]+\.trycloudflare\.com'){$matches[0]}"') do set TUNNEL_URL=%%u

if "%TUNNEL_URL%"=="" goto WAIT_LOOP
echo      Tunnel URL: %TUNNEL_URL%
echo.
goto TUNNEL_OK

:TUNNEL_FAILED
echo      Could not detect tunnel URL automatically.
set /p TUNNEL_URL=      Paste your tunnel URL manually: 
echo.

:TUNNEL_OK

:: ── STEP 2: Push tunnel URL to GitHub ────────────────────────────────────
echo [2/5] Pushing tunnel URL to GitHub...
echo %TUNNEL_URL%> "%WEB_DIR%\public\tunnel-url.txt"
cd /d "%WEB_DIR%"
"%GIT%" add public/tunnel-url.txt >nul 2>&1
"%GIT%" commit -m "tunnel: %TUNNEL_URL%" >nul 2>&1
"%GIT%" push origin main >nul 2>&1
echo      Tunnel URL pushed to GitHub!
echo.

:: ── STEP 3: Save tunnel URL to GAS (backup) ──────────────────────────────
echo [3/5] Saving tunnel URL to GAS...
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri ('%GAS_URL%?action=setTunnelUrl&url='+[Uri]::EscapeDataString('%TUNNEL_URL%')) -UseBasicParsing | Out-Null; Write-Host '     Saved to GAS!' } catch { Write-Host '     Warning: Could not save to GAS' }"
echo.

:: ── STEP 4: Start Print Agent ─────────────────────────────────────────────
echo [4/5] Starting Print Agent...
start "X Buddy Print Agent" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && set TUNNEL_LOG=%TUNNEL_LOG% && cd /d "%AGENT_DIR%" && node index.js"
timeout /t 3 /nobreak >nul
echo      Print Agent started!
echo.

:: ── STEP 5: Start Website ─────────────────────────────────────────────────
echo [5/5] Starting Website...
start "X Buddy Website" cmd /k "set PATH=C:\Program Files\nodejs;%PATH% && cd /d "%WEB_DIR%" && "%NPM%" run dev"
timeout /t 6 /nobreak >nul
start "" "http://localhost:5173"
start "" "http://localhost:5173/booth.html"
echo      Website started!
echo.

echo  ==========================================
echo  Everything is running!
echo.
echo  Website:    http://localhost:5173
echo  Booth:      http://localhost:5173/booth.html
echo  Tunnel URL: %TUNNEL_URL%
echo  ==========================================
echo.
pause
