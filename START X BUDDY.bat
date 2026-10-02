@echo off
title X Buddy — Master Startup
color 0D

set "AGENT_DIR=C:\Users\SRKREC\Desktop\xbuddy-print-agent"
set "WEB_DIR=f:\xerox buddy"
set "PATH=C:\Program Files\nodejs;%PATH%"

echo.
echo  X Buddy Print Station Startup
echo  ==============================
echo.

call "%AGENT_DIR%\START_XBUDDY_PRINT_STATION.bat"
pause
