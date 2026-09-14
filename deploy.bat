@echo off
title Deploy Cricket Turf Booking to Firebase Hosting
cd /d "%~dp0"
echo ========================================================
echo   Deploying Cricket Turf Booking to Firebase Hosting...
echo ========================================================
echo.

echo Checking Firebase Login...
call firebase login

echo.
echo Deploying your site live to Firebase...
call firebase deploy --only hosting

echo.
echo ========================================================
echo   Deployment Complete! Your site is live 24/7 online.
echo ========================================================
pause
