@echo off
title Push Cricket Turf Booking to GitHub
cd /d "%~dp0"
echo ============================================
echo   Pushing latest changes to GitHub...
echo ============================================
echo.

git add .
git commit -m "Update Cricket Turf Booking files"
git push origin main

echo.
echo ============================================
echo   GitHub Push Process Completed!
echo ============================================
pause
