@echo off
echo ================================================
echo PYTHON PROCESS KILLER - BATCH VERSION
echo ================================================
echo Killing all Python processes...
echo.

taskkill /f /im python.exe 2>nul && echo ✅ Killed python.exe || echo ℹ️  No python.exe found
taskkill /f /im pythonw.exe 2>nul && echo ✅ Killed pythonw.exe || echo ℹ️  No pythonw.exe found  
taskkill /f /im py.exe 2>nul && echo ✅ Killed py.exe || echo ℹ️  No py.exe found
taskkill /f /im python3.exe 2>nul && echo ✅ Killed python3.exe || echo ℹ️  No python3.exe found
taskkill /f /im python3.11.exe 2>nul && echo ✅ Killed python3.11.exe || echo ℹ️  No python3.11.exe found

echo.
echo 🎉 Process termination complete!
echo.
pause
