@echo off
title 🎵 Audio-Lyric Splitter - Launcher
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════════════════════╗
echo ║                                                                          ║
echo ║   🎵 AUDIO-LYRIC SPLITTER 🎵                                            ║
echo ║                                                                          ║
echo ║   Split audio into segments for lyric videos                            ║
echo ║                                                                          ║
echo ╚══════════════════════════════════════════════════════════════════════════╝
echo.
echo.

echo [1/2] Checking files...
timeout /t 1 /nobreak >nul

if not exist "index.html" (
    color 0C
    echo ❌ ERROR: index.html not found!
    echo Please run this from the Audio-Lyric-Splitter folder.
    pause
    exit /b 1
)

echo ✅ Files found!
echo.

echo [2/2] Opening Audio-Lyric Splitter...
timeout /t 1 /nobreak >nul

REM Open directly with file:// protocol
start "" "index.html"

echo.
echo ╔══════════════════════════════════════════════════════════════════════════╗
echo ║                                                                          ║
echo ║   ✅ AUDIO-LYRIC SPLITTER IS NOW OPEN!                                  ║
echo ║                                                                          ║
echo ║   📚 How to Use:                                                         ║
echo ║   1. Upload your audio file                                             ║
echo ║   2. Paste lyrics (or let AI detect)                                    ║
echo ║   3. Click "Analyze & Detect Timing"                                    ║
echo ║   4. Download segments as ZIP                                           ║
echo ║   5. Use in Lyric Video Generator!                                      ║
echo ║                                                                          ║
echo ╚══════════════════════════════════════════════════════════════════════════╝
echo.
echo.

echo This window will close in 5 seconds...
timeout /t 5 /nobreak >nul

exit
