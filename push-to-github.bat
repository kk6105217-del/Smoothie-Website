@echo off
echo ========================================================
echo       VK Technology - Push Code to GitHub
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/2] Checking git status...
git status

echo.
echo [2/2] Pushing branch 'main' to GitHub...
git push -u origin main

echo.
echo ========================================================
echo If successful, your repository is now updated on:
echo https://github.com/kk6105217-del/VK-Technology-E-commerce-Website
echo ========================================================
pause
